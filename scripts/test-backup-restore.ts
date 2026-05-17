import { createClient } from "@libsql/client";
import { execSync } from "node:child_process";
import { unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TEST_DB_PATH = join(tmpdir(), `piccolo-restore-test-${Date.now()}.db`);

function splitSQL(sql: string): string[] {
  const stmts: string[] = [];
  let depth = 0;
  let current = "";
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1] ?? "";

    if (inString) {
      current += ch;
      if (ch === stringChar && next === stringChar) {
        current += next;
        i++;
      } else if (ch === stringChar) {
        inString = false;
      }
      continue;
    }

    if (ch === "'") {
      inString = true;
      stringChar = "'";
      current += ch;
      continue;
    }

    if (ch === "(") depth++;
    if (ch === ")") depth--;

    if (ch === ";" && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) stmts.push(trimmed);
      current = "";
    } else {
      current += ch;
    }
  }

  const trimmed = current.trim();
  if (trimmed) stmts.push(trimmed);

  return stmts;
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) {
    console.error("✗ TURSO_DATABASE_URL e TURSO_AUTH_TOKEN obbligatori.");
    process.exit(1);
  }

  const source = createClient({ url, authToken: token });

  console.log("→ Conteggio pre-dump...");
  const before = await source.execute(
    "SELECT 'users' as label, COUNT(*) as cnt FROM users UNION ALL SELECT 'posts', COUNT(*) FROM posts UNION ALL SELECT 'groups', COUNT(*) FROM groups",
  );
  const beforeMap = new Map<string, number>();
  for (const r of before.rows) {
    const row = r as Record<string, unknown>;
    beforeMap.set(String(row.label), Number(row.cnt));
  }
  console.log(`   ${Array.from(beforeMap.entries()).map(([k, v]) => `${k}=${v}`).join(", ")}`);

  console.log("→ Esecuzione dump...");
  const dumpSql = execSync("npx tsx scripts/backup-db.ts", { encoding: "utf-8" });

  console.log("→ Applicazione dump su DB vergine...");
  const db = createClient({ url: `file:${TEST_DB_PATH}` });
  const statements = splitSQL(dumpSql);

  let failures = 0;
  for (const stmt of statements) {
    try {
      await db.execute(stmt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists") || msg.includes("UNIQUE constraint failed")) {
        continue;
      }
      console.error(`✗ Statement fallito: ${stmt.slice(0, 80)}`);
      console.error(`   ${msg}`);
      failures++;
    }
  }

  if (failures > 0) {
    console.error(`✗ ${failures} statement falliti.`);
    cleanup();
    process.exit(1);
  }

  console.log("→ Verifica post-restore...");
  const after = await db.execute(
    "SELECT 'users' as label, COUNT(*) as cnt FROM users UNION ALL SELECT 'posts', COUNT(*) FROM posts UNION ALL SELECT 'groups', COUNT(*) FROM groups",
  );
  const afterMap = new Map<string, number>();
  for (const r of after.rows) {
    const row = r as Record<string, unknown>;
    afterMap.set(String(row.label), Number(row.cnt));
  }

  let ok = true;
  for (const [table, count] of beforeMap) {
    const afterCount = afterMap.get(table);
    if (afterCount !== count) {
      console.error(`✗ ${table}: atteso ${count}, trovati ${afterCount}`);
      ok = false;
    }
  }

  cleanup();

  if (ok) {
    console.log("✓ Restore verificato: tutti i conteggi corrispondono.");
  } else {
    console.error("✗ Restore fallito: discrepanza conteggi.");
    process.exit(1);
  }
}

function cleanup() {
  try { unlinkSync(TEST_DB_PATH); } catch {}
  try { unlinkSync(TEST_DB_PATH + "-wal"); } catch {}
  try { unlinkSync(TEST_DB_PATH + "-shm"); } catch {}
}

main().catch((err) => {
  console.error("✗ Errore:", err);
  process.exit(1);
});
