import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isBlocked } from "@/lib/blocks";
import { execute, queryAll, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { z } from "zod";

const renameSchema = z.object({
  title: z.string().trim().min(1).max(80),
});

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) return jsonError("Conversazione non valida.");

  const conv = await queryOne<{ type: string; created_by: number }>(
    "SELECT type, created_by FROM conversations WHERE id = ?",
    [conversationId],
  );
  if (!conv) return jsonError("Conversazione non trovata.", 404);
  if (conv.type !== "group_dm") return jsonError("Solo i gruppi DM possono essere rinominati.", 403);

  const membership = await queryOne<{ role: string }>(
    "SELECT role FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL",
    [conversationId, user.id],
  );
  if (!membership) return jsonError("Non sei membro di questa conversazione.", 403);
  if (membership.role !== "owner") return jsonError("Solo il creatore puo' rinominare la conversazione.", 403);

  const { data, response } = await parseJson(request, renameSchema);
  if (response) return response;

  await execute("UPDATE conversations SET title = ? WHERE id = ?", [data.title, conversationId]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) return jsonError("Conversazione non valida.");

  const conv = await queryOne<{ type: string }>(
    "SELECT type FROM conversations WHERE id = ?",
    [conversationId],
  );
  if (!conv) return jsonError("Conversazione non trovata.", 404);
  if (conv.type !== "group_dm") return jsonError("Solo i gruppi DM possono avere rimozione membri.", 403);

  const { userId: rawUserId } = await request.json().catch(() => ({}));
  const targetUserId = rawUserId === undefined ? user.id : Number(rawUserId);
  if (!Number.isInteger(targetUserId)) return jsonError("Utente non valido.");

  const membership = await queryOne<{ role: string }>(
    "SELECT role FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL",
    [conversationId, user.id],
  );
  if (!membership) return jsonError("Non sei membro di questa conversazione.", 403);
  if (membership.role !== "owner" && user.id !== targetUserId) {
    return jsonError("Solo il creatore puo' rimuovere altri membri.", 403);
  }

  if (user.id === targetUserId) {
    await execute(
      "UPDATE conversation_members SET left_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND user_id = ?",
      [conversationId, user.id],
    );

    const remaining = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM conversation_members WHERE conversation_id = ? AND left_at IS NULL",
      [conversationId],
    );
    if (remaining?.count === 0) {
      const lastMember = await queryOne<{ user_id: number }>(
        "SELECT user_id FROM conversation_members WHERE conversation_id = ? ORDER BY left_at DESC LIMIT 1",
        [conversationId],
      );
      if (lastMember) {
        await execute(
          "UPDATE conversation_members SET left_at = NULL WHERE conversation_id = ? AND user_id = ?",
          [conversationId, lastMember.user_id],
        );
      }
    }

    return NextResponse.json({ left: true });
  }

  await execute(
    "UPDATE conversation_members SET left_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND user_id = ?",
    [conversationId, targetUserId],
  );

  return NextResponse.json({ removed: true });
}

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) return jsonError("Conversazione non valida.");

  const conv = await queryOne<{ type: string }>(
    "SELECT type FROM conversations WHERE id = ?",
    [conversationId],
  );
  if (!conv) return jsonError("Conversazione non trovata.", 404);
  if (conv.type !== "group_dm") return jsonError("Solo i gruppi DM possono aggiungere membri.", 403);

  const membership = await queryOne<{ role: string }>(
    "SELECT role FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL",
    [conversationId, user.id],
  );
  if (!membership) return jsonError("Non sei membro di questa conversazione.", 403);
  if (membership.role !== "owner") return jsonError("Solo il creatore puo' aggiungere membri.", 403);

  const { userId: rawUserId } = await request.json().catch(() => ({}));
  const newUserId = Number(rawUserId);
  if (!Number.isInteger(newUserId)) return jsonError("Utente non valido.");

  const activeMembers = await queryAll<{ user_id: number }>(
    "SELECT user_id FROM conversation_members WHERE conversation_id = ? AND left_at IS NULL",
    [conversationId],
  );
  for (const m of activeMembers) {
    if (await isBlocked(newUserId, m.user_id)) {
      return jsonError("Non puoi aggiungere un utente con blocchi attivi verso membri della conversazione.");
    }
  }

  const exists = await queryOne(
    "SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?",
    [conversationId, newUserId],
  );
  if (exists) {
    await execute(
      "UPDATE conversation_members SET left_at = NULL, role = 'member' WHERE conversation_id = ? AND user_id = ?",
      [conversationId, newUserId],
    );
  } else {
    await execute(
      "INSERT INTO conversation_members (conversation_id, user_id, role, last_read_at) VALUES (?, ?, 'member', CURRENT_TIMESTAMP)",
      [conversationId, newUserId],
    );
  }

  return NextResponse.json({ added: true });
}
