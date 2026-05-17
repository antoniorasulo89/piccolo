import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { execute } from "@/lib/db";
import { jsonError } from "@/lib/http";

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  await execute("DELETE FROM notifications WHERE user_id = ? OR actor_id = ?", [user.id, user.id]);
  await execute("DELETE FROM audit_logs WHERE admin_id = ?", [user.id]);
  await execute("DELETE FROM reports WHERE reporter_id = ? OR resolved_by = ?", [user.id, user.id]);
  await execute("DELETE FROM message_reports WHERE reporter_id = ?", [user.id]);
  await execute("DELETE FROM group_reports WHERE reporter_id = ?", [user.id]);
  await execute("DELETE FROM messages WHERE sender_id = ?", [user.id]);
  await execute("DELETE FROM conversation_members WHERE user_id = ?", [user.id]);
  await execute("DELETE FROM conversations WHERE created_by = ?", [user.id]);
  await execute("DELETE FROM group_requests WHERE user_id = ?", [user.id]);
  await execute("DELETE FROM group_members WHERE user_id = ?", [user.id]);
  await execute("DELETE FROM groups WHERE owner_id = ?", [user.id]);
  await execute("DELETE FROM likes WHERE user_id = ?", [user.id]);
  await execute("DELETE FROM bookmarks WHERE user_id = ?", [user.id]);
  await execute("DELETE FROM follows WHERE follower_id = ? OR following_id = ?", [user.id, user.id]);
  await execute("DELETE FROM comments WHERE user_id = ?", [user.id]);
  await execute("DELETE FROM posts WHERE user_id = ?", [user.id]);
  await execute("DELETE FROM users WHERE id = ?", [user.id]);
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
