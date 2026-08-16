const fs = require("fs");
const path = require("path");

const root = process.cwd();

const required = [
  "core/archive/pantavion-canonical-archive.ts",
  "app/api/pantavion/agents/runtime/archive/route.ts",
  "scripts/pantavion-canonical-archive.cjs",
  "scripts/pantavion-canonical-archive-gate.cjs",
  "data/pantavion-canonical-archive/source-archive.json",
  "data/pantavion-canonical-archive/agent-implementation-queue.json",
  "data/pantavion-canonical-archive/github-sync-plan.json",
  "docs/continuity/pantavion-canonical-archive.md",
  "package.json"
];

const failures = [];

function read(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    failures.push("Missing " + rel);
    return "";
  }

  return fs.readFileSync(full, "utf8");
}

for (const file of required) read(file);

const sourceArchive = JSON.parse(read("data/pantavion-canonical-archive/source-archive.json") || "{}");
const queue = JSON.parse(read("data/pantavion-canonical-archive/agent-implementation-queue.json") || "{}");
const githubPlan = JSON.parse(read("data/pantavion-canonical-archive/github-sync-plan.json") || "{}");
const contract = read("core/archive/pantavion-canonical-archive.ts");
const pkg = JSON.parse(read("package.json") || "{}");

const markers = [
  "kernel_agent_runtime",
  "universal_entry_user_gateway",
  "legacy_two_year_recovery",
  "auth_identity_memory",
  "billing_vip_payments",
  "dwg_water_source_truth",
  "social_messaging_dating_safety",
  "repo_github_deploy"
];

for (const marker of markers) {
  if (!contract.includes(marker)) failures.push("Archive contract missing marker: " + marker);
}

if (!sourceArchive.ok) failures.push("source archive not ok");
if (!queue.ok) failures.push("implementation queue not ok");
if (!githubPlan.ok) failures.push("github plan not ok");

if (!Array.isArray(queue.nextWorkOrders) || queue.nextWorkOrders.length < 8) {
  failures.push("implementation queue too small");
}

if (!Array.isArray(githubPlan.blocked) || !githubPlan.blocked.includes("git add .")) {
  failures.push("github plan must block git add dot");
}

if (!pkg.scripts || pkg.scripts["agent:archive"] !== "node scripts/pantavion-canonical-archive.cjs") {
  failures.push("missing package script agent:archive");
}

if (!pkg.scripts || pkg.scripts["audit:archive"] !== "node scripts/pantavion-canonical-archive-gate.cjs") {
  failures.push("missing package script audit:archive");
}

if (failures.length) {
  console.error("PANTAVION CANONICAL ARCHIVE GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION CANONICAL ARCHIVE GATE: PASSED");
  console.log("- source archive present");
  console.log("- implementation queue present");
  console.log("- github sync plan present");
  console.log("- archive route present");
  console.log("- package scripts present");
}
