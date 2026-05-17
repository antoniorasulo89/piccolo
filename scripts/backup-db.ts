import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
  console.error("TURSO_DATABASE_URL e TURSO_AUTH_TOKEN sono obbligatori.");
  process.exit(1);
}

const db = createClient({ url, authToken: token });

const FTS_SHADOW_PREFIXES = ["post_fts_"];

function isFtsRelated(name: string, type: string) {
  if (FTS_SHADOW_PREFIXES.some((p) => name.startsWith(p))) return true;
  if (type === "trigger" && (name.includes("_fts_") || name.includes("_fts"))) return true;
  return false;
}

function sqlValue(val: unknown): string {
  if (val === null) return "NULL";
  if (typeof val === "number") {
    if (Number.isInteger(val)) return String(val);
    return String(val);
  }
  const str = String(val);
  return `'${str.replace(/'/g, "''")}'`;
}

async function dump() {
  const output: string[] = [];

  output.push("PRAGMA foreign_keys = OFF;");
  output.push("BEGIN TRANSACTION;");
  output.push("");

  const schemas = await db.execute(
    "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf%' ORDER BY CASE type WHEN 'table' THEN 1 WHEN 'index' THEN 2 WHEN 'trigger' THEN 3 ELSE 4 END, name"
  );

  for (const row of schemas.rows) {
    const s = row as unknown as { type: string; name: string; sql: string };
    if (isFtsRelated(s.name, s.type)) continue;
    output.push(`-- ${s.type}: ${s.name}`);
    output.push(`${s.sql};`);
    output.push("");
  }

  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf%' ORDER BY name"
  );

  for (const row of tables.rows) {
    const name = String((row as unknown as { name: string }).name);
    if (FTS_SHADOW_PREFIXES.some((p) => name.startsWith(p))) continue;

    const data = await db.execute(`SELECT * FROM "${name}"`);
    if (data.rows.length === 0) continue;

    const columns = data.columns;
    output.push(`-- Data: ${name} (${data.rows.length} rows)`);

    for (const dataRow of data.rows) {
      const values = columns.map((col) => sqlValue((dataRow as Record<string, unknown>)[col]));
      output.push(
        `INSERT INTO "${name}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});`
      );
    }
    output.push("");
  }

  output.push("COMMIT;");
  output.push("PRAGMA foreign_keys = ON;");
  console.log(output.join("\n"));
}

dump().catch((err) => {
  console.error("Backup fallito:", err);
  process.exit(1);
});
