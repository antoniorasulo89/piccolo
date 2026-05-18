import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { z } from "zod";

const respondInviteSchema = z.object({
  accept: z.boolean(),
});

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) return jsonError("Gruppo non valido.");

  const { data, response } = await parseJson(request, respondInviteSchema);
  if (response) return response;

  const invite = await queryOne<{ id: number; invited_user_id: number; status: string; expires_at: string | null }>(
    "SELECT id, invited_user_id, status, expires_at FROM group_member_invites WHERE group_id = ? AND invited_user_id = ? AND status = 'pending'",
    [groupId, user.id],
  );

  if (!invite) return jsonError("Nessun invito in attesa per questo gruppo.", 404);

  if (invite.expires_at && invite.expires_at <= new Date().toISOString().slice(0, 19).replace("T", " ")) {
    await execute(
      "UPDATE group_member_invites SET status = 'expired', responded_at = CURRENT_TIMESTAMP WHERE id = ?",
      [invite.id],
    );
    return jsonError("Invito scaduto.", 410);
  }

  if (data.accept) {
    await execute(
      `INSERT INTO group_members (group_id, user_id, role, status)
       VALUES (?, ?, 'member', 'active')
       ON CONFLICT(group_id, user_id) DO UPDATE SET status = 'active'`,
      [groupId, user.id],
    );

    await execute(
      "UPDATE group_member_invites SET status = 'accepted', responded_at = CURRENT_TIMESTAMP WHERE id = ?",
      [invite.id],
    );
  } else {
    await execute(
      "UPDATE group_member_invites SET status = 'declined', responded_at = CURRENT_TIMESTAMP WHERE id = ?",
      [invite.id],
    );
  }

  return NextResponse.json({ ok: true, groupId });
}
