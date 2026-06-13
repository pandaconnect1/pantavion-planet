const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/model-router/provider-capability-matrix.ts",
  "core/pantaai/autonomous-code/coding-provider-matrix.ts",
  "core/pantaai/model-router/agent-task-router.ts",
  "core/pantaai/tool-substitution/tool-substitution-advisor.ts",
  "app/api/internal/pantavion/model-agent-router/route.ts",
];

const requiredMarkers = [
  "pantavion_model_provider_matrix_c3_v1",
  "pantavion_coding_provider_matrix_c3_v1",
  "pantavion_agent_task_router_c3_v1",
  "pantavion_tool_substitution_advisor_c3_v1",
  "pantavion_model_agent_router_route_c3_v1",
];

const requiredSignals = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Grok",
  "Perplexity",
  "DeepSeek",
  "Gemma",
  "Google Bard",
  "Bing AI",
  "Cursor",
  "Claude Code",
  "OpenAI Codex",
  "Windsurf",
  "GitHub Copilot",
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
  "WeChat",
  "Weibo",
  "RedNote",
  "QQ",
  "Qzone",
  "Bilibili",
  "Alipay",
  "Baidu",
  "AMAP",
  "Didi",
  "Dianping",
  "Douyin",
  "Tantan",
  "no_fake_active_feature",
  "protected_child_kernel_gate",
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

const forbidden = [
  "git add .",
  "auto merge",
  "skip founder",
  "public raw water",
  "ignore secrets",
];

for (const item of forbidden) {
  if (allText.toLowerCase().includes(item)) {
    errors.push(`Forbidden unsafe text found: ${item}`);
  }
}

const packagePath = path.join(process.cwd(), "package.json");
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  if (!pkg.scripts || !pkg.scripts["audit:model-agent-router"]) {
    errors.push("Missing package script: audit:model-agent-router");
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
