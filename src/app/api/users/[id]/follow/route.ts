import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isBlocked } from "@/lib/blocks";
import { execute, queryOne } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { createNotification } from "@/lib/notifications";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: Context) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { id } = await context.params;
  const followingId = Number(id);

  if (!Number.isInteger(followingId)) {
    return jsonError("Utente non valido.");
  }

  if (followingId === user.id) {
    return jsonError("Non puoi seguire te stesso.");
  }

  const target = await queryOne("SELECT id FROM users WHERE id = ?", [
    followingId,
  ]);

  if (!target) {
    return jsonError("Utente non trovato.", 404);
  }

  const following = await queryOne(
    "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?",
    [user.id, followingId],
  );

  if (following) {
    await execute("DELETE FROM follows WHERE follower_id = ? AND following_id = ?", [
      user.id,
      followingId,
    ]);
    return NextResponse.json({ following: false });
  }

  if (await isBlocked(user.id, followingId)) {
    return jsonError("Non puoi seguire questo utente.");
  }

  await execute("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)", [
    user.id,
    followingId,
  ]);
  await createNotification({
    userId: followingId,
    actorId: user.id,
    type: "follow",
  });

  return NextResponse.json({ following: true });
}
