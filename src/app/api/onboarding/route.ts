import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { onboardingSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { data, response } = await parseJson(request, onboardingSchema);
  if (response) return response;
  const { bio } = data;

  await execute(
    "UPDATE users SET bio = ?, onboarded_at = CURRENT_TIMESTAMP WHERE id = ?",
    [bio, user.id],
  );

  return NextResponse.json({ ok: true });
}
