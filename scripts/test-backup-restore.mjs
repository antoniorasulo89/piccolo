import { createClient } from "@libsql/client";
import { mkdirSync, unlinkSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DUMP_FILE = join(tmpdir(), `piccolo-restore-test-${Date.now()}.sql`);
const TEST_DB_PATH = join(tmpdir(), `piccolo-restore-test-${Date.now()}.db`);

async function main() {
  console.log("→ Creazione dump...");
  try {
    execSync("npx tsx scripts/backup-db.ts", {
      stdio: ["ignore", "pipe", "inherit"],
      encoding: "utf-8",
    });
  } catch {
    console.error("✗ Backup fallito. Verifica TURSO_DATABASE_URL e TURSO_AUTH_TOKEN.");
    process.exit(1);
  }

  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) {
    console.error("✗ TURSO_DATABASE_URL e TURSO_AUTH_TOKEN obbligatori.");
    process.exit(1);
  }

  const source = createClient({ url, authToken: token });

  console.log("→ Conteggio pre-dump...");
  const before = await source.execute(
    "SELECT 'users' as t, COUNT(*) as c FROM users UNION ALL SELECT 'posts', COUNT(*) FROM posts UNION ALL SELECT 'groups', COUNT(*) FROM groups"
  );
  const beforeMap = new Map(
    before.rows.map((r) => {
      const row = r as unknown as { t: string; c: number };
      return [row.t, row.c];
    })
  );
  console.log(`   ${Array.from(beforeMap.entries()).map(([k, v]) => `${k}=${v}`).join(", ")}`);

  const dumpSql = execSync("npx tsx scripts/backup-db.ts", {
    encoding: "utf-8",
  });

  const db = createClient({ url: `file:${TEST_DB_PATH}` });

  console.log("→ Applicazione dump su DB vergine...");
  const statements = dumpSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
  for (const stmt of statements) {
    try {
      await db.execute(stmt + ";");
    } catch {
      // ignora errori su statement non eseguibili singolarmente
    }
  }

  console.log("→ Verifica post-restore...");
  const after = await db.execute(
    "SELECT 'users' as t, COUNT(*) as c FROM users UNION ALL SELECT 'posts', COUNT(*) FROM posts UNION ALL SELECT 'groups', COUNT(*) FROM groups"
  );
  const afterMap = new Map(
    after.rows.map((r) => {
      const row = r as unknown as { t: string; c: number };
      return [row.t, row.c];
    })
  );

  let ok = true;
  for (const [table, count] of beforeMap) {
    const afterCount = afterMap.get(table);
    if (afterCount !== count) {
      console.error(`✗ ${table}: atteso ${count}, trovati ${afterCount}`);
      ok = false;
    }
  }

  try { unlinkSync(DUMP_FILE); } catch {}
  try { unlinkSync(TEST_DB_PATH); } catch {}
  try { unlinkSync(TEST_DB_PATH + "-wal"); } catch {}
  try { unlinkSync(TEST_DB_PATH + "-shm"); } catch {}

  if (ok) {
    console.log("✓ Restore verificato: tutti i conteggi corrispondono.");
  } else {
    console.error("✗ Restore fallito: discrepanza conteggi.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("✗ Errore:", err);
  process.exit(1);
});
