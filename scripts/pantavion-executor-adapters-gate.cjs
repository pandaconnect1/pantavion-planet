const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/execution-adapters/executor-adapter-planner.ts",
];

const requiredMarkers = [
  "pantavion_executor_adapter_planner_c6_v1",
];

const requiredSignals = [
  "model_provider",
  "coding_agent",
  "rag_memory",
  "workflow",
  "china_superapp",
  "continent_runtime",
  "translation_voice",
  "protected_domain",
  "no_static_only_capability",
  "no_external_brand_copying",
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
  if (!allText.toLowerCase().includes(signal.toLowerCase())) {
    errors.push(`Missing signal: ${signal}`);
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:executor-adapters"]) {
  errors.push("Missing package script: audit:executor-adapters");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors,
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
