const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];

const required = [
  "core/agents/pantavion-agent-run-dashboard.ts",
  "app/api/pantavion/agents/runtime/dashboard/route.ts",
  "app/pantavion/agents/dashboard/page.tsx",
  "scripts/pantavion-agent-dashboard-gate.cjs",
  "docs/continuity/pantavion-agent-run-dashboard.md",
  "package.json"
];

function read(relativePath) {
  const full = path.join(root, relativePath);

  if (!fs.existsSync(full)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }

  return fs.readFileSync(full, "utf8");
}

for (const file of required) read(file);

const core = read("core/agents/pantavion-agent-run-dashboard.ts");
const route = read("app/api/pantavion/agents/runtime/dashboard/route.ts");
const page = read("app/pantavion/agents/dashboard/page.tsx");
const pkgText = read("package.json");

const markers = [
  "PANTAVION_AGENT_RUN_DASHBOARD_ID",
  "safe-patch-loop-report.json",
  "selected-implementation-slice.json",
  "last-safe-patch-receipt.json",
  "Founder Approval Boundary",
  "truthRule"
];

for (const marker of markers) {
  if (!core.includes(marker)) {
    failures.push("Dashboard core missing marker: " + marker);
  }
}

if (!route.includes("/api/pantavion/agents/runtime/dashboard")) {
  failures.push("Dashboard API route marker missing.");
}

if (!page.includes("Agent Run Dashboard")) {
  failures.push("Dashboard page marker missing.");
}

let pkg = null;

try {
  pkg = JSON.parse(pkgText);
} catch {
  failures.push("package.json invalid JSON.");
}

if (pkg && pkg.scripts) {
  if (pkg.scripts["audit:agent-dashboard"] !== "node scripts/pantavion-agent-dashboard-gate.cjs") {
    failures.push("package.json missing audit:agent-dashboard.");
  }
}

const dangerous = (core + route + page).toLowerCase();

if (dangerous.includes("git add .")) failures.push("Dashboard must not contain git add dot.");
if (dangerous.includes("push --force")) failures.push("Dashboard must not force push.");
if (dangerous.includes("vercel --prod")) failures.push("Dashboard must not production deploy.");
if (dangerous.includes("rm -rf")) failures.push("Dashboard must not contain destructive rm.");

if (failures.length > 0) {
  console.error("PANTAVION AGENT DASHBOARD GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION AGENT DASHBOARD GATE: PASSED");
  console.log("- dashboard core present");
  console.log("- dashboard API route present");
  console.log("- dashboard page present");
  console.log("- runtime file readers present");
  console.log("- approval boundary present");
  console.log("- package script present");
}
