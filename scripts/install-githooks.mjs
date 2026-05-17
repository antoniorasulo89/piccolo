import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (process.env.CI || process.env.VERCEL || !existsSync(".git")) {
  process.exit(0);
}

const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 0);
