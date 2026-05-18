import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryAll } from "@/lib/db";
import { createConversation, getConversations } from "@/lib/messages";
import { jsonError, parseJson } from "@/lib/http";
import { conversationSchema } from "@/lib/schemas";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  return NextResponse.json(await getConversations(user.id));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { data, response } = await parseJson(request, conversationSchema);
  if (response) return response;
  const memberIds = data.memberIds.filter((id) => id !== user.id);
  const { title } = data;

  if (!memberIds.length) {
    return jsonError("Scegli almeno una persona.");
  }

  const existingUsers = await queryAll<{ id: number }>(
    `SELECT id FROM users WHERE id IN (${memberIds.map(() => "?").join(",")})`,
    memberIds,
  );
  if (existingUsers.length !== Array.from(new Set(memberIds)).length) {
    return jsonError("Uno o più utenti non esistono.", 404);
  }

  const conversationId = await createConversation({
    creatorId: user.id,
    memberIds,
    title,
  });

  return NextResponse.json({ id: conversationId }, { status: 201 });
}
