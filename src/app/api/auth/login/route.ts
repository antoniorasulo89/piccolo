import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { authSchema } from "@/lib/schemas";

type LoginUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  onboarded_at: string | null;
  suspended_at: string | null;
  approved_at: string | null;
  password_hash: string;
};

export async function POST(request: Request) {
  const { data, response } = await parseJson(request, authSchema);
  if (response) return response;
  const { email, password } = data;

  if (!rateLimit(rateLimitKey(request, "login", email || "empty"), 8, 60_000)) {
    return jsonError("Troppi tentativi di accesso. Riprova tra poco.", 429);
  }

  const user = await queryOne<LoginUser>(
    "SELECT id, name, email, role, onboarded_at, suspended_at, approved_at, password_hash FROM users WHERE email = ?",
    [email],
  );

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return jsonError("Email o password non corrette.", 401);
  }

  if (user.suspended_at) {
    return jsonError("Account sospeso. Contatta un amministratore.", 403);
  }

  if (user.role !== "admin" && !user.approved_at) {
    return jsonError("Account in attesa di approvazione. Un amministratore deve approvarlo prima dell'accesso.", 403);
  }

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    onboarded: Boolean(user.onboarded_at),
  });
}
