import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getGroupMembership } from "@/lib/community";
import { execute } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { recordAuditLog } from "@/lib/admin";

const roleSchema = z.object({
  role: z.enum(["co_owner", "moderator", "member"]),
});

type Context = { params: Promise<{ id: string; userId: string }> };

function isAdmin(user: { role: string }) { return user.role === "admin"; }
function isOwner(membership: { role: string } | null) { return membership?.role === "owner"; }
function isCoOwner(membership: { role: string } | null) { return membership?.role === "co_owner"; }
function isOwnershipRole(role: string) { return role === "owner" || role === "co_owner"; }

export async function DELETE(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id, userId: rawUserId } = await context.params;
  const groupId = Number(id);
  const targetId = Number(rawUserId);
  if (!Number.isInteger(groupId) || !Number.isInteger(targetId)) return jsonError("Parametri non validi.");
  if (targetId === user.id) return jsonError("Non puoi espellere te stesso.", 400);

  const actorMembership = await getGroupMembership(groupId, user.id);
  const canExpel = isOwner(actorMembership) || isCoOwner(actorMembership) || actorMembership?.role === "moderator" || user.role === "admin";
  if (!canExpel) return jsonError("Non hai i permessi per espellere membri.", 403);

  const targetMembership = await getGroupMembership(groupId, targetId);
  if (!targetMembership || targetMembership.status !== "active") return jsonError("Membro non trovato.", 404);
  if (targetMembership.role === "owner") return jsonError("Non puoi espellere l'owner.", 403);

  if (!isAdmin(user)) {
    if (actorMembership?.role === "moderator") {
      if (targetMembership.role !== "member") return jsonError("Un moderator puo espellere solo membri.", 403);
    }
    if (isCoOwner(actorMembership) && isOwnershipRole(targetMembership.role)) {
      return jsonError("Un co-owner non puo espellere owner o altri co-owner.", 403);
    }
  }

  await execute("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, targetId]);
  await recordAuditLog({
    adminId: user.id,
    action: "group_member_expel",
    targetType: "user",
    targetId,
    note: `group_id=${groupId} role=${targetMembership.role}${isAdmin(user) && !actorMembership ? " admin_override=true" : ""}`,
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
  if (targetId === user.id) return jsonError("Non puoi cambiare il tuo ruolo.", 400);

  const { data, response } = await parseJson(request, roleSchema);
  if (response) return response;

  const actorMembership = await getGroupMembership(groupId, user.id);
  const targetMembership = await getGroupMembership(groupId, targetId);
  if (!targetMembership || targetMembership.status !== "active") return jsonError("Membro non trovato.", 404);
  if (targetMembership.role === "owner") return jsonError("Non puoi cambiare il ruolo dell'owner.", 403);

  // Permission check
  if (!isAdmin(user) && !isOwner(actorMembership)) {
    if (isCoOwner(actorMembership)) {
      if (data.role === "co_owner" || isOwnershipRole(targetMembership.role)) {
        return jsonError("Un co-owner non puo assegnare co_owner o modificare owner/co_owner.", 403);
      }
    } else {
      return jsonError("Solo owner, co-owner e admin possono cambiare i ruoli.", 403);
    }
  }

  await execute("UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?", [data.role, groupId, targetId]);
  await recordAuditLog({
    adminId: user.id,
    action: "group_member_role",
    targetType: "user",
    targetId,
    note: `group_id=${groupId} role=${data.role}${isAdmin(user) && (!actorMembership || (!isOwner(actorMembership) && !isCoOwner(actorMembership))) ? " admin_override=true" : ""}`,
  });

  return NextResponse.json({ updated: true, role: data.role });
}
