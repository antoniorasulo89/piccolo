import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getGroupMembership } from "@/lib/community";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { recordAuditLog } from "@/lib/admin";

const updateGroupSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(500).optional(),
  privacy: z.enum(["public", "private"]).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) return jsonError("Gruppo non valido.");

  const membership = await getGroupMembership(groupId, user.id);
  const canManage = membership?.role === "owner" || membership?.role === "co_owner" || user.role === "admin";
  if (!canManage) return jsonError("Solo owner, co-owner e admin possono modificare il gruppo.", 403);

  const { data, response } = await parseJson(request, updateGroupSchema);
  if (response) return response;

  const set: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) { set.push("name = ?"); values.push(data.name); }
  if (data.description !== undefined) { set.push("description = ?"); values.push(data.description); }
  if (data.privacy !== undefined) { set.push("privacy = ?"); values.push(data.privacy); }

  if (set.length === 0) return jsonError("Nessun campo da aggiornare.");

  values.push(groupId);
  await execute(`UPDATE groups SET ${set.join(", ")} WHERE id = ?`, values);

  const changes: string[] = [];
  if (data.name !== undefined) changes.push(`name`);
  if (data.description !== undefined) changes.push(`description`);
  if (data.privacy !== undefined) changes.push(`privacy=${data.privacy}`);

  await recordAuditLog({
    adminId: user.id,
    action: "group_settings_update",
    targetType: "group",
    targetId: groupId,
    note: `${user.role === "admin" && membership?.role !== "owner" ? "admin_override=true " : ""}changed: ${changes.join(", ")}`,
  });

  const updated = await queryOne<{ name: string; description: string; privacy: string }>(
    "SELECT name, description, privacy FROM groups WHERE id = ?", [groupId],
  );
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const { id } = await context.params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) return jsonError("Gruppo non valido.");

  const group = await queryOne<{ id: number; name: string; owner_id: number }>(
    "SELECT id, name, owner_id FROM groups WHERE id = ?",
    [groupId],
  );
  if (!group) return jsonError("Gruppo non trovato.", 404);

  const canDelete = group.owner_id === user.id || user.role === "admin";
  if (!canDelete) return jsonError("Solo owner e admin possono eliminare il gruppo.", 403);

  await recordAuditLog({
    adminId: user.id,
    action: "delete_group",
    targetType: "group",
    targetId: groupId,
    note: `${user.role === "admin" && group.owner_id !== user.id ? "admin_override=true " : ""}${group.name}`,
  });

  await execute("DELETE FROM groups WHERE id = ?", [groupId]);

  return NextResponse.json({ deleted: true });
}
