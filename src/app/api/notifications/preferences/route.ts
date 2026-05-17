import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { notificationPreferencesSchema } from "@/lib/schemas";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { data, response } = await parseJson(request, notificationPreferencesSchema);
  if (response) return response;
  const notifyLikes = data.notify_likes ? 1 : 0;
  const notifyComments = data.notify_comments ? 1 : 0;
  const notifyFollows = data.notify_follows ? 1 : 0;

  await execute(
    `
      UPDATE users
      SET notify_likes = ?, notify_comments = ?, notify_follows = ?
      WHERE id = ?
    `,
    [notifyLikes, notifyComments, notifyFollows, user.id],
  );

  return NextResponse.json({
    notify_likes: Boolean(notifyLikes),
    notify_comments: Boolean(notifyComments),
    notify_follows: Boolean(notifyFollows),
  });
}
