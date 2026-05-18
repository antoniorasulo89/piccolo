import { queryAll, queryOne, type PostWithAuthor, type PublicUser } from "./db";
import { canViewGroup } from "./community";
import { PAGE_LIMIT, PAGE_SIZE } from "./pagination";

type PostRow = {
  id: number;
  content: string;
  created_at: string;
  edited_at: string | null;
  group_id?: number | null;
  group_name?: string | null;
  group_slug?: string | null;
  user_id: number;
  name: string;
  role: "admin" | "user";
  avatar_url: string | null;
  likes_count: number;
  comments_count: number;
  i_liked: 0 | 1;
  i_bookmarked: 0 | 1;
};

export type FeedScope = "following" | "all" | "groups";

export type CommentWithAuthor = {
  id: number;
  content: string;
  created_at: string;
  edited_at: string | null;
  user: {
    id: number;
    name: string;
    avatar_url: string | null;
    role?: "admin" | "user";
  };
};

type CommentRow = {
  id: number;
  content: string;
  created_at: string;
  edited_at: string | null;
  user_id: number;
  name: string;
  role: "admin" | "user";
  avatar_url: string | null;
};

export type DiscoverUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  bio: string;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
  i_follow: boolean;
  is_new: boolean;
};

export type ProfileComment = {
  id: number;
  content: string;
  created_at: string;
  edited_at: string | null;
  post_id: number;
  post_content: string;
};

function mapPost(row: PostRow): PostWithAuthor & { group_name?: string | null; group_slug?: string | null } {
  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    edited_at: row.edited_at,
    likes_count: row.likes_count,
    comments_count: row.comments_count,
    i_liked: Boolean(row.i_liked),
    i_bookmarked: Boolean(row.i_bookmarked),
    group_name: row.group_name,
    group_slug: row.group_slug,
    user: {
      id: row.user_id,
      name: row.name,
      role: row.role,
      avatar_url: row.avatar_url,
    },
  };
}

function mapComment(row: CommentRow): CommentWithAuthor {
  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    edited_at: row.edited_at,
    user: {
      id: row.user_id,
      name: row.name,
      role: row.role,
      avatar_url: row.avatar_url,
    },
  };
}

function ftsQuery(search: string) {
  return search
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .map((token) => `${token}*`)
    .join(" OR ");
}

