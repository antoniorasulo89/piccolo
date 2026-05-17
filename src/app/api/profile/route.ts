import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { profileSchema } from "@/lib/schemas";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Non autenticato.", 401);
  }

  const { data, response } = await parseJson(request, profileSchema);
  if (response) return response;
  const { name, bio, avatar_url: avatarUrl, avatar_data: avatarData, cover_url: coverUrl, cover_data: coverData } = data;

  const finalAvatar = avatarData || avatarUrl || null;
  const finalCover = coverData || coverUrl || null;

  await execute(
    "UPDATE users SET name = ?, bio = ?, avatar_url = ?, cover_url = ?, onboarded_at = COALESCE(onboarded_at, CURRENT_TIMESTAMP) WHERE id = ?",
    [name, bio, finalAvatar, finalCover, user.id],
  );

  return NextResponse.json({
    id: user.id,
    name,
    bio,
    avatar_url: finalAvatar,
    cover_url: finalCover,
  });
}
