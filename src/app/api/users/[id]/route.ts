import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { getUserProfile } from "@/lib/queries";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
  const viewer = await getCurrentUser();
  const { id } = await context.params;
  const userId = Number(id);

  if (!Number.isInteger(userId)) {
    return jsonError("Utente non valido.");
  }

  const profile = await getUserProfile(userId, viewer?.id);

  if (!profile) {
    return jsonError("Utente non trovato.", 404);
  }

  return NextResponse.json(profile);
}
