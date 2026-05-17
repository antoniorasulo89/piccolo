import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { privacySchema } from "@/lib/schemas";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { data, response } = await parseJson(request, privacySchema);
  if (response) return response;
  const showEmail = data.privacy_show_email ? 1 : 0;
  const discoverable = data.privacy_discoverable ? 1 : 0;

  await execute(
    `
      UPDATE users
      SET privacy_show_email = ?, privacy_discoverable = ?
      WHERE id = ?
    `,
    [showEmail, discoverable, user.id],
  );

  return NextResponse.json({
    privacy_show_email: Boolean(showEmail),
    privacy_discoverable: Boolean(discoverable),
  });
}
