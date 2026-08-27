const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(process.cwd(), "app", "api", "kernel");
const KERNEL_PAGE = path.join(process.cwd(), "app", "kernel", "page.tsx");
const ACCESS_GUARD = path.join(process.cwd(), "core", "kernel", "kernel-access-guard.ts");
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
      failures.push(`${relative}: founder session must validate the Kernel secret`);
    }
    if (!source.includes("isPantavionKernelFounderIdentityAllowed")) {
      failures.push(`${relative}: founder session must require authenticated founder identity + AAL2`);
    }
  } else if (!source.includes("isPantavionKernelFounderRequestAllowed")) {
    failures.push(`${relative}: missing combined Kernel secret + founder identity + AAL2 request guard`);
  }

  if (!source.includes("createPantavionKernelAccessDeniedReport")) {
    failures.push(`${relative}: missing restricted denial response`);
  }
}

if (routes.length === 0) {
  failures.push("No kernel API routes were discovered");
}

if (!fs.existsSync(KERNEL_PAGE)) {
  failures.push("app/kernel/page.tsx is missing");
} else {
  const page = fs.readFileSync(KERNEL_PAGE, "utf8");
  if (!page.includes("isPantavionKernelAccessAllowed")) {
    failures.push("app/kernel/page.tsx: missing Kernel secret/session validation");
  }
  if (!page.includes("isPantavionKernelFounderIdentityAllowed")) {
    failures.push("app/kernel/page.tsx: missing authenticated founder identity + AAL2 validation");
  }
}

if (!fs.existsSync(ACCESS_GUARD)) {
  failures.push("core/kernel/kernel-access-guard.ts is missing");
} else {
  const guard = fs.readFileSync(ACCESS_GUARD, "utf8");
  for (const required of [
    "requireFounderIdentity",
    "supabase.auth.getUser",
    "getAuthenticatorAssuranceLevel",
    'currentLevel === "aal2"',
    "isPantavionKernelFounderRequestAllowed",
  ]) {
    if (!guard.includes(required)) {
      failures.push(`core/kernel/kernel-access-guard.ts: missing ${required}`);
    }
  }
}

if (failures.length) {
  console.error("Pantavion kernel founder-access gate FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Pantavion kernel founder-access gate PASS: ${routes.length} kernel route(s) and the /kernel panel require Kernel secret/session + configured founder identity + AAL2.`,
);
