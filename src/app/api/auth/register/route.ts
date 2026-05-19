import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { isEmailAdmin } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { jsonError, parseJson } from "@/lib/http";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/schemas";
import { allowTestAccounts, isTestAccount } from "@/lib/test-accounts";

export async function POST(request: Request) {
  const { data, response } = await parseJson(request, registerSchema);
  if (response) return response;
  const { name, email, password } = data;

  if (isTestAccount(email, name) && !allowTestAccounts()) {
    return jsonError("Gli account di test non sono ammessi su questo ambiente.", 400);
  }

  if (!rateLimit(rateLimitKey(request, "register", email || "empty"), 5, 10 * 60_000)) {
    return jsonError("Troppe registrazioni dallo stesso browser. Riprova più tardi.", 429);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userCount = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM users",
  );
  const role = userCount?.count === 0 || isEmailAdmin(email) ? "admin" : "user";
  const approved = role === "admin" || (isTestAccount(email, name) && allowTestAccounts());

  try {
    const result = await execute(
      "INSERT INTO users (name, email, password_hash, role, approved_at) VALUES (?, ?, ?, ?, CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END)",
      [name, email, passwordHash, role, approved ? 1 : 0],
    );

    if (approved) {
      sendWelcomeEmail(email, name).catch(() => {});
    }

    return NextResponse.json(
      { id: Number(result.lastInsertRowid), name, email, role, pendingApproval: !approved },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return jsonError("Esiste già un account con questa email.", 409);
    }

    return jsonError("Registrazione non riuscita.", 500);
  }
}
