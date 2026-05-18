import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryAll, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { createInviteSchema } from "@/lib/schemas";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sqliteDateAfter(hours: number) {
  const date = new Date(Date.now() + hours * 60 * 60 * 1000);
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function inviteStatus(row: {
  revoked_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
}) {
  if (row.revoked_at) return "revoked";
  if (row.expires_at && row.expires_at <= new Date().toISOString().slice(0, 19).replace("T", " ")) return "expired";
  if (row.max_uses && row.used_count >= row.max_uses) return "exhausted";
  return "active";
}

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

  const rows = await queryAll<{
    id: number;
    token_hash: string;
    created_by: number | null;
    created_by_name: string | null;
    max_uses: number | null;
    used_count: number;
    created_at: string;
    expires_at: string | null;
    revoked_at: string | null;
  }>(
    `SELECT gi.id, gi.token_hash, gi.created_by, creator.name AS created_by_name,
       gi.max_uses, gi.used_count, gi.created_at, gi.expires_at, gi.revoked_at
     FROM group_invites gi
     LEFT JOIN users creator ON creator.id = gi.created_by
     WHERE gi.group_id = ?
     ORDER BY gi.created_at DESC
     LIMIT 50`,
    [groupId],
  );

  const invites = rows.map((row) => ({
    id: row.id,
    created_by: row.created_by ? { id: row.created_by, name: row.created_by_name } : null,
    max_uses: row.max_uses,
    used_count: row.used_count,
    created_at: row.created_at,
    expires_at: row.expires_at,
    status: inviteStatus(row),
  }));

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
    return jsonError("Solo owner e co-owner possono creare inviti.", 403);
  }

  const { data, response } = await parseJson(request, createInviteSchema);
  if (response) return response;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = data.expires_in_hours ? sqliteDateAfter(data.expires_in_hours) : null;

  const result = await execute(
    "INSERT INTO group_invites (group_id, token_hash, created_by, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)",
    [groupId, tokenHash(token), user.id, data.max_uses ?? null, expiresAt],
  );

  await recordAuditLog({
    adminId: user.id,
    action: "group_invite_create",
    targetType: "group",
    targetId: groupId,
    note: `${user.role === "admin" && !membership ? "admin_override=true " : ""}max_uses=${data.max_uses ?? "unlimited"} expires_in_hours=${data.expires_in_hours ?? "never"}`,
  });

  const inviteUrl = new URL(`/groups/join`, request.url);
  inviteUrl.searchParams.set("token", token);

  return NextResponse.json(
    { id: Number(result.lastInsertRowid), inviteUrl: inviteUrl.toString(), token, max_uses: data.max_uses ?? null, expires_at: expiresAt },
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
  if (membership && membership.role !== "owner" && membership.role !== "co_owner" && user.role !== "admin") {
    return jsonError("Solo owner e co-owner possono revocare inviti.", 403);
  }

  const body = await request.json().catch(() => ({}));
  const inviteId = body.inviteId ? Number(body.inviteId) : null;

  if (inviteId && Number.isInteger(inviteId)) {
    await execute(
      "UPDATE group_invites SET revoked_at = CURRENT_TIMESTAMP, revoked_by = ? WHERE id = ? AND group_id = ?",
      [user.id, inviteId, groupId],
    );

    await recordAuditLog({
      adminId: user.id,
      action: "group_invite_revoke",
      targetType: "group",
      targetId: groupId,
      note: `${user.role === "admin" && !membership ? "admin_override=true " : ""}invite_id=${inviteId}`,
    });

    return NextResponse.json({ revoked: true });
  }

  const token = body.token ? String(body.token) : null;
  if (!token) return jsonError("Token o inviteId obbligatorio.", 400);

  await execute(
    "UPDATE group_invites SET revoked_at = CURRENT_TIMESTAMP, revoked_by = ? WHERE group_id = ? AND token_hash = ?",
    [user.id, groupId, tokenHash(token)],
  );

  await recordAuditLog({
    adminId: user.id,
    action: "group_invite_revoke",
    targetType: "group",
    targetId: groupId,
    note: user.role === "admin" && !membership ? "admin_override=true" : "",
  });

  return NextResponse.json({ revoked: true });
}
