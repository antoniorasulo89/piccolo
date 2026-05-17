import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { commentSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { id } = await context.params;
  const commentId = Number(id);

  if (!Number.isInteger(commentId)) {
    return jsonError("Commento non valido.");
  }

  const comment = await queryOne<{ id: number; user_id: number }>(
    "SELECT id, user_id FROM comments WHERE id = ?",
    [commentId],
  );

  if (!comment) {
    return jsonError("Commento non trovato.", 404);
  }

  if (comment.user_id !== user.id && user.role !== "admin") {
    return jsonError("Puoi cancellare solo i tuoi commenti.", 403);
  }

  await execute("DELETE FROM comments WHERE id = ?", [commentId]);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { id } = await context.params;
  const commentId = Number(id);

  if (!Number.isInteger(commentId)) {
    return jsonError("Commento non valido.");
  }

  const comment = await queryOne<{ id: number; user_id: number }>(
    "SELECT id, user_id FROM comments WHERE id = ?",
    [commentId],
  );

  if (!comment) {
    return jsonError("Commento non trovato.", 404);
  }

  if (comment.user_id !== user.id) {
    return jsonError("Puoi modificare solo i tuoi commenti.", 403);
  }

  const { data, response } = await parseJson(request, commentSchema);
  if (response) return response;
  const { content } = data;

  await execute(
    "UPDATE comments SET content = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?",
    [content, commentId],
  );

  return NextResponse.json({ ok: true, content });
}
