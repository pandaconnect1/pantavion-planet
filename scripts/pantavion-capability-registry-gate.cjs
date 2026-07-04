const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];

const required = [
  "core/capabilities/pantavion-capability-registry.ts",
  "app/api/pantavion/capabilities/route.ts",
  "scripts/pantavion-capability-registry-gate.cjs",
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

const core = read("core/capabilities/pantavion-capability-registry.ts");
const route = read("app/api/pantavion/capabilities/route.ts");
const pkgText = read("package.json");

const markers = [
  "PANTAVION_CAPABILITY_REGISTRY_ID",
  "execution_kernel",
  "live_chat",
  "pulse_feed",
  "contacts_import",
  "people_graph",
  "dwg_source_truth",
  "summarizePantavionCapabilities",
  "visible does not mean production-complete"
];

for (const marker of markers) {
  if (!core.includes(marker)) {
    failures.push("Capability registry missing marker: " + marker);
  }
}

if (!route.includes("/api/pantavion/capabilities")) {
  failures.push("Capability route marker missing.");
}

let pkg = null;

try {
  pkg = JSON.parse(pkgText);
} catch {
  failures.push("package.json invalid JSON.");
}

if (pkg && pkg.scripts) {
  if (pkg.scripts["audit:capability-registry"] !== "node scripts/pantavion-capability-registry-gate.cjs") {
    failures.push("package.json missing audit:capability-registry.");
  }
}

if (failures.length > 0) {
  console.error("PANTAVION CAPABILITY REGISTRY GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION CAPABILITY REGISTRY GATE: PASSED");
  console.log("- capability registry present");
  console.log("- capability route present");
  console.log("- truthful statuses present");
  console.log("- package script present");
}
