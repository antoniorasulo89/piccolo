import { execute, queryAll, queryOne, type PostWithAuthor } from "./db";
import { PAGE_LIMIT, PAGE_SIZE } from "./pagination";

type GroupRow = {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  description: string;
  privacy: "public" | "private";
  cover_url: string | null;
  created_at: string;
  owner_name: string;
  members_count: number;
  posts_count: number;
  viewer_role: "owner" | "co_owner" | "moderator" | "member" | null;
  viewer_status: "active" | "pending" | null;
};

type GroupPostRow = {
  id: number;
  content: string;
  created_at: string;
  edited_at: string | null;
  pinned_at: string | null;
  user_id: number;
  name: string;
  role: "admin" | "user";
  avatar_url: string | null;
  likes_count: number;
  comments_count: number;
  i_liked: 0 | 1;
  i_bookmarked: 0 | 1;
};

export type CommunityGroup = Omit<GroupRow, "viewer_role" | "viewer_status"> & {
  viewer_role: GroupRow["viewer_role"];
  viewer_status: GroupRow["viewer_status"];
  is_member: boolean;
};

export type GroupRequest = {
  group_id: number;
  user_id: number;
  user_name: string;
  user_avatar_url: string | null;
  created_at: string;
};

function mapGroup(row: GroupRow): CommunityGroup {
  return {
    ...row,
    is_member: row.viewer_status === "active",
  };
}

function mapGroupPost(row: GroupPostRow): PostWithAuthor & { pinned_at: string | null } {
  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    edited_at: row.edited_at,
    pinned_at: row.pinned_at,
    likes_count: row.likes_count,
    comments_count: row.comments_count,
    i_liked: Boolean(row.i_liked),
    i_bookmarked: Boolean(row.i_bookmarked),
    user: {
      id: row.user_id,
      name: row.name,
      role: row.role,
      avatar_url: row.avatar_url,
    },
  };
}

export function slugifyGroupName(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 42);

  return base || `gruppo-${Date.now()}`;
}