export async function getFeedPosts(
  userId: number,
  page = 0,
  scope: FeedScope = "following",
) {
  const offset = Math.max(page, 0) * PAGE_SIZE;

  if (scope === "groups") {
    const rows = await queryAll<PostRow>(
      `
        SELECT p.id, p.content, p.created_at, p.edited_at, p.group_id, p.user_id, u.name, u.role, u.avatar_url,
          g.name AS group_name, g.slug AS group_slug,
          COUNT(l.post_id) AS likes_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
          EXISTS(SELECT 1 FROM likes mine WHERE mine.user_id = ? AND mine.post_id = p.id) AS i_liked,
          EXISTS(SELECT 1 FROM bookmarks bm WHERE bm.user_id = ? AND bm.post_id = p.id) AS i_bookmarked
        FROM posts p
        JOIN users u ON u.id = p.user_id
        JOIN groups g ON g.id = p.group_id
        JOIN group_members gm ON gm.group_id = p.group_id AND gm.user_id = ? AND gm.status = 'active'
        LEFT JOIN likes l ON l.post_id = p.id
        WHERE p.group_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = p.user_id)
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [userId, userId, userId, userId, PAGE_LIMIT, offset],
    );
    return rows.map(mapPost);
  }

  const where =
    scope === "all"
      ? "WHERE p.group_id IS NULL AND NOT EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = p.user_id)"
      : "WHERE p.group_id IS NULL AND (p.user_id = ? OR f.follower_id IS NOT NULL) AND NOT EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = p.user_id)";
  const rows = await queryAll<PostRow>(
    `
      SELECT p.id, p.content, p.created_at, p.edited_at, p.group_id, p.user_id, u.name, u.role, u.avatar_url,
        COUNT(l.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        EXISTS(
          SELECT 1 FROM likes mine
          WHERE mine.user_id = ? AND mine.post_id = p.id
        ) AS i_liked,
        EXISTS(
          SELECT 1 FROM bookmarks bm
          WHERE bm.user_id = ? AND bm.post_id = p.id
        ) AS i_bookmarked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN follows f ON f.following_id = p.user_id AND f.follower_id = ?
      LEFT JOIN likes l ON l.post_id = p.id
      ${where}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `,
    scope === "all"
      ? [userId, userId, userId, userId, PAGE_LIMIT, offset]
      : [userId, userId, userId, userId, userId, PAGE_LIMIT, offset],
  );

  return rows.map(mapPost);
}

export async function getUserProfile(profileId: number, viewerId?: number, page = 0) {
  const offset = Math.max(page, 0) * PAGE_SIZE;
  const user = await queryOne<PublicUser>(
    "SELECT id, name, email, role, bio, avatar_url, cover_url, onboarded_at, suspended_at, privacy_show_email, privacy_discoverable, theme_preference, notify_likes, notify_comments, notify_follows, created_at, created_at >= datetime('now', '-7 days') AS is_new FROM users WHERE id = ?",
    [profileId],
  );

  if (!user) return null;

  const stats = await queryOne<{
    followers_count: number;
    following_count: number;
    posts_count: number;
    i_follow: 0 | 1;
  }>(
    `
      SELECT
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) AS following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = ?) AS posts_count,
        EXISTS(
          SELECT 1 FROM follows
          WHERE follower_id = ? AND following_id = ?
        ) AS i_follow
    `,
    [profileId, profileId, profileId, viewerId ?? 0, profileId],
  );

  const posts = await queryAll<PostRow>(
    `
      SELECT p.id, p.content, p.created_at, p.edited_at, p.user_id, u.name, u.role, u.avatar_url,
        COUNT(l.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        EXISTS(
          SELECT 1 FROM likes mine
          WHERE mine.user_id = ? AND mine.post_id = p.id
        ) AS i_liked,
        EXISTS(
          SELECT 1 FROM bookmarks bm
          WHERE bm.user_id = ? AND bm.post_id = p.id
        ) AS i_bookmarked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE p.user_id = ? AND p.group_id IS NULL
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [viewerId ?? 0, viewerId ?? 0, profileId, PAGE_LIMIT, offset],
  );

  return {
    user,
    posts: posts.map(mapPost),
    followers_count: stats?.followers_count ?? 0,
    following_count: stats?.following_count ?? 0,
    posts_count: stats?.posts_count ?? 0,
    i_follow: Boolean(stats?.i_follow),
  };
}

export async function getUserComments(profileId: number, page = 0) {
  const offset = Math.max(page, 0) * PAGE_SIZE;
  return queryAll<ProfileComment>(
    `
      SELECT c.id, c.content, c.created_at, c.edited_at,
        p.id AS post_id,
        p.content AS post_content
      FROM comments c
      JOIN posts p ON p.id = c.post_id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [profileId, PAGE_LIMIT, offset],
  );
}

export async function getPostDetail(postId: number, viewerId: number) {
  const row = await queryOne<PostRow>(
    `
      SELECT p.id, p.content, p.created_at, p.edited_at, p.user_id, u.name, u.role, u.avatar_url,
        COUNT(l.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        EXISTS(
          SELECT 1 FROM likes mine
          WHERE mine.user_id = ? AND mine.post_id = p.id
        ) AS i_liked,
        EXISTS(
          SELECT 1 FROM bookmarks bm
          WHERE bm.user_id = ? AND bm.post_id = p.id
        ) AS i_bookmarked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `,
    [viewerId, viewerId, postId],
  );

  if (!row) return null;

  if (row.group_id && !(await canViewGroup(row.group_id, viewerId))) {
    return null;
  }

  const comments = await queryAll<CommentRow>(
    `
      SELECT c.id, c.content, c.created_at, c.edited_at, c.user_id, u.name, u.role, u.avatar_url
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
      LIMIT 100
    `,
    [postId],
  );

  return {
    post: mapPost(row),
    comments: comments.map(mapComment),
  };
}

export async function getDiscoverUsers(viewerId: number, search = "") {
  const page = 0;
  const offset = page * 100;
  const term = search.trim();
  const pattern = `%${term}%`;
  const rows = await queryAll<
    Omit<DiscoverUser, "i_follow" | "is_new"> & { i_follow: 0 | 1; is_new: 0 | 1 }
  >(
    `
      SELECT u.id, u.name, u.email, u.role, u.bio, u.avatar_url, u.cover_url, u.created_at,
        u.created_at >= datetime('now', '-7 days') AS is_new,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND group_id IS NULL) AS posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
        EXISTS(
          SELECT 1 FROM follows
          WHERE follower_id = ? AND following_id = u.id
        ) AS i_follow
      FROM users u
      WHERE u.id != ?
        AND u.privacy_discoverable = 1
        AND NOT EXISTS (SELECT 1 FROM user_blocks WHERE (blocker_id = ? AND blocked_id = u.id) OR (blocker_id = u.id AND blocked_id = ?))
        AND (? = '' OR u.name LIKE ? OR (u.privacy_show_email = 1 AND u.email LIKE ?) OR u.bio LIKE ?)
      ORDER BY i_follow ASC, u.created_at DESC
      LIMIT 100 OFFSET ?
    `,
    [viewerId, viewerId, viewerId, viewerId, term, pattern, pattern, pattern, offset],
  );

  return rows.map((user) => ({
    ...user,
    i_follow: Boolean(user.i_follow),
    is_new: Boolean(user.is_new),
  }));
}

export async function getSuggestedUsers(viewerId: number, limit = 4) {
  const rows = await queryAll<
    Omit<DiscoverUser, "i_follow" | "is_new"> & { i_follow: 0 | 1; is_new: 0 | 1 }
  >(
    `
      SELECT u.id, u.name, u.email, u.role, u.bio, u.avatar_url, u.cover_url, u.created_at,
        u.created_at >= datetime('now', '-7 days') AS is_new,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND group_id IS NULL) AS posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
        0 AS i_follow
      FROM users u
      WHERE u.id != ?
        AND NOT EXISTS (
          SELECT 1 FROM follows
          WHERE follower_id = ? AND following_id = u.id
        )
        AND NOT EXISTS (SELECT 1 FROM user_blocks WHERE (blocker_id = ? AND blocked_id = u.id) OR (blocker_id = u.id AND blocked_id = ?))
      ORDER BY followers_count DESC, u.created_at DESC
      LIMIT ?
    `,
    [viewerId, viewerId, viewerId, viewerId, limit],
  );

  return rows.map((user) => ({
    ...user,
    i_follow: Boolean(user.i_follow),
    is_new: Boolean(user.is_new),
  }));
}

export async function getBookmarkedPosts(userId: number, page = 0) {
  const offset = Math.max(page, 0) * PAGE_SIZE;
  const rows = await queryAll<PostRow>(
    `
      SELECT p.id, p.content, p.created_at, p.edited_at, p.user_id, u.name, u.role, u.avatar_url,
        COUNT(l.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        EXISTS(
          SELECT 1 FROM likes mine
          WHERE mine.user_id = ? AND mine.post_id = p.id
        ) AS i_liked,
        1 AS i_bookmarked
      FROM bookmarks b
      JOIN posts p ON p.id = b.post_id
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE b.user_id = ? AND p.group_id IS NULL
        AND NOT EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = p.user_id)
      GROUP BY p.id
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [userId, userId, userId, PAGE_LIMIT, offset],
  );

  return rows.map(mapPost);
}

