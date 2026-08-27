const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(process.cwd(), "app", "api", "kernel");
const routes = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    if (entry.isFile() && entry.name === "route.ts") routes.push(full);
  }
}

walk(ROOT);
routes.sort();

const failures = [];
for (const route of routes) {
  const source = fs.readFileSync(route, "utf8");
  const relative = path.relative(process.cwd(), route).replaceAll(path.sep, "/");

  if (relative === "app/api/kernel/founder-session/route.ts") {
    if (!source.includes("isPantavionKernelAccessAllowed")) {
      failures.push(`${relative}: founder session must validate the founder token`);
    }
    continue;
  }

  if (!source.includes("isPantavionKernelRequestAllowed")) {
    failures.push(`${relative}: missing founder-only request guard`);
  }

  if (!source.includes("createPantavionKernelAccessDeniedReport")) {
    failures.push(`${relative}: missing restricted denial response`);
  }
}

if (routes.length === 0) {
  failures.push("No kernel API routes were discovered");
}

if (failures.length) {
  console.error("Pantavion kernel founder-access gate FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Pantavion kernel founder-access gate PASS: ${routes.length} kernel route(s) are founder-restricted.`);
