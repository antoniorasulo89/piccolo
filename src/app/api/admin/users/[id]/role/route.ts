import { NextResponse } from "next/server";
import { adminCount, recordAuditLog, setUserRole } from "@/lib/admin";
import { withAdmin } from "@/lib/admin-guard";
import { queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { adminRoleSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  return withAdmin(async (admin) => {
    const { id } = await context.params;
    const userId = Number(id);
    const { data, response } = await parseJson(request, adminRoleSchema);
    if (response) return response;
    const { role } = data;

    if (!Number.isInteger(userId)) {
      return jsonError("Richiesta non valida.");
    }

    const target = await queryOne<{ id: number; role: "admin" | "user" }>(
      "SELECT id, role FROM users WHERE id = ?",
      [userId],
    );

    if (!target) {
      return jsonError("Utente non trovato.", 404);
    }

    if (target.role === "admin" && role === "user" && (await adminCount()) <= 1) {
      return jsonError("Deve restare almeno un amministratore.", 409);
    }

    await setUserRole(userId, role);
    await recordAuditLog({
      adminId: admin.id,
      action: "set_role",
      targetType: "user",
      targetId: userId,
      note: role,
    });

    return NextResponse.json({ id: userId, role });
  });
}
