const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/ecosystem/pantavion-master-vision.ts",
  "core/pantaai/ecosystem/global-ecosystem-registry.ts",
  "core/pantaai/ecosystem/seven-continent-ecosystem-map.ts",
  "core/pantaai/ecosystem/ecosystem-unification-kernel.ts",
  "core/kernel/ecosystem-unification-kernel-bridge.ts",
  "app/api/internal/pantavion/ecosystem-unification/route.ts",
];

const requiredMarkers = [
  "pantavion_master_vision_ecosystem_unification_c2_v1",
  "pantavion_global_ecosystem_registry_c2_v1",
  "pantavion_seven_continent_ecosystem_c2_v1",
  "pantavion_ecosystem_unification_kernel_c2_v1",
  "pantavion_ecosystem_unification_bridge_c2_v1",
  "pantavion_ecosystem_unification_route_c2_v1",
];

const requiredSignals = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Grok",
  "Perplexity",
  "DeepSeek",
  "Gemma",
  "Bard",
  "Bing AI",
  "Cursor",
  "Claude Code",
  "Codex",
  "Windsurf",
  "Copilot",
  "Replit",
  "Devin",
  "Amazon Q",
  "Pinecone",
  "LlamaIndex",
  "Haystack",
  "Milvus",
  "Make",
  "Zapier",
  "n8n",
  "Gumloop",
  "Google full-stack",
  "China",
  "seven-continent",
  "Water",
  "SOS",
  "identity",
  "payments",
  "live translation",
  "24/366",
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
    errors.push(`Missing required ecosystem signal: ${signal}`);
  }
}

const pkgPath = path.join(process.cwd(), "package.json");
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.scripts || !pkg.scripts["audit:ecosystem-unification"]) {
    errors.push("Missing package script: audit:ecosystem-unification");
  }
}

const report = {
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  requiredMarkers: requiredMarkers.length,
  requiredSignals: requiredSignals.length,
  errors,
};

console.log(JSON.stringify(report, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
