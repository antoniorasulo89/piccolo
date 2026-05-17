import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/http";
import { createMessage, isConversationMember } from "@/lib/messages";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { messageSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) return jsonError("Conversazione non valida.");

  if (!(await isConversationMember(conversationId, user.id))) {
    return jsonError("Non puoi scrivere in questa conversazione.", 403);
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
