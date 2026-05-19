import { NextResponse } from "next/server";
import { adminCount, recordAuditLog } from "@/lib/admin";
import { withAdmin } from "@/lib/admin-guard";
import { queryOne } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { deleteUserCompletely } from "@/lib/users";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: Context) {
  return withAdmin(async (admin) => {
    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId)) {
      return jsonError("Utente non valido.");
    }

    if (userId === admin.id) {
      return jsonError("Non puoi eliminare il tuo account dalla console admin.", 409);
    }

    const target = await queryOne<{ id: number; name: string; email: string; role: "admin" | "user" }>(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [userId],
    );

    if (!target) {
      return jsonError("Utente non trovato.", 404);
    }

    if (target.role === "admin" && (await adminCount()) <= 1) {
      return jsonError("Deve restare almeno un amministratore.", 409);
    }

    await deleteUserCompletely(userId);
    await recordAuditLog({
      adminId: admin.id,
      action: "delete_user",
      targetType: "user",
      targetId: userId,
      note: `${target.email} / ${target.name}`,
    });

    return NextResponse.json({ deleted: true });
  });
}
