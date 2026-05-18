import { queryAll, queryOne } from "./db";
import { PAGE_LIMIT, PAGE_SIZE } from "./pagination";

export type AdminReport = {
  id: number;
  reason: string;
  category: string;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  resolved_at: string | null;
  resolution_note: string;
  post_id: number;
  post_content: string;
  author_id: number;
  author_name: string;
  reporter_id: number;
  reporter_name: string;
};

export async function getOpenReports(page = 0) {
  const offset = Math.max(page, 0) * PAGE_SIZE;

  return queryAll<AdminReport>(
    `
      SELECT r.id, r.reason, r.category, r.status, r.created_at, r.resolved_at, r.resolution_note,
        p.id AS post_id,
        p.content AS post_content,
        author.id AS author_id,
        author.name AS author_name,
        reporter.id AS reporter_id,
        reporter.name AS reporter_name
      FROM reports r
      JOIN posts p ON p.id = r.post_id
      JOIN users author ON author.id = p.user_id
      JOIN users reporter ON reporter.id = r.reporter_id
      WHERE r.status = 'open'
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [PAGE_LIMIT, offset],
  );
}

export async function getAllReports(page = 0, status?: string) {
  const offset = Math.max(page, 0) * PAGE_SIZE;
  const clauses: string[] = [];
  const args: (string | number)[] = [];

  if (status && status !== "all") {
    clauses.push("r.status = ?");
    args.push(status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  return queryAll<AdminReport>(
    `
      SELECT r.id, r.reason, r.category, r.status, r.created_at, r.resolved_at, r.resolution_note,
        p.id AS post_id,
        p.content AS post_content,
        author.id AS author_id,
        author.name AS author_name,
        reporter.id AS reporter_id,
        reporter.name AS reporter_name
      FROM reports r
      JOIN posts p ON p.id = r.post_id
      JOIN users author ON author.id = p.user_id
      JOIN users reporter ON reporter.id = r.reporter_id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...args, PAGE_LIMIT, offset],
  );
}

export async function getOpenReportsCount() {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM reports WHERE status = 'open'",
  );
  return row?.count ?? 0;
}
