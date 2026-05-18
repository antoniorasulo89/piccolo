import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { jsonError } from "@/lib/http";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const targetId = Number(id);
  if (!Number.isInteger(targetId)) return jsonError("Utente non valido.");
  if (targetId === user.id) return jsonError("Non puoi bloccare te stesso.");

  const target = await queryOne("SELECT id FROM users WHERE id = ?", [targetId]);
  if (!target) return jsonError("Utente non trovato.", 404);

  const batch: string[] = [
    `INSERT OR IGNORE INTO user_blocks(blocker_id, blocked_id) VALUES (${user.id}, ${targetId})`,
    `DELETE FROM follows WHERE (follower_id = ${user.id} AND following_id = ${targetId}) OR (follower_id = ${targetId} AND following_id = ${user.id})`,
    `DELETE FROM notifications WHERE (user_id = ${user.id} AND actor_id = ${targetId}) OR (user_id = ${targetId} AND actor_id = ${user.id})`,
  ];
  await execute(batch.join("; "));

  return NextResponse.json({ blocked: true });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const targetId = Number(id);
  if (!Number.isInteger(targetId)) return jsonError("Utente non valido.");

  await execute(
    "DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?",
    [user.id, targetId],
  );

  return NextResponse.json({ blocked: false });
}
