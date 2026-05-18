import { execute, queryAll, queryOne } from "./db";
import { PAGE_SIZE } from "./pagination";

export type ConversationSummary = {
  id: number;
  type: "direct" | "group_dm";
  title: string;
  created_at: string;
  last_message: string | null;
  last_message_at: string | null;
  members_label: string;
  unread_count: number;
};

export type ChatMessage = {
  id: number;
  content: string;
  created_at: string;
  sender: {
    id: number;
    name: string;
    avatar_url: string | null;
    role: "admin" | "user";
  };
};

export type ConversationMember = {
  id: number;
  name: string;
  avatar_url: string | null;
  role: "admin" | "user";
};

export type ConversationDetail = {
  conversation: { id: number; type: "direct" | "group_dm"; title: string };
  members: ConversationMember[];
  messages: ChatMessage[];
  viewerRole: string | null;
};

export async function getConversations(userId: number) {
  return queryAll<ConversationSummary>(
    `
      SELECT c.id, c.type, c.title, c.created_at,
        latest.content AS last_message,
        latest.created_at AS last_message_at,
        (
          SELECT group_concat(u.name, ', ')
          FROM conversation_members cm2
          JOIN users u ON u.id = cm2.user_id
          WHERE cm2.conversation_id = c.id AND cm2.user_id != ? AND cm2.left_at IS NULL
        ) AS members_label,
        (
          SELECT COUNT(*)
          FROM messages m
          JOIN conversation_members mine ON mine.conversation_id = m.conversation_id AND mine.user_id = ?
          WHERE m.conversation_id = c.id
            AND m.sender_id != ?
            AND (mine.last_read_at IS NULL OR m.created_at > mine.last_read_at)
        ) AS unread_count
      FROM conversations c
      JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = ? AND cm.left_at IS NULL AND cm.archived_at IS NULL
      LEFT JOIN messages latest ON latest.id = (
        SELECT m2.id FROM messages m2
        WHERE m2.conversation_id = c.id
        ORDER BY m2.created_at DESC, m2.id DESC
        LIMIT 1
      )
      ORDER BY COALESCE(latest.created_at, c.created_at) DESC
      LIMIT 100
    `,
    [userId, userId, userId, userId],
  );
}

export async function getUnreadMessagesCount(userId: number) {
  const row = await queryOne<{ count: number }>(
    `
      SELECT COUNT(*) AS count
      FROM messages m
      JOIN conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id = ?
      WHERE m.sender_id != ?
        AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
    `,
    [userId, userId],
  );

  return row?.count ?? 0;
}

export async function isConversationMember(conversationId: number, userId: number) {
  const row = await queryOne(
    "SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL",
    [conversationId, userId],
  );
  return Boolean(row);
}

export async function getConversationDetail(conversationId: number, userId: number, page = 0) {
  if (!(await isConversationMember(conversationId, userId))) return null;

  const conversation = await queryOne<{ id: number; type: "direct" | "group_dm"; title: string }>(
    "SELECT id, type, title FROM conversations WHERE id = ?",
    [conversationId],
  );
  if (!conversation) return null;

  const members = await queryAll<ConversationMember>(
    `
      SELECT u.id, u.name, u.avatar_url, u.role
      FROM conversation_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.conversation_id = ? AND cm.left_at IS NULL
      ORDER BY cm.created_at ASC
    `,
    [conversationId],
  );

  const viewerRow = await queryOne<{ role: string }>(
    "SELECT role FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL",
    [conversationId, userId],
  );

  const offset = Math.max(page, 0) * PAGE_SIZE;
  const rows = await queryAll<
    Omit<ChatMessage, "sender"> & {
      sender_id: number;
      sender_name: string;
      sender_avatar_url: string | null;
      sender_role: "admin" | "user";
    }
  >(
    `
      SELECT m.id, m.content, m.created_at,
        u.id AS sender_id,
        u.name AS sender_name,
        u.avatar_url AS sender_avatar_url,
        u.role AS sender_role
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = ? AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ? OFFSET ?
    `,
    [conversationId, PAGE_SIZE, offset],
  );

  await execute(
    "UPDATE conversation_members SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND user_id = ?",
    [conversationId, userId],
  );

  return {
    conversation,
    members,
    messages: rows.reverse().map((row) => ({
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      sender: {
        id: row.sender_id,
        name: row.sender_name,
        avatar_url: row.sender_avatar_url,
        role: row.sender_role,
      },
    })),
    viewerRole: viewerRow?.role ?? null,
  };
}

export async function findDirectConversation(userA: number, userB: number) {
  return queryOne<{ id: number }>(
    `
      SELECT c.id
      FROM conversations c
      JOIN conversation_members a ON a.conversation_id = c.id AND a.user_id = ? AND a.left_at IS NULL
      JOIN conversation_members b ON b.conversation_id = c.id AND b.user_id = ? AND b.left_at IS NULL
      WHERE c.type = 'direct'
      LIMIT 1
    `,
    [userA, userB],
  );
}

export async function createConversation({
  creatorId,
  memberIds,
  title,
}: {
  creatorId: number;
  memberIds: number[];
  title?: string;
}) {
  const uniqueIds = Array.from(new Set([creatorId, ...memberIds])).filter((id) => id > 0);
  if (uniqueIds.length < 2) {
    throw new Error("Una conversazione richiede almeno due persone.");
  }

  if (uniqueIds.length === 2) {
    const direct = await findDirectConversation(uniqueIds[0], uniqueIds[1]);
    if (direct) return direct.id;
  }

  const type = uniqueIds.length > 2 ? "group_dm" : "direct";
  const result = await execute(
    "INSERT INTO conversations (type, title, created_by) VALUES (?, ?, ?)",
    [type, type === "group_dm" ? title ?? "" : "", creatorId],
  );
  const conversationId = Number(result.lastInsertRowid);

  for (const memberId of uniqueIds) {
    await execute(
      "INSERT INTO conversation_members (conversation_id, user_id, role, last_read_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
      [conversationId, memberId, memberId === creatorId ? "owner" : "member"],
    );
  }

  return conversationId;
}

export async function createMessage({
  conversationId,
  senderId,
  content,
}: {
  conversationId: number;
  senderId: number;
  content: string;
}) {
  await execute(
    "UPDATE conversation_members SET archived_at = NULL WHERE conversation_id = ? AND user_id != ? AND archived_at IS NOT NULL",
    [conversationId, senderId],
  );

  return execute(
    "INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)",
    [conversationId, senderId, content],
  );
}
