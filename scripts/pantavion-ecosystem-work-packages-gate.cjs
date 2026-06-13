const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/autonomous-code/ecosystem-work-packages.ts",
  "core/pantaai/autonomous-code/ecosystem-work-package-generator.ts",
  "app/api/internal/pantavion/ecosystem-work-packages/route.ts",
];

const requiredMarkers = [
  "pantavion_ecosystem_work_packages_c5_v1",
  "pantavion_work_package_generator_c5_v1",
  "pantavion_ecosystem_work_packages_route_c5_v1",
];

const requiredSignals = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "DeepSeek",
  "Cursor",
  "Claude Code",
  "Codex",
  "Windsurf",
  "Pinecone",
  "LlamaIndex",
  "Make",
  "Zapier",
  "n8n",
  "WeChat",
  "Weibo",
  "RedNote",
  "Alipay",
  "Baidu",
  "AMAP",
  "Didi",
  "Douyin",
  "Tantan",
  "Seven-continent",
  "Water",
  "Identity",
  "SOS"
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

const forbidden = ["git add .", "auto merge", "public raw water", "ignore secrets"];
for (const item of forbidden) {
  if (allText.toLowerCase().includes(item)) {
    errors.push(`Forbidden unsafe text found: ${item}`);
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:ecosystem-work-packages"]) {
  errors.push("Missing package script: audit:ecosystem-work-packages");
}

const report = {
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  requiredMarkers: requiredMarkers.length,
  errors,
};

console.log(JSON.stringify(report, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
