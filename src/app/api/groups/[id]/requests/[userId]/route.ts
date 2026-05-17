import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getGroupMembership } from "@/lib/community";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { groupRequestResolutionSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string; userId: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return jsonError("Non autenticato.", 401);

  const { id, userId } = await context.params;
  const groupId = Number(id);
  const targetUserId = Number(userId);
  if (!Number.isInteger(groupId) || !Number.isInteger(targetUserId)) {
    return jsonError("Richiesta non valida.");
  }

  const membership = await getGroupMembership(groupId, currentUser.id);
  if (membership?.role !== "owner" && membership?.role !== "moderator") {
    return jsonError("Permessi insufficienti.", 403);
  }

  const requestRow = await queryOne(
    "SELECT 1 FROM group_requests WHERE group_id = ? AND user_id = ? AND status = 'pending'",
    [groupId, targetUserId],
  );
  if (!requestRow) return jsonError("Richiesta non trovata.", 404);

  const { data, response } = await parseJson(request, groupRequestResolutionSchema);
  if (response) return response;
  const approve = data.status !== "rejected";

  if (approve) {
    await execute(
      `
        INSERT INTO group_members (group_id, user_id, role, status)
        VALUES (?, ?, 'member', 'active')
        ON CONFLICT(group_id, user_id) DO UPDATE SET status = 'active'
      `,
      [groupId, targetUserId],
    );
  }

  await execute("UPDATE group_requests SET status = ? WHERE group_id = ? AND user_id = ?", [
    approve ? "approved" : "rejected",
    groupId,
    targetUserId,
  ]);

  return NextResponse.json({ ok: true });
}
