import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canViewPost } from "@/lib/community";
import { execute, queryOne } from "@/lib/db";
import { jsonError } from "@/lib/http";

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

  const post = await queryOne("SELECT id FROM posts WHERE id = ?", [postId]);

  if (!post) {
    return jsonError("Post non trovato.", 404);
  }

  const bookmarked = await queryOne(
    "SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?",
    [user.id, postId],
  );

  if (bookmarked) {
    await execute("DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?", [
      user.id,
      postId,
    ]);
    return NextResponse.json({ bookmarked: false });
  }

  await execute("INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)", [
    user.id,
    postId,
  ]);

  return NextResponse.json({ bookmarked: true });
}
