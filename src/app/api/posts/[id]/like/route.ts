import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canViewPost } from "@/lib/community";
import { execute, queryOne } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { createNotification } from "@/lib/notifications";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: Context) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { id } = await context.params;
  const postId = Number(id);

  if (!Number.isInteger(postId)) {
    return jsonError("Post non valido.");
  }

  if (!(await canViewPost(postId, user.id))) {
    return jsonError("Post non trovato.", 404);
  }

  const exists = await queryOne<{ id: number; user_id: number }>(
    "SELECT id, user_id FROM posts WHERE id = ?",
    [postId],
  );

  if (!exists) {
    return jsonError("Post non trovato.", 404);
  }

  const liked = await queryOne(
    "SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?",
    [user.id, postId],
  );

  if (liked) {
    await execute("DELETE FROM likes WHERE user_id = ? AND post_id = ?", [
      user.id,
      postId,
    ]);
    return NextResponse.json({ liked: false });
  }

  await execute("INSERT INTO likes (user_id, post_id) VALUES (?, ?)", [
    user.id,
    postId,
  ]);
  await createNotification({
    userId: exists.user_id,
    actorId: user.id,
    type: "like",
    postId,
  });

  return NextResponse.json({ liked: true });
}
