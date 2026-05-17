import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { execute } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { themeSchema } from "@/lib/schemas";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { data, response } = await parseJson(request, themeSchema);
  if (response) return response;
  const { theme } = data;

  await execute("UPDATE users SET theme_preference = ? WHERE id = ?", [theme, user.id]);

  const store = await cookies();
  store.set("theme", theme, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ theme });
}
