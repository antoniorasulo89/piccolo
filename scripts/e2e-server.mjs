import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const testDbName = "e2e-social.db";
const dbPath = path.join(process.cwd(), "data", testDbName);
for (const file of [dbPath, `${dbPath}-shm`, `${dbPath}-wal`]) {
  rmSync(file, { force: true });
}

const env = {
  ...process.env,
  JWT_SECRET: "e2e-local-secret-that-is-long-enough-2026",
  ADMIN_EMAILS: "admin-e2e@example.test",
  TEST_DB_PATH: testDbName,
  NEXT_TELEMETRY_DISABLED: "1",
};
delete env.TURSO_DATABASE_URL;
delete env.TURSO_AUTH_TOKEN;

const command = "npm run dev -- --port 3100";
const child = spawn(command, {
  env,
  stdio: "inherit",
  shell: true,
});

process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
