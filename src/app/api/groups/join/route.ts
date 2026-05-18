import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { jsonError } from "@/lib/http";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { token } = await request.json().catch(() => ({}));
  if (!token) return jsonError("Token obbligatorio.", 400);

  const invite = await queryOne<{ id: number; group_id: number; max_uses: number | null; used_count: number; expires_at: string | null; revoked_at: string | null }>(
    "SELECT id, group_id, max_uses, used_count, expires_at, revoked_at FROM group_invites WHERE token_hash = ?",
    [tokenHash(token)],
  );

  if (!invite) return jsonError("Link di invito non valido.", 400);
  if (invite.revoked_at) return jsonError("Link di invito revocato.", 400);
  const groupId = invite.group_id;

  if (invite.max_uses !== null && invite.used_count >= invite.max_uses) {
    return jsonError("Link di invito esaurito.", 400);
  }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return jsonError("Link di invito scaduto.", 400);
  }

  const existing = await queryOne<{ group_id: number }>(
    "SELECT group_id FROM group_members WHERE group_id = ? AND user_id = ?",
    [groupId, user.id],
  );
  if (existing) return jsonError("Fai già parte di questo gruppo.", 409);

  const group = await queryOne<{ privacy: string }>(
    "SELECT privacy FROM groups WHERE id = ?",
    [groupId],
  );
  if (!group) return jsonError("Gruppo non trovato.", 404);

  const updateResult = await execute(
    "UPDATE group_invites SET used_count = used_count + 1 WHERE id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) AND (max_uses IS NULL OR used_count < max_uses)",
    [invite.id],
  );

  if (updateResult.rowsAffected === 0) {
    return jsonError("Link di invito scaduto o esaurito.", 400);
  }

  try {
    await execute(
      "INSERT INTO group_members (group_id, user_id, role, status) VALUES (?, ?, 'member', 'active')",
      [groupId, user.id],
    );
  } catch {
    await execute(
      "UPDATE group_invites SET used_count = MAX(used_count - 1, 0) WHERE id = ?",
      [invite.id],
    );
    return jsonError("Impossibile completare l'accesso. Riprova.", 500);
  }

  return NextResponse.json({ joined: true, groupId });
}
