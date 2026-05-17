import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { reportResolutionSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  return withAdmin(async (admin) => {
    const { id } = await context.params;
    const reportId = Number(id);
    const { data, response } = await parseJson(request, reportResolutionSchema);
    if (response) return response;
    const { status, note } = data;

    if (!Number.isInteger(reportId)) {
      return jsonError("Segnalazione non valida.");
    }

    const report = await queryOne("SELECT id FROM reports WHERE id = ?", [reportId]);

    if (!report) {
      return jsonError("Segnalazione non trovata.", 404);
    }

    await execute(
      "UPDATE reports SET status = ?, resolved_at = CURRENT_TIMESTAMP, resolved_by = ?, resolution_note = ? WHERE id = ?",
      [status, admin.id, note, reportId],
    );

    return NextResponse.json({ ok: true, status });
  });
}
