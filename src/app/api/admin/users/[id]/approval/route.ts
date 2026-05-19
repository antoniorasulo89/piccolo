import { NextResponse } from "next/server";
import { approveUser, recordAuditLog } from "@/lib/admin";
import { withAdmin } from "@/lib/admin-guard";
import { queryOne } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { jsonError } from "@/lib/http";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: Context) {
  return withAdmin(async (admin) => {
    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId)) {
      return jsonError("Utente non valido.");
    }

    const target = await queryOne<{
      id: number;
      name: string;
      email: string;
      role: "admin" | "user";
      approved_at: string | null;
    }>(
      "SELECT id, name, email, role, approved_at FROM users WHERE id = ?",
      [userId],
    );

    if (!target) {
      return jsonError("Utente non trovato.", 404);
    }

    if (!target.approved_at) {
      await approveUser(userId, admin.id);
      sendWelcomeEmail(target.email, target.name).catch(() => {});
    }

    await recordAuditLog({
      adminId: admin.id,
      action: "approve_user",
      targetType: "user",
      targetId: userId,
      note: target.approved_at ? "already_approved" : "",
    });

    return NextResponse.json({ id: userId, approved: true });
  });
}
