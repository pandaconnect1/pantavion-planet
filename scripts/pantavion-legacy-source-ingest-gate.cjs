const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/intelligence/pantavion-legacy-source-intake.ts",
  "app/api/pantavion/agents/runtime/legacy-intake/route.ts",
  "scripts/pantavion-legacy-source-ingest.cjs",
  "scripts/pantavion-legacy-source-ingest-gate.cjs",
  "docs/continuity/pantavion-legacy-source-intake.md",
  "docs/continuity/pantavion-legacy-source-intake-report.md",
  "data/pantavion-legacy-intake/legacy-source-manifest.json",
  "data/pantavion-legacy-intake/legacy-extracts.jsonl",
  "data/pantavion-legacy-intake/legacy-work-orders.json",
  "package.json"
];

const failures = [];

function read(relativePath) {
  const p = path.join(root, relativePath);
  if (!fs.existsSync(p)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }
  return fs.readFileSync(p, "utf8");
}

for (const file of requiredFiles) read(file);

const core = read("core/intelligence/pantavion-legacy-source-intake.ts");
const manifestText = read("data/pantavion-legacy-intake/legacy-source-manifest.json");
const workOrdersText = read("data/pantavion-legacy-intake/legacy-work-orders.json");
const extractsText = read("data/pantavion-legacy-intake/legacy-extracts.jsonl");
const packageText = read("package.json");

const markers = [
  "pantavion_legacy_source_intake_v1",
  "PANTAVION_LEGACY_SOURCE_CANDIDATES",
  "PANTAVION_LEGACY_WORK_ORDER_SEEDS",
  "Old repos and old notes must not be raw-added blindly",
  "DWG/DXF/CAD artifacts are metadata-only"
];

for (const marker of markers) {
  if (!core.includes(marker)) failures.push("Legacy intake core missing marker: " + marker);
}

let manifest = null;
let workOrders = null;
let pkg = null;

try { manifest = JSON.parse(manifestText); } catch { failures.push("Legacy manifest is invalid JSON."); }
try { workOrders = JSON.parse(workOrdersText); } catch { failures.push("Legacy work orders file is invalid JSON."); }
try { pkg = JSON.parse(packageText); } catch { failures.push("package.json is invalid JSON."); }

if (manifest) {
  if (!manifest.ok) failures.push("Legacy manifest is not ok.");
  if (!manifest.totals || manifest.totals.filesIndexed < 1) failures.push("Legacy manifest indexed no files.");
  if (!manifest.rules || !manifest.rules.join(" ").includes("Secrets")) failures.push("Legacy manifest must include secret handling rule.");
}

if (workOrders) {
  if (!Array.isArray(workOrders.workOrders)) failures.push("Legacy work orders must be an array.");
  if (Array.isArray(workOrders.workOrders) && workOrders.workOrders.length < 1) failures.push("No legacy work orders generated.");
}

if (!extractsText.trim()) {
  failures.push("Legacy extracts jsonl is empty.");
}

if (pkg && pkg.scripts) {
  if (pkg.scripts["agent:legacy-intake"] !== "node scripts/pantavion-legacy-source-ingest.cjs") {
    failures.push("package.json must include agent:legacy-intake.");
  }
  if (pkg.scripts["audit:legacy-intake"] !== "node scripts/pantavion-legacy-source-ingest-gate.cjs") {
    failures.push("package.json must include audit:legacy-intake.");
  }
}

if (failures.length > 0) {
  console.error("PANTAVION LEGACY SOURCE INTAKE GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION LEGACY SOURCE INTAKE GATE: PASSED");
  console.log("- legacy source contract present");
  console.log("- old source candidates represented");
  console.log("- sanitized manifest present");
  console.log("- extracts present");
  console.log("- work orders present");
  console.log("- route present");
  console.log("- package scripts present");
}
