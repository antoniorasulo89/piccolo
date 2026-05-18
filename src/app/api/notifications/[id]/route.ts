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
  const notificationId = Number(id);
  if (!Number.isInteger(notificationId)) return jsonError("Notifica non valida.");

  const row = await queryOne<{ read_at: string | null }>(
    "SELECT read_at FROM notifications WHERE id = ? AND user_id = ?",
    [notificationId, user.id],
  );
  if (!row) return jsonError("Notifica non trovata.", 404);

  if (row.read_at) {
    await execute("UPDATE notifications SET read_at = NULL WHERE id = ?", [notificationId]);
    return NextResponse.json({ read: false });
  }

  await execute("UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ?", [notificationId]);
  return NextResponse.json({ read: true });
}

export async function DELETE(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const notificationId = Number(id);
  if (!Number.isInteger(notificationId)) return jsonError("Notifica non valida.");

  const row = await queryOne(
    "SELECT 1 FROM notifications WHERE id = ? AND user_id = ?",
    [notificationId, user.id],
  );
  if (!row) return jsonError("Notifica non trovata.", 404);

  await execute("DELETE FROM notifications WHERE id = ?", [notificationId]);

  return NextResponse.json({ deleted: true });
}
