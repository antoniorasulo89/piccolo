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
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) return jsonError("Gruppo non valido.");

  const group = await queryOne<{ id: number; privacy: "public" | "private" }>(
    "SELECT id, privacy FROM groups WHERE id = ?",
    [groupId],
  );
  if (!group) return jsonError("Gruppo non trovato.", 404);

  const membership = await queryOne<{ status: string }>(
    "SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
    [groupId, user.id],
  );

  if (membership?.status === "active") {
    return NextResponse.json({ status: "active" });
  }

  if (group.privacy === "private") {
    await execute(
      `
        INSERT INTO group_requests (group_id, user_id, status)
        VALUES (?, ?, 'pending')
        ON CONFLICT(group_id, user_id) DO UPDATE SET status = 'pending'
      `,
      [groupId, user.id],
    );
    return NextResponse.json({ status: "pending" });
  }

  await execute(
    `
      INSERT INTO group_members (group_id, user_id, role, status)
      VALUES (?, ?, 'member', 'active')
      ON CONFLICT(group_id, user_id) DO UPDATE SET status = 'active'
    `,
    [groupId, user.id],
  );

  return NextResponse.json({ status: "active" });
}
