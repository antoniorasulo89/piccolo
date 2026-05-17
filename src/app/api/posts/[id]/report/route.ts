import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/schemas";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { id } = await context.params;
  const postId = Number(id);

  if (!Number.isInteger(postId)) {
    return jsonError("Post non valido.");
  }

  if (!rateLimit(rateLimitKey(request, "report", user.id), 8, 10 * 60_000)) {
    return jsonError("Troppe segnalazioni in poco tempo. Riprova piu tardi.", 429);
  }

  const post = await queryOne<{ id: number; user_id: number }>(
    "SELECT id, user_id FROM posts WHERE id = ?",
    [postId],
  );

  if (!post) {
    return jsonError("Post non trovato.", 404);
  }

  if (post.user_id === user.id) {
    return jsonError("Non puoi segnalare un tuo post.");
  }

  const { data, response } = await parseJson(request, reportSchema);
  if (response) return response;
  const { reason, category } = data;

  try {
    await execute(
      `
        INSERT INTO reports (post_id, reporter_id, reason, category)
        VALUES (?, ?, ?, ?)
      `,
      [postId, user.id, reason, category],
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return jsonError("Hai gia segnalato questo post.", 409);
    }

    return jsonError("Segnalazione non riuscita.", 500);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