export async function uniqueGroupSlug(name: string) {
  const base = slugifyGroupName(name);
  let slug = base;
  let suffix = 2;

  while (await queryOne("SELECT id FROM groups WHERE slug = ?", [slug])) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function getGroups(viewerId: number, filter = "all", page = 0, q = "") {
  const offset = Math.max(page, 0) * PAGE_SIZE;
  const where =
    filter === "mine"
      ? "WHERE gm_self.status = 'active'"
      : filter === "private"
        ? "WHERE g.privacy = 'private' AND gm_self.status = 'active'"
        : "WHERE g.privacy = 'public' OR gm_self.status = 'active'";

  const searchClause = q.trim()
    ? " AND (g.name LIKE ? OR g.description LIKE ?)"
    : "";

  const rows = await queryAll<GroupRow>(
    `
      SELECT g.id, g.owner_id, g.name, g.slug, g.description, g.privacy, g.cover_url, g.created_at,
        owner.name AS owner_name,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') AS members_count,
        (SELECT COUNT(*) FROM posts p WHERE p.group_id = g.id) AS posts_count,
        gm_self.role AS viewer_role,
        gm_self.status AS viewer_status
      FROM groups g
      JOIN users owner ON owner.id = g.owner_id
      LEFT JOIN group_members gm_self ON gm_self.group_id = g.id AND gm_self.user_id = ?
      ${where}${searchClause}
      ORDER BY gm_self.status DESC, g.created_at DESC
      LIMIT ? OFFSET ?
    `,
    q.trim()
      ? [viewerId, `%${q.trim()}%`, `%${q.trim()}%`, PAGE_LIMIT, offset]
      : [viewerId, PAGE_LIMIT, offset],
  );

  return rows.map(mapGroup);
}

export async function getGroupBySlug(slug: string, viewerId: number, page = 0, viewerIsAdmin = false) {
  const group = await queryOne<GroupRow>(
    `
      SELECT g.id, g.owner_id, g.name, g.slug, g.description, g.privacy, g.cover_url, g.created_at,
        owner.name AS owner_name,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') AS members_count,
        (SELECT COUNT(*) FROM posts p WHERE p.group_id = g.id) AS posts_count,
        gm_self.role AS viewer_role,
        gm_self.status AS viewer_status
      FROM groups g
      JOIN users owner ON owner.id = g.owner_id
      LEFT JOIN group_members gm_self ON gm_self.group_id = g.id AND gm_self.user_id = ?
      WHERE g.slug = ?
    `,
    [viewerId, slug],
  );

  if (!group) return null;
  const mapped = mapGroup(group);
  if (mapped.privacy === "private" && !mapped.is_member && !viewerIsAdmin) {
    return { group: mapped, posts: [], requests: [] as GroupRequest[] };
  }

  const offset = Math.max(page, 0) * PAGE_SIZE;
  const posts = await queryAll<GroupPostRow>(
    `
      SELECT p.id, p.content, p.created_at, p.edited_at, p.pinned_at, p.user_id, u.name, u.role, u.avatar_url,
        COUNT(l.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes mine WHERE mine.user_id = ? AND mine.post_id = p.id) AS i_liked,
        EXISTS(SELECT 1 FROM bookmarks bm WHERE bm.user_id = ? AND bm.post_id = p.id) AS i_bookmarked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE p.group_id = ?
      GROUP BY p.id
      ORDER BY p.pinned_at IS NULL, p.pinned_at DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [viewerId, viewerId, mapped.id, PAGE_LIMIT, offset],
  );

  const requests =
    mapped.viewer_role === "owner" || mapped.viewer_role === "co_owner" || viewerIsAdmin
      ? await queryAll<GroupRequest>(
          `
            SELECT gr.group_id, gr.user_id, u.name AS user_name, u.avatar_url AS user_avatar_url, gr.created_at
            FROM group_requests gr
            JOIN users u ON u.id = gr.user_id
            WHERE gr.group_id = ? AND gr.status = 'pending'
            ORDER BY gr.created_at ASC
            LIMIT 20
          `,
          [mapped.id],
        )
      : [];

  return { group: mapped, posts: posts.map(mapGroupPost), requests };
}

export async function createGroup({
  ownerId,
  name,
  description,
  privacy,
}: {
  ownerId: number;
  name: string;
  description: string;
  privacy: "public" | "private";
}) {
  const slug = await uniqueGroupSlug(name);
  const result = await execute(
    "INSERT INTO groups (owner_id, name, slug, description, privacy) VALUES (?, ?, ?, ?, ?)",
    [ownerId, name, slug, description, privacy],
  );
  const groupId = Number(result.lastInsertRowid);
  await execute(
    "INSERT INTO group_members (group_id, user_id, role, status) VALUES (?, ?, 'owner', 'active')",
    [groupId, ownerId],
  );

  return { id: groupId, slug };
}

export async function getGroupMembership(groupId: number, userId: number) {
  return queryOne<{ role: "owner" | "co_owner" | "moderator" | "member"; status: "active" | "pending" }>(
    "SELECT role, status FROM group_members WHERE group_id = ? AND user_id = ?",
    [groupId, userId],
  );
}

export async function canViewGroup(groupId: number, userId: number) {
  const group = await queryOne<{ privacy: "public" | "private" }>(
    "SELECT privacy FROM groups WHERE id = ?",
    [groupId],
  );
  if (!group) return false;
  if (group.privacy === "public") return true;
  const membership = await getGroupMembership(groupId, userId);
  return membership?.status === "active";
}

export async function canViewPost(postId: number, userId: number) {
  const post = await queryOne<{ group_id: number | null }>(
    "SELECT group_id FROM posts WHERE id = ?",
    [postId],
  );
  if (!post) return false;
  if (!post.group_id) return true;
  return canViewGroup(post.group_id, userId);
}

export async function getPendingGroupRequestsCount(userId: number) {
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM group_requests gr
     JOIN groups g ON g.id = gr.group_id
     JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ? AND gm.status = 'active'
     WHERE gr.status = 'pending' AND gm.role IN ('owner', 'co_owner')`,
    [userId],
  );
  return row?.count ?? 0;
}

export async function getGroupMembers(groupId: number) {
  return queryAll<{
    user_id: number;
    name: string;
    avatar_url: string | null;
    role: "owner" | "co_owner" | "moderator" | "member";
    joined_at: string;
  }>(
    `SELECT u.id AS user_id, u.name, u.avatar_url, gm.role, gm.created_at AS joined_at
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = ? AND gm.status = 'active'
     ORDER BY CASE gm.role WHEN 'owner' THEN 1 WHEN 'co_owner' THEN 2 WHEN 'moderator' THEN 3 ELSE 4 END, gm.created_at ASC`,
    [groupId],
  );
}
