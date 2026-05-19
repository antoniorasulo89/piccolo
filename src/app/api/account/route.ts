import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { deleteUserCompletely } from "@/lib/users";

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  await deleteUserCompletely(user.id);
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
