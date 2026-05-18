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
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) return jsonError("Conversazione non valida.");

  const membership = await queryOne(
    "SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL",
    [conversationId, user.id],
  );
  if (!membership) return jsonError("Non sei membro di questa conversazione.", 403);

  const { archive } = await request.json().catch(() => ({}));

  if (archive) {
    await execute(
      "UPDATE conversation_members SET archived_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND user_id = ?",
      [conversationId, user.id],
    );
  } else {
    await execute(
      "UPDATE conversation_members SET archived_at = NULL WHERE conversation_id = ? AND user_id = ?",
      [conversationId, user.id],
    );
  }

  return NextResponse.json({ ok: true });
}
