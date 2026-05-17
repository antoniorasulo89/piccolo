import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { pageItems } from "@/lib/pagination";
import { getFeedPosts } from "@/lib/queries";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { postSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page") ?? 0), 0);
  const scope = url.searchParams.get("scope") === "all" ? "all" : "following";

  const posts = await getFeedPosts(user.id, page, scope);
  return NextResponse.json(pageItems(posts), {
    headers: { "X-Has-More": posts.length > 20 ? "1" : "0" },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  if (!rateLimit(rateLimitKey(request, "post", user.id), 10, 60_000)) {
    return jsonError("Stai pubblicando troppo velocemente. Riprova tra poco.", 429);
  }

  const { data, response } = await parseJson(request, postSchema);
  if (response) return response;
  const { content } = data;

  const result = await execute("INSERT INTO posts (user_id, content) VALUES (?, ?)", [
    user.id,
    content,
  ]);

  const post = await queryOne(
    "SELECT id, content, created_at FROM posts WHERE id = ?",
    [Number(result.lastInsertRowid)],
  );

  return NextResponse.json(post, { status: 201 });
}
