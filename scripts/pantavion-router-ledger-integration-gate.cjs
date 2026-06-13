const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "app/api/internal/pantavion/executor-adapters/route.ts",
  "app/api/internal/pantavion/ecosystem-work-packages/route.ts",
  "app/api/internal/pantavion/model-agent-router/route.ts"
];

const requiredSignals = [
  "appendPantavionRuntimeLedgerEvent",
  "pantavion_executor_adapters_ledger_route_c7c_v1",
  "pantavion_ecosystem_work_packages_ledger_route_c7c_v1",
  "pantavion_model_agent_router_ledger_route_c7c_v1",
  "adapter_planned",
  "work_package_planned",
  "job_claimed"
];

const errors = [];

for (const file of requiredFiles) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) {
    errors.push(`Missing file: ${file}`);
    continue;
  }

  const text = fs.readFileSync(full, "utf8");

  if (/^export const pantavion_.*_marker_v1\s*=/m.test(text)) {
    errors.push(`Route has forbidden exported marker: ${file}`);
  }

  for (const signal of requiredSignals) {
    if (signal.includes("executor") && !file.includes("executor")) continue;
    if (signal.includes("ecosystem_work") && !file.includes("ecosystem-work")) continue;
    if (signal.includes("model_agent") && !file.includes("model-agent")) continue;
    if (!text.includes(signal) && !signal.includes("executor") && !signal.includes("ecosystem_work") && !signal.includes("model_agent")) {
      errors.push(`Missing signal in ${file}: ${signal}`);
    }
  }

  if (!text.includes("appendPantavionRuntimeLedgerEvent")) {
    errors.push(`Missing ledger append in ${file}`);
  }
}

const allText = requiredFiles
  .map((file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "")
  .join("\n");

for (const signal of requiredSignals) {
  if (!allText.includes(signal)) {
    errors.push(`Missing global signal: ${signal}`);
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:router-ledger-integration"]) {
  errors.push("Missing package script: audit:router-ledger-integration");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
