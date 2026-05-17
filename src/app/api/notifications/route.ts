import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { getNotifications, markNotificationsRead } from "@/lib/notifications";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  return NextResponse.json(await getNotifications(user.id));
}

export async function PATCH() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  await markNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}
