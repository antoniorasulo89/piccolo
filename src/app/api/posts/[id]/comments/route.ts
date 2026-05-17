import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canViewPost } from "@/lib/community";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { createNotification } from "@/lib/notifications";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getPostDetail } from "@/lib/queries";
import { commentSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
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

  const detail = await getPostDetail(postId, user.id);

  if (!detail) {
    return jsonError("Post non trovato.", 404);
  }

  return NextResponse.json({ comments: detail.comments });
}

export async function POST(request: Request, context: Context) {
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

  if (!rateLimit(rateLimitKey(request, "comment", user.id), 20, 60_000)) {
    return jsonError("Stai commentando troppo velocemente. Riprova tra poco.", 429);
  }

  const { data, response } = await parseJson(request, commentSchema);
  if (response) return response;
  const { content } = data;

  const post = await queryOne<{ id: number; user_id: number }>(
    "SELECT id, user_id FROM posts WHERE id = ?",
    [postId],
  );

  if (!post) {
    return jsonError("Post non trovato.", 404);
  }

  const result = await execute(
    "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
    [postId, user.id, content],
  );
  await createNotification({
    userId: post.user_id,
    actorId: user.id,
    type: "comment",
    postId,
    commentId: Number(result.lastInsertRowid),
  });

  return NextResponse.json(
    { id: Number(result.lastInsertRowid), content },
    { status: 201 },
  );
}
