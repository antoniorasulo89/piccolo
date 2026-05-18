import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getGroupMembership } from "@/lib/community";
import { execute } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { recordAuditLog } from "@/lib/admin";

const roleSchema = z.object({
  role: z.enum(["moderator", "member"]),
});

type Context = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id, userId: rawUserId } = await context.params;
  const groupId = Number(id);
  const targetId = Number(rawUserId);
  if (!Number.isInteger(groupId) || !Number.isInteger(targetId)) return jsonError("Parametri non validi.");

  if (targetId === user.id) return jsonError("Non puoi espellere te stesso.", 400);

  const actorMembership = await getGroupMembership(groupId, user.id);
  const canManage = actorMembership?.role === "owner" || actorMembership?.role === "moderator" || user.role === "admin";
  if (!canManage) return jsonError("Non hai i permessi per gestire i membri.", 403);

  const targetMembership = await getGroupMembership(groupId, targetId);
  if (!targetMembership || targetMembership.status !== "active") return jsonError("Membro non trovato.", 404);
  if (targetMembership.role === "owner") return jsonError("Non puoi espellere l'owner.", 403);

  if (user.role !== "admin" && actorMembership?.role === "moderator" && targetMembership.role === "moderator") {
    return jsonError("Un moderator non puo espellere un altro moderator.", 403);
  }

  await execute("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, targetId]);
  await recordAuditLog({
    adminId: user.id,
    action: "group_member_expel",
    targetType: "user",
    targetId,
    note: `group_id=${groupId}${user.role === "admin" ? " admin_override=true" : ""}`,
  });

  return NextResponse.json({ removed: true });
}

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id, userId: rawUserId } = await context.params;
  const groupId = Number(id);
  const targetId = Number(rawUserId);
  if (!Number.isInteger(groupId) || !Number.isInteger(targetId)) return jsonError("Parametri non validi.");

  const { data, response } = await parseJson(request, roleSchema);
  if (response) return response;

  const actorMembership = await getGroupMembership(groupId, user.id);
  const canManage = actorMembership?.role === "owner" || user.role === "admin";
  if (!canManage) return jsonError("Solo owner e admin possono cambiare i ruoli.", 403);

  if (targetId === user.id) return jsonError("Non puoi cambiare il tuo ruolo.", 400);

  const targetMembership = await getGroupMembership(groupId, targetId);
  if (!targetMembership || targetMembership.status !== "active") return jsonError("Membro non trovato.", 404);
  if (targetMembership.role === "owner") return jsonError("Non puoi cambiare il ruolo dell'owner.", 403);

  await execute("UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?", [data.role, groupId, targetId]);
  await recordAuditLog({
    adminId: user.id,
    action: "group_member_role",
    targetType: "user",
    targetId,
    note: `group_id=${groupId} role=${data.role}${user.role === "admin" ? " admin_override=true" : ""}`,
  });

  return NextResponse.json({ updated: true, role: data.role });
}
