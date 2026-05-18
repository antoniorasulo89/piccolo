import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/schemas";

type ResetTokenRow = {
  id: number;
  user_id: number;
};

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const { data, response } = await parseJson(request, resetPasswordSchema);
  if (response) return response;

  if (!rateLimit(rateLimitKey(request, "password-reset", data.token.slice(0, 12)), 6, 60_000)) {
    return jsonError("Troppi tentativi. Riprova tra poco.", 429);
  }

  const token = await queryOne<ResetTokenRow>(
    `
      SELECT id, user_id
      FROM password_reset_tokens
      WHERE token_hash = ?
        AND used_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
    `,
    [tokenHash(data.token)],
  );

  if (!token) {
    return jsonError("Link non valido o scaduto.", 400);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  await execute("UPDATE users SET password_hash = ? WHERE id = ?", [
    passwordHash,
    token.user_id,
  ]);
  await execute("UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?", [
    token.id,
  ]);

  return NextResponse.json({ ok: true });
}
