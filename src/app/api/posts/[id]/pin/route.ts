import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { jsonError } from "@/lib/http";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) return jsonError("Post non valido.");

  const post = await queryOne<{ group_id: number | null; pinned_at: string | null }>(
    "SELECT group_id, pinned_at FROM posts WHERE id = ?",
    [postId],
  );
  if (!post) return jsonError("Post non trovato.", 404);
  if (!post.group_id) return jsonError("Solo i post di gruppo possono essere fissati.", 400);

  const membership = await queryOne<{ role: string }>(
    "SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'",
    [post.group_id, user.id],
  );
  if (!membership || (membership.role !== "owner" && membership.role !== "moderator")) {
    return jsonError("Solo owner e moderator possono fissare i post.", 403);
  }

  const pinned = post.pinned_at ? null : new Date().toISOString().replace("T", " ").slice(0, 19);
  await execute("UPDATE posts SET pinned_at = ? WHERE id = ?", [pinned, postId]);

  return NextResponse.json({ pinned: Boolean(pinned) });
}
