import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { queryAll } from "@/lib/db";

type AdminGroupRow = {
  id: number;
  name: string;
  slug: string;
  privacy: string;
  description: string;
  created_at: string;
  owner_name: string;
  members_count: number;
  posts_count: number;
};

export async function GET() {
  return withAdmin(async () => {
    const rows = await queryAll<AdminGroupRow>(
      `SELECT g.id, g.name, g.slug, g.privacy, g.description, g.created_at,
        u.name AS owner_name,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') AS members_count,
        (SELECT COUNT(*) FROM posts p WHERE p.group_id = g.id) AS posts_count
       FROM groups g
       JOIN users u ON u.id = g.owner_id
       ORDER BY g.created_at DESC
       LIMIT 100`,
    );
    return NextResponse.json(rows);
  });
}
