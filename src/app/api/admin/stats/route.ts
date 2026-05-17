import { NextResponse } from "next/server";
import { getAdminStats } from "@/lib/admin";
import { withAdmin } from "@/lib/admin-guard";

export async function GET() {
  return withAdmin(async () => NextResponse.json(await getAdminStats()));
}
