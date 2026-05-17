import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
  console.error("TURSO_DATABASE_URL e TURSO_AUTH_TOKEN sono obbligatori.");
  process.exit(1);
}

const db = createClient({ url, authToken: token });

async function dump() {
  const output: string[] = [];

  output.push("PRAGMA foreign_keys = OFF;");
  output.push("BEGIN TRANSACTION;");
  output.push("");

  const schemas = await db.execute(
    "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf%' ORDER BY type, name"
  );

  for (const row of schemas.rows) {
    const s = row as unknown as { type: string; name: string; sql: string };
    output.push(`-- ${s.type}: ${s.name}`);
    output.push(`${s.sql};`);
    output.push("");
  }

  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf%' ORDER BY name"
  );

  for (const row of tables.rows) {
    const name = String((row as unknown as { name: string }).name);
    const data = await db.execute(`SELECT * FROM "${name}"`);
    if (data.rows.length === 0) continue;

    const columns = data.columns;
    output.push(`-- Data: ${name} (${data.rows.length} rows)`);

    for (const dataRow of data.rows) {
      const values = columns.map((col) => {
        const val = (dataRow as Record<string, unknown>)[col];
        if (val === null) return "NULL";
        if (typeof val === "number") return String(val);
        return `'${String(val).replace(/'/g, "''")}'`;
      });
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
