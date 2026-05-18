import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryAll, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { createGroupMemberInviteNotification } from "@/lib/notifications";
import { createMemberInviteSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) return jsonError("Gruppo non valido.");

  const membership = await queryOne<{ role: string }>(
    "SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'",
    [groupId, user.id],
  );
  if (!membership && user.role !== "admin") return jsonError("Non sei membro del gruppo.", 403);
  const canView = membership?.role === "owner" || membership?.role === "co_owner" || user.role === "admin";
  if (!canView) return jsonError("Permessi insufficienti.", 403);

  const invites = await queryAll<{
    id: number;
    invited_user_id: number;
    invited_user_name: string;
    invited_user_avatar_url: string | null;
    invited_by: number;
    invited_by_name: string;
    status: "pending" | "accepted" | "declined" | "revoked";
    created_at: string;
    responded_at: string | null;
    expires_at: string | null;
  }>(
    `SELECT gmi.id, gmi.invited_user_id, invited.name AS invited_user_name,
       invited.avatar_url AS invited_user_avatar_url,
       gmi.invited_by, inviter.name AS invited_by_name,
       gmi.status, gmi.created_at, gmi.responded_at, gmi.expires_at
     FROM group_member_invites gmi
     JOIN users invited ON invited.id = gmi.invited_user_id
     JOIN users inviter ON inviter.id = gmi.invited_by
     WHERE gmi.group_id = ?
     ORDER BY gmi.created_at DESC
     LIMIT 50`,
    [groupId],
  );

  return NextResponse.json({ invites });
}

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) return jsonError("Gruppo non valido.");

  const membership = await queryOne<{ role: string }>(
    "SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'",
    [groupId, user.id],
  );
  if (!membership && user.role !== "admin") return jsonError("Non sei membro del gruppo.", 403);
  if (membership && membership.role !== "owner" && membership.role !== "co_owner" && user.role !== "admin") {
    return jsonError("Solo owner e co-owner possono invitare utenti.", 403);
  }

  const { data, response } = await parseJson(request, createMemberInviteSchema);
  if (response) return response;

  const alreadyMember = await queryOne(
    "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'",
    [groupId, data.userId],
  );
  if (alreadyMember) return jsonError("L'utente è già membro del gruppo.", 409);

  const pendingInvite = await queryOne<{ id: number }>(
    "SELECT id FROM group_member_invites WHERE group_id = ? AND invited_user_id = ? AND status = 'pending'",
    [groupId, data.userId],
  );
  if (pendingInvite) return jsonError("L'utente ha già un invito in attesa.", 409);

  const expiresAt = data.expires_in_hours
    ? new Date(Date.now() + data.expires_in_hours * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ")
    : null;

  const existing = await queryOne<{ id: number; status: string }>(
    "SELECT id, status FROM group_member_invites WHERE group_id = ? AND invited_user_id = ?",
    [groupId, data.userId],
  );

  let inviteId: number;

  if (existing) {
    await execute(
      "UPDATE group_member_invites SET status = 'pending', invited_by = ?, responded_at = NULL, expires_at = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id, expiresAt, existing.id],
    );
    inviteId = existing.id;
  } else {
    const result = await execute(
      `INSERT INTO group_member_invites (group_id, invited_user_id, invited_by, status, expires_at)
       VALUES (?, ?, ?, 'pending', ?)`,
      [groupId, data.userId, user.id, expiresAt],
    );
    inviteId = Number(result.lastInsertRowid);
  }

  await recordAuditLog({
    adminId: user.id,
    action: "group_member_invite_create",
    targetType: "group",
    targetId: groupId,
    note: `${user.role === "admin" && !membership ? "admin_override=true " : ""}invited_user_id=${data.userId}`,
  });

  await createGroupMemberInviteNotification({
    userId: data.userId,
    actorId: user.id,
    groupId,
  });

  return NextResponse.json({ id: inviteId }, { status: 201 });
}
