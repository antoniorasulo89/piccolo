import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const createInviteSchema = z.object({
  max_uses: z.number().int().min(1).max(1000).optional(),
  expires_in_hours: z.number().int().min(1).max(720).optional(),
});

type Context = {
  params: Promise<{ id: string }>;
};

function sqliteDateAfter(hours: number) {
  const date = new Date(Date.now() + hours * 60 * 60 * 1000);
  return date.toISOString().slice(0, 19).replace("T", " ");
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
  if (membership && membership.role !== "owner" && membership.role !== "moderator" && user.role !== "admin") {
    return jsonError("Solo owner e moderator possono creare inviti.", 403);
  }

  const { data, response } = await parseJson(request, createInviteSchema);
  if (response) return response;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = data.expires_in_hours ? sqliteDateAfter(data.expires_in_hours) : null;

  await execute(
    "INSERT INTO group_invites (group_id, token_hash, created_by, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)",
    [groupId, tokenHash(token), user.id, data.max_uses ?? null, expiresAt],
  );

  const inviteUrl = new URL(`/groups/join`, request.url);
  inviteUrl.searchParams.set("token", token);

  return NextResponse.json(
    { inviteUrl: inviteUrl.toString(), token, max_uses: data.max_uses ?? null, expires_at: expiresAt },
    { status: 201 },
  );
}

export async function DELETE(request: Request, context: Context) {
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
  if (membership && membership.role !== "owner" && membership.role !== "moderator" && user.role !== "admin") {
    return jsonError("Solo owner e moderator possono revocare inviti.", 403);
  }

  const { token } = await request.json().catch(() => ({}));
  if (!token) return jsonError("Token obbligatorio.", 400);

  await execute(
    "DELETE FROM group_invites WHERE group_id = ? AND token_hash = ?",
    [groupId, tokenHash(token)],
  );

  return NextResponse.json({ revoked: true });
}
