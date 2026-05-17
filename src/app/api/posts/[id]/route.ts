import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { postSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { id } = await context.params;
  const postId = Number(id);

  if (!Number.isInteger(postId)) {
    return jsonError("Post non valido.");
  }

  const post = await queryOne<{ user_id: number }>(
    "SELECT user_id FROM posts WHERE id = ?",
    [postId],
  );

  if (!post) {
    return jsonError("Post non trovato.", 404);
  }

  if (post.user_id !== user.id) {
    return jsonError("Puoi cancellare solo i tuoi post.", 403);
  }

  await execute("DELETE FROM posts WHERE id = ?", [postId]);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { id } = await context.params;
  const postId = Number(id);

  if (!Number.isInteger(postId)) {
    return jsonError("Post non valido.");
  }

  const post = await queryOne<{ user_id: number }>(
    "SELECT user_id FROM posts WHERE id = ?",
    [postId],
  );

  if (!post) {
    return jsonError("Post non trovato.", 404);
  }

  if (post.user_id !== user.id) {
    return jsonError("Puoi modificare solo i tuoi post.", 403);
  }

  const { data, response } = await parseJson(request, postSchema);
  if (response) return response;
  const { content } = data;

  await execute(
    "UPDATE posts SET content = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?",
    [content, postId],
  );

  return NextResponse.json({ ok: true, content });
}