export async function searchPosts(userId: number, search = "", page = 0) {
  const term = search.trim();
  if (!term) return [];
  const offset = Math.max(page, 0) * PAGE_SIZE;

  const pattern = `%${term}%`;
  const match = ftsQuery(term);
  if (match) {
    const rows = await queryAll<PostRow>(
      `
        SELECT p.id, p.content, p.created_at, p.edited_at, p.user_id, u.name, u.role, u.avatar_url,
          COUNT(l.post_id) AS likes_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
          EXISTS(
            SELECT 1 FROM likes mine
            WHERE mine.user_id = ? AND mine.post_id = p.id
          ) AS i_liked,
          EXISTS(
            SELECT 1 FROM bookmarks bm
            WHERE bm.user_id = ? AND bm.post_id = p.id
          ) AS i_bookmarked
        FROM post_fts
        JOIN posts p ON p.id = post_fts.post_id
        JOIN users u ON u.id = p.user_id
        LEFT JOIN likes l ON l.post_id = p.id
        WHERE post_fts MATCH ? AND p.group_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = p.user_id)
        GROUP BY p.id
        ORDER BY bm25(post_fts), p.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [userId, userId, match, userId, PAGE_LIMIT, offset],
    );

    return rows.map(mapPost);
  }

  const rows = await queryAll<PostRow>(
    `
      SELECT p.id, p.content, p.created_at, p.edited_at, p.user_id, u.name, u.role, u.avatar_url,
        COUNT(l.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        EXISTS(
          SELECT 1 FROM likes mine
          WHERE mine.user_id = ? AND mine.post_id = p.id
        ) AS i_liked,
        EXISTS(
          SELECT 1 FROM bookmarks bm
          WHERE bm.user_id = ? AND bm.post_id = p.id
        ) AS i_bookmarked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE p.group_id IS NULL AND (p.content LIKE ? OR u.name LIKE ?)
        AND NOT EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = p.user_id)
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [userId, userId, pattern, pattern, userId, PAGE_LIMIT, offset],
  );

  return rows.map(mapPost);
}
