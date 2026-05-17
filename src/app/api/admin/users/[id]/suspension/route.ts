import { NextResponse } from "next/server";
import { recordAuditLog, setUserSuspension } from "@/lib/admin";
import { withAdmin } from "@/lib/admin-guard";
import { queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { suspensionSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  return withAdmin(async (admin) => {
    const { id } = await context.params;
    const userId = Number(id);
    const { data, response } = await parseJson(request, suspensionSchema);
    if (response) return response;
    const { suspended } = data;

    if (!Number.isInteger(userId)) {
      return jsonError("Utente non valido.");
    }

    if (userId === admin.id) {
      return jsonError("Non puoi sospendere il tuo account.", 409);
    }

    const target = await queryOne<{ id: number }>("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);

    if (!target) {
      return jsonError("Utente non trovato.", 404);
    }

    await setUserSuspension(userId, suspended);
    await recordAuditLog({
      adminId: admin.id,
      action: suspended ? "suspend_user" : "unsuspend_user",
      targetType: "user",
      targetId: userId,
    });

    return NextResponse.json({ id: userId, suspended });
  });
}
