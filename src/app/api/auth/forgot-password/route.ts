import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { jsonError, parseJson } from "@/lib/http";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { z } from "zod";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sqliteDateAfter(minutes: number) {
  const date = new Date(Date.now() + minutes * 60_000);
  return date.toISOString().slice(0, 19).replace("T", " ");
}

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export async function POST(request: Request) {
  const { data, response } = await parseJson(request, schema);
  if (response) return response;

  if (!rateLimit(rateLimitKey(request, "forgot-password", data.email), 5, 10 * 60_000)) {
    return jsonError("Troppi tentativi. Riprova tra poco.", 429);
  }

  const user = await queryOne<{ id: number; email: string }>(
    "SELECT id, email FROM users WHERE email = ?",
    [data.email],
  );

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = sqliteDateAfter(30);

  await execute(
    "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL",
    [user.id],
  );
  await execute(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_by) VALUES (?, ?, ?, ?)",
    [user.id, tokenHash(token), expiresAt, user.id],
  );

  const resetUrl = new URL("/reset-password", request.url);
  resetUrl.searchParams.set("token", token);

  sendPasswordResetEmail(user.email, resetUrl.toString()).catch(() => {});

  return NextResponse.json({ ok: true });
}
