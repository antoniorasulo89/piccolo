import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isBlocked } from "@/lib/blocks";
import { execute, queryAll, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { createMessage, isConversationMember } from "@/lib/messages";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { messageSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) return jsonError("Conversazione non valida.");

  if (!(await isConversationMember(conversationId, user.id))) {
    return jsonError("Non sei membro di questa conversazione.", 403);
  }

  const url = new URL(request.url);
  const since = Math.max(Number(url.searchParams.get("since") ?? 0), 0);

  const rows = await queryAll(
    `SELECT m.id, m.content, m.created_at,
      u.id AS sender_id, u.name AS sender_name, u.avatar_url AS sender_avatar_url, u.role AS sender_role
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ? AND m.id > ?
     ORDER BY m.id ASC
     LIMIT 50`,
    [conversationId, since],
  );

  await markRead(conversationId, user.id);

  return NextResponse.json(
    rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row.id,
        content: row.content,
        created_at: row.created_at,
        sender: {
          id: row.sender_id,
          name: row.sender_name,
          avatar_url: row.sender_avatar_url,
          role: row.sender_role,
        },
      };
    }),
  );
}

async function markRead(conversationId: number, userId: number) {
  await execute(
    "UPDATE conversation_members SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND user_id = ?",
    [conversationId, userId],
  );
}

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) return jsonError("Conversazione non valida.");

  if (!(await isConversationMember(conversationId, user.id))) {
    return jsonError("Non puoi scrivere in questa conversazione.", 403);
  }

  const conv = await queryOne<{ type: string }>(
    "SELECT type FROM conversations WHERE id = ?",
    [conversationId],
  );
  if (conv?.type === "direct") {
    const other = await queryOne<{ user_id: number }>(
      "SELECT user_id FROM conversation_members WHERE conversation_id = ? AND user_id != ?",
      [conversationId, user.id],
    );
    if (other && (await isBlocked(user.id, other.user_id))) {
      return jsonError("Non puoi inviare messaggi in questa conversazione.");
    }
  }

  if (!rateLimit(rateLimitKey(request, "message", user.id), 30, 60_000)) {
    return jsonError("Stai inviando troppi messaggi. Riprova tra poco.", 429);
  }

  const { data, response } = await parseJson(request, messageSchema);
  if (response) return response;
  const { content } = data;

  const result = await createMessage({ conversationId, senderId: user.id, content });

  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}
