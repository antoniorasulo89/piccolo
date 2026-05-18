import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryAll } from "@/lib/db";
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
    const users = await queryAll<{ id: number; name: string; avatar_url: string | null }>(
      `SELECT u.id, u.name, u.avatar_url
       FROM users u
       WHERE u.id != ?
         AND u.name LIKE ?
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
