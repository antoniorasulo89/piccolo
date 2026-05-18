import { createClient, type Client, type InArgs } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const localDbPath = path.join(dataDir, process.env.TEST_DB_PATH ?? "social.db");
const SCHEMA_VERSION = 3;

type GlobalWithDb = typeof globalThis & {
  __socialDb?: Client;
  __socialDbMigrated?: boolean;
};

function databaseUrl() {
  if (process.env.TEST_DB_PATH) {
    mkdirSync(dataDir, { recursive: true });
    return `file:${localDbPath}`;
  }

  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }

  mkdirSync(dataDir, { recursive: true });
  return `file:${localDbPath}`;
}

export function getDb() {
  const globalDb = globalThis as GlobalWithDb;

  if (!globalDb.__socialDb) {
    globalDb.__socialDb = createClient({
      url: databaseUrl(),
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  return globalDb.__socialDb;
}

export async function migrate() {
  const globalDb = globalThis as GlobalWithDb;
  if (globalDb.__socialDbMigrated) return;

  const db = getDb();
  await db.batch(
    [
      `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        bio TEXT NOT NULL DEFAULT '',
        avatar_url TEXT DEFAULT NULL,
        cover_url TEXT DEFAULT NULL,
        onboarded_at TEXT DEFAULT NULL,
        suspended_at TEXT DEFAULT NULL,
        privacy_show_email INTEGER NOT NULL DEFAULT 0,
        privacy_discoverable INTEGER NOT NULL DEFAULT 1,
        theme_preference TEXT NOT NULL DEFAULT 'system',
        notify_likes INTEGER NOT NULL DEFAULT 1,
        notify_comments INTEGER NOT NULL DEFAULT 1,
        notify_follows INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        group_id INTEGER DEFAULT NULL,
        content TEXT NOT NULL,
        edited_at TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS likes (
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS bookmarks (
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        edited_at TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS follows (
        follower_id INTEGER NOT NULL,
        following_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id),
        CHECK (follower_id != following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        actor_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        post_id INTEGER DEFAULT NULL,
        comment_id INTEGER DEFAULT NULL,
        group_id INTEGER DEFAULT NULL,
        read_at TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        reporter_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at TEXT DEFAULT NULL,
        resolved_by INTEGER DEFAULT NULL,
        resolution_note TEXT NOT NULL DEFAULT '',
        UNIQUE(post_id, reporter_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS _meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT DEFAULT NULL,
        created_by INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        privacy TEXT NOT NULL DEFAULT 'public',
        cover_url TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS group_members (
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS group_requests (
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS group_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        created_by INTEGER NOT NULL,
        max_uses INTEGER DEFAULT NULL,
        used_count INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL DEFAULT 'direct',
        title TEXT NOT NULL DEFAULT '',
        created_by INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS conversation_members (
        conversation_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        last_read_at TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (conversation_id, user_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        edited_at TEXT DEFAULT NULL,
        deleted_at TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS message_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        reporter_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, reporter_id),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      `
      CREATE TABLE IF NOT EXISTS group_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        reporter_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, reporter_id),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      "CREATE VIRTUAL TABLE IF NOT EXISTS post_fts USING fts5(post_id UNINDEXED, content, author)",
      `
      CREATE TRIGGER IF NOT EXISTS posts_fts_ai
      AFTER INSERT ON posts BEGIN
        INSERT INTO post_fts(rowid, post_id, content, author)
        VALUES (new.id, new.id, new.content, (SELECT name FROM users WHERE id = new.user_id));
      END
    `,
      `
      CREATE TRIGGER IF NOT EXISTS posts_fts_ad
      AFTER DELETE ON posts BEGIN
        DELETE FROM post_fts WHERE post_id = old.id;
      END
    `,
      `
      CREATE TRIGGER IF NOT EXISTS posts_fts_au
      AFTER UPDATE OF content ON posts BEGIN
        DELETE FROM post_fts WHERE post_id = old.id;
        INSERT INTO post_fts(rowid, post_id, content, author)
        VALUES (new.id, new.id, new.content, (SELECT name FROM users WHERE id = new.user_id));
      END
    `,
      "CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id, following_id)",
      "CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id)",
      "CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_groups_privacy_created ON groups(privacy, created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id, group_id)",
      "CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id, conversation_id)",
      "CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash)",
      `
      CREATE TABLE IF NOT EXISTS group_member_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        invited_user_id INTEGER NOT NULL,
        invited_by INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        responded_at TEXT DEFAULT NULL,
        expires_at TEXT DEFAULT NULL,
        UNIQUE(group_id, invited_user_id),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (invited_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      "CREATE INDEX IF NOT EXISTS idx_group_member_invites_user ON group_member_invites(invited_user_id, group_id)",
      `
      CREATE TABLE IF NOT EXISTS user_blocks (
        blocker_id INTEGER NOT NULL,
        blocked_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (blocker_id, blocked_id),
        CHECK (blocker_id != blocked_id),
        FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      "CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id, blocker_id)",
      `
      INSERT INTO _meta (key, value)
      VALUES ('schema_version', '${SCHEMA_VERSION}')
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `,
    ],
    "write",
  );

  const columns = await db.execute("PRAGMA table_info(users)");
  const hasRole = columns.rows.some((column) => column.name === "role");
  const hasCoverUrl = columns.rows.some((column) => column.name === "cover_url");
  const hasOnboardedAt = columns.rows.some((column) => column.name === "onboarded_at");
  const hasSuspendedAt = columns.rows.some((column) => column.name === "suspended_at");
  const hasPrivacyShowEmail = columns.rows.some((column) => column.name === "privacy_show_email");
  const hasPrivacyDiscoverable = columns.rows.some((column) => column.name === "privacy_discoverable");
  const hasThemePreference = columns.rows.some((column) => column.name === "theme_preference");
  const hasNotifyLikes = columns.rows.some((column) => column.name === "notify_likes");
  const hasNotifyComments = columns.rows.some((column) => column.name === "notify_comments");
  const hasNotifyFollows = columns.rows.some((column) => column.name === "notify_follows");

  if (!hasRole) {
    await db.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }

  if (!hasCoverUrl) {
    await db.execute("ALTER TABLE users ADD COLUMN cover_url TEXT DEFAULT NULL");
  }

  if (!hasOnboardedAt) {
    await db.execute("ALTER TABLE users ADD COLUMN onboarded_at TEXT DEFAULT NULL");
  }

  if (!hasSuspendedAt) {
    await db.execute("ALTER TABLE users ADD COLUMN suspended_at TEXT DEFAULT NULL");
  }

  if (!hasPrivacyShowEmail) {
    await db.execute("ALTER TABLE users ADD COLUMN privacy_show_email INTEGER NOT NULL DEFAULT 0");
  }

  if (!hasPrivacyDiscoverable) {
    await db.execute("ALTER TABLE users ADD COLUMN privacy_discoverable INTEGER NOT NULL DEFAULT 1");
  }

  if (!hasThemePreference) {
    await db.execute("ALTER TABLE users ADD COLUMN theme_preference TEXT NOT NULL DEFAULT 'system'");
  }

  if (!hasNotifyLikes) {
    await db.execute("ALTER TABLE users ADD COLUMN notify_likes INTEGER NOT NULL DEFAULT 1");
  }

  if (!hasNotifyComments) {
    await db.execute("ALTER TABLE users ADD COLUMN notify_comments INTEGER NOT NULL DEFAULT 1");
  }

  if (!hasNotifyFollows) {
    await db.execute("ALTER TABLE users ADD COLUMN notify_follows INTEGER NOT NULL DEFAULT 1");
  }

  const hasNotifyGroupPosts = columns.rows.some((column) => column.name === "notify_group_posts");
  if (!hasNotifyGroupPosts) {
    await db.execute("ALTER TABLE users ADD COLUMN notify_group_posts INTEGER NOT NULL DEFAULT 1");
  }

  const postColumns = await db.execute("PRAGMA table_info(posts)");
  const hasPostGroupId = postColumns.rows.some((column) => column.name === "group_id");
  const hasPostEditedAt = postColumns.rows.some((column) => column.name === "edited_at");

  if (!hasPostGroupId) {
    await db.execute("ALTER TABLE posts ADD COLUMN group_id INTEGER DEFAULT NULL");
  }

  await db.execute("CREATE INDEX IF NOT EXISTS idx_posts_group_created ON posts(group_id, created_at DESC)");
  await db.execute(`
    INSERT INTO post_fts(rowid, post_id, content, author)
    SELECT p.id, p.id, p.content, u.name
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE NOT EXISTS (SELECT 1 FROM post_fts f WHERE f.post_id = p.id)
  `);

  if (!hasPostEditedAt) {
    await db.execute("ALTER TABLE posts ADD COLUMN edited_at TEXT DEFAULT NULL");
  }

  const commentColumns = await db.execute("PRAGMA table_info(comments)");
  const hasCommentEditedAt = commentColumns.rows.some((column) => column.name === "edited_at");

  if (!hasCommentEditedAt) {
    await db.execute("ALTER TABLE comments ADD COLUMN edited_at TEXT DEFAULT NULL");
  }

  const reportColumns = await db.execute("PRAGMA table_info(reports)");
  const hasReportCategory = reportColumns.rows.some((column) => column.name === "category");
  const hasReportResolvedBy = reportColumns.rows.some((column) => column.name === "resolved_by");
  const hasReportResolutionNote = reportColumns.rows.some((column) => column.name === "resolution_note");

  if (!hasReportCategory) {
    await db.execute("ALTER TABLE reports ADD COLUMN category TEXT NOT NULL DEFAULT 'other'");
  }

  if (!hasReportResolvedBy) {
    await db.execute("ALTER TABLE reports ADD COLUMN resolved_by INTEGER DEFAULT NULL");
  }

  if (!hasReportResolutionNote) {
    await db.execute("ALTER TABLE reports ADD COLUMN resolution_note TEXT NOT NULL DEFAULT ''");
  }

  const hasPostPinnedAt = postColumns.rows.some((column) => column.name === "pinned_at");
  if (!hasPostPinnedAt) {
    await db.execute("ALTER TABLE posts ADD COLUMN pinned_at TEXT DEFAULT NULL");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(pinned_at)");
  }

  const hasGroupInvitesCreatedBy = await db.execute("PRAGMA table_info(group_invites)");
  if (hasGroupInvitesCreatedBy.rows.length > 0) {
    const inviteColumns = await db.execute("PRAGMA table_info(group_invites)");
    const hasInviteCreatedBy = inviteColumns.rows.some((column) => column.name === "created_by");
    if (!hasInviteCreatedBy) {
      await db.execute("ALTER TABLE group_invites ADD COLUMN created_by INTEGER DEFAULT NULL");
    }
    const hasInviteRevokedAt = inviteColumns.rows.some((column) => column.name === "revoked_at");
    if (!hasInviteRevokedAt) {
      await db.execute("ALTER TABLE group_invites ADD COLUMN revoked_at TEXT DEFAULT NULL");
    }
    const hasInviteRevokedBy = inviteColumns.rows.some((column) => column.name === "revoked_by");
    if (!hasInviteRevokedBy) {
      await db.execute("ALTER TABLE group_invites ADD COLUMN revoked_by INTEGER DEFAULT NULL");
    }
  }

  const miColumns = await db.execute("PRAGMA table_info(group_member_invites)");
  const hasGroupMemberInvites = miColumns.rows.length > 0;
  const hasMiStatus = hasGroupMemberInvites && miColumns.rows.some((column) => column.name === "status");
  if (hasGroupMemberInvites && !hasMiStatus) {
    await db.execute("ALTER TABLE group_member_invites ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'");
    await db.execute("ALTER TABLE group_member_invites ADD COLUMN responded_at TEXT DEFAULT NULL");
    await db.execute("ALTER TABLE group_member_invites ADD COLUMN expires_at TEXT DEFAULT NULL");
  }

  const notifColumns = await db.execute("PRAGMA table_info(notifications)");
  const hasNotifGroupId = notifColumns.rows.some((column) => column.name === "group_id");
  if (!hasNotifGroupId) {
    await db.execute("ALTER TABLE notifications ADD COLUMN group_id INTEGER DEFAULT NULL");
  }
  await db.execute("CREATE INDEX IF NOT EXISTS idx_notifications_group ON notifications(group_id)");

  const auditColumns = await db.execute("PRAGMA table_info(audit_logs)");
  const hasAdminOverride = auditColumns.rows.some((column) => column.name === "admin_override");
  if (!hasAdminOverride) {
    await db.execute("ALTER TABLE audit_logs ADD COLUMN admin_override INTEGER NOT NULL DEFAULT 0");
    await db.execute("UPDATE audit_logs SET admin_override = 1 WHERE note LIKE '%admin_override=true%'");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_audit_admin_override ON audit_logs(admin_override)");
  }

  const convMemColumns = await db.execute("PRAGMA table_info(conversation_members)");
  const hasLeftAt = convMemColumns.rows.some((column) => column.name === "left_at");
  if (!hasLeftAt) {
    await db.execute("ALTER TABLE conversation_members ADD COLUMN left_at TEXT DEFAULT NULL");
    await db.execute("ALTER TABLE conversation_members ADD COLUMN archived_at TEXT DEFAULT NULL");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_conversation_members_archived ON conversation_members(user_id, archived_at)");
  }

  globalDb.__socialDbMigrated = true;
}

export async function queryOne<T>(
  sql: string,
  args?: InArgs,
) {
  await migrate();
  const result = await getDb().execute(sql, args);
  const row = result.rows[0];
  return row ? ({ ...row } as T) : null;
}

export async function queryAll<T>(
  sql: string,
  args?: InArgs,
) {
  await migrate();
  const result = await getDb().execute(sql, args);
  return result.rows.map((row) => ({ ...row }) as T);
}

export async function execute(
  sql: string,
  args?: InArgs,
) {
  await migrate();
  return getDb().execute(sql, args);
}

export type PublicUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  bio: string;
  avatar_url: string | null;
  cover_url: string | null;
  onboarded_at: string | null;
  suspended_at: string | null;
  privacy_show_email: 0 | 1 | boolean;
  privacy_discoverable: 0 | 1 | boolean;
  theme_preference: "light" | "dark" | "system";
  notify_likes: 0 | 1 | boolean;
  notify_comments: 0 | 1 | boolean;
  notify_follows: 0 | 1 | boolean;
  notify_group_posts: 0 | 1 | boolean;
  created_at: string;
  is_new?: 0 | 1 | boolean;
};

export type PostWithAuthor = {
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
  likes_count: number;
  comments_count: number;
  i_liked: boolean;
  i_bookmarked: boolean;
};
