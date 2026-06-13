const fs = require("fs");
const path = require("path");

const requiredFile = "core/pantaai/autonomous-code/code-generation-worker.ts";
const text = fs.readFileSync(path.join(process.cwd(), requiredFile), "utf8");

const requiredSignals = [
  "../runtime/runtime-ledger",
  "appendPantavionRuntimeLedgerEvent",
  "recordCodeGenerationLedgerEvent",
  "kernel_wake",
  "gap_detected",
  "code_generated",
  "protected_gate_required",
  "pr_created",
  "error_recorded",
  "pantavion_code_generation_worker_ledger_integration_c7b_v1"
];

const errors = [];

for (const signal of requiredSignals) {
  if (!text.includes(signal)) {
    errors.push(`Missing signal: ${signal}`);
  }
}

const forbidden = [
  "git add .",
  "public raw water",
  "ignore secrets",
  "auto merge without gate"
];

for (const item of forbidden) {
  if (text.toLowerCase().includes(item)) {
    errors.push(`Forbidden unsafe text found: ${item}`);
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:code-generation-ledger-integration"]) {
  errors.push("Missing package script: audit:code-generation-ledger-integration");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFile: requiredFile,
  errors
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
