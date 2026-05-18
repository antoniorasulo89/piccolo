import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createGroup, getGroups } from "@/lib/community";
import { jsonError, parseJson } from "@/lib/http";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { groupSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const q = url.searchParams.get("q") ?? "";
  const page = Math.max(Number(url.searchParams.get("page") ?? 0), 0);

  return NextResponse.json(await getGroups(user.id, filter, page, q));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Non autenticato.", 401);

  if (!rateLimit(rateLimitKey(request, "group", user.id), 6, 10 * 60_000)) {
    return jsonError("Stai creando gruppi troppo velocemente. Riprova tra poco.", 429);
  }

  const { data, response } = await parseJson(request, groupSchema);
  if (response) return response;
  const { name, description, privacy } = data;

  const group = await createGroup({
    ownerId: user.id,
    name,
    description,
    privacy,
  });

  return NextResponse.json(group, { status: 201 });
}
