import { execute, queryAll, queryOne } from "./db";
import { PAGE_LIMIT, PAGE_SIZE } from "./pagination";

export type AdminStats = {
  users: number;
  admins: number;
  suspended: number;
  posts: number;
  comments: number;
  likes: number;
  follows: number;
  reports: number;
  groups: number;
  private_groups: number;
  conversations: number;
  messages: number;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  suspended_at: string | null;
  created_at: string;
  posts_count: number;
  followers_count: number;
};

export type AuditLog = {
  id: number;
  action: string;
  target_type: string;
  target_id: number;
  note: string;
  admin_override: 0 | 1;
  created_at: string;
  admin_name: string;
};

export type AdminGroupRow = {
  id: number;
  name: string;
  slug: string;
  privacy: string;
  description: string;
  created_at: string;
  owner_name: string;
  owner_id: number;
  members_count: number;
  posts_count: number;
  pending_requests: number;
};

export type AdminPost = {
  id: number;
  content: string;
  created_at: string;
  author_id: number;
  author_name: string;
  author_email: string;
  likes_count: number;
};

export type AdminComment = {
  id: number;
  content: string;
  created_at: string;
  post_id: number;
  author_id: number;
  author_name: string;
  author_email: string;
  post_author_name: string;
};

export async function getAdminStats(): Promise<AdminStats> {
  return (
    (await queryOne<AdminStats>(
      `
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins,
        (SELECT COUNT(*) FROM users WHERE suspended_at IS NOT NULL) AS suspended,
        (SELECT COUNT(*) FROM posts) AS posts,
        (SELECT COUNT(*) FROM comments) AS comments,
        (SELECT COUNT(*) FROM likes) AS likes,
        (SELECT COUNT(*) FROM follows) AS follows,
        (SELECT COUNT(*) FROM reports WHERE status = 'open') AS reports,
        (SELECT COUNT(*) FROM groups) AS groups,
        (SELECT COUNT(*) FROM groups WHERE privacy = 'private') AS private_groups,
        (SELECT COUNT(*) FROM conversations) AS conversations,
        (SELECT COUNT(*) FROM messages WHERE deleted_at IS NULL) AS messages
    `,
    )) ?? {
      users: 0,
      admins: 0,
      suspended: 0,
      posts: 0,
      comments: 0,
      likes: 0,
      follows: 0,
      reports: 0,
      groups: 0,
      private_groups: 0,
      conversations: 0,
      messages: 0,
    }
  );
}

export async function getAdminUsers(page = 0) {
  const offset = Math.max(page, 0) * PAGE_SIZE;

  return queryAll<AdminUser>(
    `
      SELECT u.id, u.name, u.email, u.role, u.suspended_at, u.created_at,
        COUNT(DISTINCT p.id) AS posts_count,
        COUNT(DISTINCT f.follower_id) AS followers_count
      FROM users u
      LEFT JOIN posts p ON p.user_id = u.id
      LEFT JOIN follows f ON f.following_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [PAGE_LIMIT, offset],
  );
}

export async function getAdminPosts(page = 0) {
  const offset = Math.max(page, 0) * PAGE_SIZE;

  return queryAll<AdminPost>(
    `
      SELECT p.id, p.content, p.created_at,
        u.id AS author_id,
        u.name AS author_name,
        u.email AS author_email,
        COUNT(l.post_id) AS likes_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes l ON l.post_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [PAGE_LIMIT, offset],
  );
}

export async function getAdminComments(page = 0) {
  const offset = Math.max(page, 0) * PAGE_SIZE;

  return queryAll<AdminComment>(
    `
      SELECT c.id, c.content, c.created_at, c.post_id,
        u.id AS author_id,
        u.name AS author_name,
        u.email AS author_email,
        post_author.name AS post_author_name
      FROM comments c
      JOIN users u ON u.id = c.user_id
      JOIN posts p ON p.id = c.post_id
      JOIN users post_author ON post_author.id = p.user_id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [PAGE_LIMIT, offset],
  );
}

export async function adminCount() {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'",
  );

  return row?.count ?? 0;
}

export async function setUserRole(userId: number, role: "admin" | "user") {
  return execute("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
}

export async function setUserSuspension(userId: number, suspended: boolean) {
  return execute(
    "UPDATE users SET suspended_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ?",
    [suspended ? 1 : 0, userId],
  );
}

export async function recordAuditLog({
  adminId,
  action,
  targetType,
  targetId,
  note = "",
}: {
  adminId: number;
  action: string;
  targetType: string;
  targetId: number;
  note?: string;
}) {
  return execute(
    `
      INSERT INTO audit_logs (admin_id, action, target_type, target_id, note, admin_override)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [adminId, action, targetType, targetId, note, note.includes("admin_override=true") ? 1 : 0],
  );
}

export async function getAuditLogs(
  page = 0,
  filters?: { action?: string; adminOverride?: boolean; from?: string; to?: string },
) {
  const offset = Math.max(page, 0) * PAGE_SIZE;
  const clauses: string[] = [];
  const args: (string | number)[] = [];

  if (filters?.action) {
    clauses.push("a.action = ?");
    args.push(filters.action);
  }
  if (filters?.adminOverride) {
    clauses.push("a.admin_override = 1");
  }
  if (filters?.from) {
    clauses.push("a.created_at >= ?");
    args.push(filters.from);
  }
  if (filters?.to) {
    clauses.push("a.created_at <= ?");
    args.push(filters.to.includes(" ") ? filters.to : `${filters.to} 23:59:59`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  return queryAll<AuditLog>(
    `
      SELECT a.id, a.action, a.target_type, a.target_id, a.note, a.admin_override, a.created_at,
        u.name AS admin_name
      FROM audit_logs a
      JOIN users u ON u.id = a.admin_id
      ${where}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...args, PAGE_LIMIT, offset],
  );
}

export async function getAdminGroups(filters?: {
  q?: string;
  privacy?: string;
  ownerId?: number;
  page?: number;
}) {
  const page = filters?.page ?? 0;
  const offset = Math.max(page, 0) * PAGE_SIZE;
  const clauses: string[] = [];
  const args: (string | number)[] = [];

  if (filters?.q) {
    clauses.push("(g.name LIKE ? OR g.description LIKE ?)");
    args.push(`%${filters.q}%`, `%${filters.q}%`);
  }
  if (filters?.privacy) {
    clauses.push("g.privacy = ?");
    args.push(filters.privacy);
  }
  if (filters?.ownerId) {
    clauses.push("g.owner_id = ?");
    args.push(filters.ownerId);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  return queryAll<AdminGroupRow>(
    `SELECT g.id, g.name, g.slug, g.privacy, g.description, g.created_at,
       u.name AS owner_name, g.owner_id,
       (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') AS members_count,
       (SELECT COUNT(*) FROM posts p WHERE p.group_id = g.id) AS posts_count,
       (SELECT COUNT(*) FROM group_requests gr WHERE gr.group_id = g.id AND gr.status = 'pending') AS pending_requests
     FROM groups g
     JOIN users u ON u.id = g.owner_id
     ${where}
     ORDER BY g.created_at DESC
     LIMIT ? OFFSET ?`,
    [...args, PAGE_LIMIT, offset],
  );
}
