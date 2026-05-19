import { execute } from "./db";

export async function deleteUserCompletely(userId: number) {
  await execute("DELETE FROM notifications WHERE user_id = ? OR actor_id = ?", [userId, userId]);
  await execute("DELETE FROM audit_logs WHERE admin_id = ? OR (target_type = 'user' AND target_id = ?)", [userId, userId]);
  await execute("DELETE FROM reports WHERE reporter_id = ?", [userId]);
  await execute("UPDATE reports SET resolved_by = NULL WHERE resolved_by = ?", [userId]);
  await execute("DELETE FROM message_reports WHERE reporter_id = ?", [userId]);
  await execute("DELETE FROM group_reports WHERE reporter_id = ?", [userId]);
  await execute("DELETE FROM password_reset_tokens WHERE user_id = ? OR created_by = ?", [userId, userId]);
  await execute("DELETE FROM group_member_invites WHERE invited_user_id = ? OR invited_by = ?", [userId, userId]);
  await execute("DELETE FROM group_invites WHERE created_by = ?", [userId]);
  await execute("DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?", [userId, userId]);
  await execute("DELETE FROM messages WHERE sender_id = ?", [userId]);
  await execute("DELETE FROM conversation_members WHERE user_id = ?", [userId]);
  await execute("DELETE FROM conversations WHERE created_by = ?", [userId]);
  await execute("DELETE FROM group_requests WHERE user_id = ?", [userId]);
  await execute("DELETE FROM group_members WHERE user_id = ?", [userId]);
  await execute("DELETE FROM groups WHERE owner_id = ?", [userId]);
  await execute("DELETE FROM likes WHERE user_id = ?", [userId]);
  await execute("DELETE FROM bookmarks WHERE user_id = ?", [userId]);
  await execute("DELETE FROM follows WHERE follower_id = ? OR following_id = ?", [userId, userId]);
  await execute("DELETE FROM comments WHERE user_id = ?", [userId]);
  await execute("DELETE FROM posts WHERE user_id = ?", [userId]);
  await execute("DELETE FROM users WHERE id = ?", [userId]);
}
