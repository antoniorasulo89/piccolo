import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/admin";
import { withAdmin } from "@/lib/admin-guard";
import { execute, queryOne } from "@/lib/db";
import { jsonError } from "@/lib/http";

type Context = {
  params: Promise<{ id: string }>;
};

type UserRow = {
  id: number;
  email: string;
  suspended_at: string | null;
};

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sqliteDateAfter(minutes: number) {
  const date = new Date(Date.now() + minutes * 60_000);
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export async function POST(request: Request, context: Context) {
  return withAdmin(async (admin) => {
    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId)) {
      return jsonError("Utente non valido.");
    }

    const user = await queryOne<UserRow>(
      "SELECT id, email, suspended_at FROM users WHERE id = ?",
      [userId],
    );

    if (!user) {
      return jsonError("Utente non trovato.", 404);
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = sqliteDateAfter(30);

    await execute(
      "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL",
      [user.id],
    );
    await execute(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_by) VALUES (?, ?, ?, ?)",
      [user.id, tokenHash(token), expiresAt, admin.id],
    );
    await recordAuditLog({
      adminId: admin.id,
      action: "password_reset_link",
      targetType: "user",
      targetId: user.id,
      note: `Link valido fino a ${expiresAt}`,
    });

    const resetUrl = new URL("/reset-password", request.url);
    resetUrl.searchParams.set("token", token);

    return NextResponse.json({
      resetUrl: resetUrl.toString(),
      expires_at: expiresAt,
      suspended: Boolean(user.suspended_at),
    });
  });
}
