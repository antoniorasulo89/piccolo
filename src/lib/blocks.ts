import { queryOne } from "./db";

export async function isBlocked(userA: number, userB: number) {
  const row = await queryOne(
    "SELECT 1 FROM user_blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)",
    [userA, userB, userB, userA],
  );
  return Boolean(row);
}

export async function isBlockedBy(blockerId: number, blockedId: number) {
  const row = await queryOne(
    "SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?",
    [blockerId, blockedId],
  );
  return Boolean(row);
}
