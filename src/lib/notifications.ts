import { execute, queryAll, queryOne } from "./db";
import { PAGE_LIMIT, PAGE_SIZE } from "./pagination";

export type NotificationType = "like" | "comment" | "follow" | "group_post";

export type NotificationItem = {
  id: number;
  type: NotificationType;
  post_id: number | null;
  comment_id: number | null;
  read_at: string | null;
  created_at: string;
  actor: {
    id: number;
    name: string;
    avatar_url: string | null;
    role: "admin" | "user";
  };
};

type NotificationRow = Omit<NotificationItem, "actor"> & {
  actor_id: number;
  actor_name: string;
  actor_avatar_url: string | null;
  actor_role: "admin" | "user";
};

export async function createNotification({
  userId,
  actorId,
  type,
  postId,
  commentId,
}: {
  userId: number;
  actorId: number;
  type: NotificationType;
  postId?: number;
  commentId?: number;
}) {
  if (userId === actorId) return;

  const preferences = await queryOne<{
    notify_likes: 0 | 1;
    notify_comments: 0 | 1;
    notify_follows: 0 | 1;
  }>(
    "SELECT notify_likes, notify_comments, notify_follows FROM users WHERE id = ?",
    [userId],
  );

  if (type === "like" && preferences?.notify_likes === 0) return;
  if (type === "comment" && preferences?.notify_comments === 0) return;
  if (type === "follow" && preferences?.notify_follows === 0) return;

  await execute(
    `
      INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id)
      VALUES (?, ?, ?, ?, ?)
    `,
    [userId, actorId, type, postId ?? null, commentId ?? null],
  );
}

export async function getUnreadNotificationsCount(userId: number) {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL",
    [userId],
  );

  return row?.count ?? 0;
}

export async function getNotifications(userId: number, page = 0, unreadOnly = false) {
  const offset = Math.max(page, 0) * PAGE_SIZE;
  const unreadClause = unreadOnly ? "AND n.read_at IS NULL" : "";
  const rows = await queryAll<NotificationRow>(
    `
      SELECT n.id, n.type, n.post_id, n.comment_id, n.read_at, n.created_at,
        u.id AS actor_id,
        u.name AS actor_name,
        u.avatar_url AS actor_avatar_url,
        u.role AS actor_role
      FROM notifications n
      JOIN users u ON u.id = n.actor_id
      WHERE n.user_id = ? ${unreadClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [userId, PAGE_LIMIT, offset],
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    post_id: row.post_id,
    comment_id: row.comment_id,
    read_at: row.read_at,
    created_at: row.created_at,
    actor: {
      id: row.actor_id,
      name: row.actor_name,
      avatar_url: row.actor_avatar_url,
      role: row.actor_role,
    },
  }));
}

export async function markNotificationsRead(userId: number) {
  return execute(
    "UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL",
    [userId],
  );
}

export async function createGroupPostNotification({
  groupId,
  actorId,
  postId,
}: {
  groupId: number;
  actorId: number;
  postId: number;
}) {
  const members = await queryAll<{ user_id: number }>(
    "SELECT user_id FROM group_members WHERE group_id = ? AND status = 'active' AND user_id != ?",
    [groupId, actorId],
  );

  for (const member of members) {
    await execute(
      "INSERT INTO notifications (user_id, actor_id, type, post_id) VALUES (?, ?, 'group_post', ?)",
      [member.user_id, actorId, postId],
    );
  }
}
