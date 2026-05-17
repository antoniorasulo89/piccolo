import type { PublicUser } from "./db";
import { jsonError } from "./http";
import { requireAdmin } from "./auth";

export async function withAdmin(
  handler: (admin: PublicUser) => Promise<Response>,
) {
  const admin = await requireAdmin();

  if (!admin) {
    return jsonError("Accesso amministratore richiesto.", 403);
  }

  return handler(admin);
}
