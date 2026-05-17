import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { execute } from "@/lib/db";
import { jsonError } from "@/lib/http";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: Context) {
  return withAdmin(async () => {
    const { id } = await context.params;
    const postId = Number(id);

    if (!Number.isInteger(postId)) {
      return jsonError("Post non valido.");
    }

    const result = await execute("DELETE FROM posts WHERE id = ?", [postId]);

    if (!result.rowsAffected) {
      return jsonError("Post non trovato.", 404);
    }

    return NextResponse.json({ ok: true });
  });
}
