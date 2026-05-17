import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const adminRoot = join(root, "src/app/api/admin");

function findRoutes(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) return findRoutes(full);
    return entry === "route.ts" ? [full] : [];
  });
}

const routes = findRoutes(adminRoot).map((route) => relative(root, route).replaceAll("\\", "/"));
const missing = [];

for (const route of routes) {
  const content = readFileSync(join(root, route), "utf8");
  if (!content.includes("withAdmin(") && !content.includes("requireAdmin(")) {
    missing.push(route);
  }
}

console.log(`Admin route audit: ${routes.length} route, ${routes.length - missing.length} protette.`);

if (missing.length) {
  console.error("Route admin senza guardia:");
  missing.forEach((route) => console.error(`- ${route}`));
  process.exit(1);
}
