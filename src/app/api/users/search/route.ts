import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryAll, queryOne } from "@/lib/db";
import { jsonError } from "@/lib/http";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const groupIdStr = url.searchParams.get("groupId");

  if (!q || q.length < 2) return NextResponse.json({ users: [] });

  const groupId = groupIdStr ? Number(groupIdStr) : null;

  if (groupId && Number.isInteger(groupId)) {
    const membership = await queryOne<{ role: string }>(
      "SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'",
      [groupId, user.id],
    );
    if (!membership && user.role !== "admin") return jsonError("Non sei membro del gruppo.", 403);
    if (membership && membership.role !== "owner" && membership.role !== "co_owner" && user.role !== "admin") {
      return jsonError("Solo owner e co-owner possono cercare utenti per il gruppo.", 403);
    }

    const users = await queryAll<{ id: number; name: string; avatar_url: string | null }>(
      `SELECT u.id, u.name, u.avatar_url
       FROM users u
       WHERE u.id != ?
         AND u.name LIKE ?
         AND u.privacy_discoverable = 1
         AND u.id NOT IN (SELECT user_id FROM group_members WHERE group_id = ? AND status = 'active')
       ORDER BY u.name ASC
       LIMIT 20`,
      [user.id, `%${q}%`, groupId],
    );
    return NextResponse.json({ users });
  }

  const users = await queryAll<{ id: number; name: string; avatar_url: string | null }>(
    `SELECT u.id, u.name, u.avatar_url
     FROM users u
     WHERE u.id != ? AND u.name LIKE ?
     ORDER BY u.name ASC
     LIMIT 20`,
    [user.id, `%${q}%`],
  );

  return NextResponse.json({ users });
}
