import { execSync } from "node:child_process";

const required = [
  "src/app/api/auth/forgot-password/route.ts",
  "src/app/api/auth/login/route.ts",
  "src/app/api/auth/logout/route.ts",
  "src/app/api/auth/me/route.ts",
  "src/app/api/auth/register/route.ts",
  "src/app/api/auth/reset-password/route.ts",
];

const tracked = execSync("git ls-files src/app/api/auth", { encoding: "utf-8" })
  .trim()
  .split("\n")
  .filter(Boolean);

let ok = true;

for (const path of required) {
  if (!tracked.includes(path)) {
    console.error(`✗ Route auth NON tracciata: ${path}`);
    ok = false;
  }
}

if (ok) {
  const found = required.filter((p) => tracked.includes(p)).length;
  console.log(`✓ ${found}/${required.length} route auth tracciate.`);
} else {
  process.exit(1);
}
