import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getGroupMembership } from "@/lib/community";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { createGroupPostNotification } from "@/lib/notifications";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { postSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) return jsonError("Gruppo non valido.");

  const group = await queryOne<{ id: number }>("SELECT id FROM groups WHERE id = ?", [groupId]);
  if (!group) return jsonError("Gruppo non trovato.", 404);

  const membership = await getGroupMembership(groupId, user.id);
  if (membership?.status !== "active") {
    return jsonError("Devi essere membro del gruppo per pubblicare.", 403);
  }

  if (!rateLimit(rateLimitKey(request, "group-post", user.id), 10, 60_000)) {
    return jsonError("Stai pubblicando troppo velocemente. Riprova tra poco.", 429);
  }

  const { data, response } = await parseJson(request, postSchema);
  if (response) return response;
  const { content } = data;

  const result = await execute("INSERT INTO posts (user_id, group_id, content) VALUES (?, ?, ?)", [
    user.id,
    groupId,
    content,
  ]);

  const postId = Number(result.lastInsertRowid);
  createGroupPostNotification({ groupId, actorId: user.id, postId }).catch(() => {});

  return NextResponse.json({ id: postId }, { status: 201 });
}
