const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/runtime/runtime-ledger.ts",
  "app/api/internal/pantavion/runtime-ledger/route.ts"
];

const requiredMarkers = [
  "pantavion_runtime_ledger_c7a_v1",
  "pantavion_runtime_ledger_route_c7a_v1"
];

const requiredSignals = [
  "kernel_wake",
  "code_generated",
  "adapter_planned",
  "work_package_planned",
  "protected_gate_required",
  "founder_gate_required",
  "provider_required",
  "connector_required",
  "summarizePantavionRuntimeLedger",
  "appendPantavionRuntimeLedgerEvent"
];

const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    errors.push(`Missing file: ${file}`);
  }
}

const allText = requiredFiles
  .filter((file) => fs.existsSync(path.join(process.cwd(), file)))
  .map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8"))
  .join("\n");

for (const marker of requiredMarkers) {
  if (!allText.includes(marker)) {
    errors.push(`Missing marker: ${marker}`);
  }
}

for (const signal of requiredSignals) {
  if (!allText.includes(signal)) {
    errors.push(`Missing signal: ${signal}`);
  }
}

const forbidden = ["git add .", "auto merge", "public raw water", "ignore secrets"];

for (const item of forbidden) {
  if (allText.toLowerCase().includes(item)) {
    errors.push(`Forbidden unsafe text found: ${item}`);
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:runtime-ledger"]) {
  errors.push("Missing package script: audit:runtime-ledger");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
