import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { memberInviteResponseSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string; inviteId: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id, inviteId } = await context.params;
  const groupId = Number(id);
  const invite = Number(inviteId);
  if (!Number.isInteger(groupId) || !Number.isInteger(invite)) return jsonError("Richiesta non valida.");

  const inviteRow = await queryOne<{
    invited_user_id: number;
    status: string;
    expires_at: string | null;
  }>(
    "SELECT invited_user_id, status, expires_at FROM group_member_invites WHERE id = ? AND group_id = ?",
    [invite, groupId],
  );
  if (!inviteRow) return jsonError("Invito non trovato.", 404);
  if (inviteRow.invited_user_id !== user.id) return jsonError("Non autorizzato.", 403);
  if (inviteRow.status !== "pending") return jsonError("Invito non più valido.", 409);
  if (inviteRow.expires_at && inviteRow.expires_at <= new Date().toISOString().slice(0, 19).replace("T", " ")) {
    await execute(
      "UPDATE group_member_invites SET status = 'expired', responded_at = CURRENT_TIMESTAMP WHERE id = ?",
      [invite],
    );
    return jsonError("Invito scaduto.", 410);
  }

  const { data, response } = await parseJson(request, memberInviteResponseSchema);
  if (response) return response;

  if (data.status === "accepted") {
    await execute(
      `INSERT INTO group_members (group_id, user_id, role, status)
       VALUES (?, ?, 'member', 'active')
       ON CONFLICT(group_id, user_id) DO UPDATE SET status = 'active'`,
      [groupId, user.id],
    );

    await execute(
      "UPDATE group_member_invites SET status = 'accepted', responded_at = CURRENT_TIMESTAMP WHERE id = ?",
      [invite],
    );
  } else {
    await execute(
      "UPDATE group_member_invites SET status = 'declined', responded_at = CURRENT_TIMESTAMP WHERE id = ?",
      [invite],
    );
  }

  await execute(
    "DELETE FROM notifications WHERE user_id = ? AND type = 'group_member_invite' AND group_id = ?",
    [user.id, groupId],
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id, inviteId } = await context.params;
  const groupId = Number(id);
  const invite = Number(inviteId);
  if (!Number.isInteger(groupId) || !Number.isInteger(invite)) return jsonError("Richiesta non valida.");

  const membership = await queryOne<{ role: string }>(
    "SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'",
    [groupId, user.id],
  );
  if (!membership && user.role !== "admin") return jsonError("Non sei membro del gruppo.", 403);
  if (membership && membership.role !== "owner" && membership.role !== "co_owner" && user.role !== "admin") {
    return jsonError("Solo owner e co-owner possono revocare inviti.", 403);
  }

  const inviteRow = await queryOne<{ invited_user_id: number; status: string }>(
    "SELECT invited_user_id, status FROM group_member_invites WHERE id = ? AND group_id = ?",
    [invite, groupId],
  );
  if (!inviteRow) return jsonError("Invito non trovato.", 404);
  if (inviteRow.status !== "pending") return jsonError("Invito non più valido.", 409);

  await execute(
    "UPDATE group_member_invites SET status = 'revoked', responded_at = CURRENT_TIMESTAMP WHERE id = ?",
    [invite],
  );

  await execute(
    "DELETE FROM notifications WHERE user_id = ? AND type = 'group_member_invite' AND group_id = ?",
    [inviteRow.invited_user_id, groupId],
  );

  await recordAuditLog({
    adminId: user.id,
    action: "group_member_invite_revoke",
    targetType: "group",
    targetId: groupId,
    note: `${user.role === "admin" && !membership ? "admin_override=true " : ""}invite_id=${invite} invited_user_id=${inviteRow.invited_user_id}`,
  });

  return NextResponse.json({ revoked: true });
}
