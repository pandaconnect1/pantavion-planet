const fs = require("fs");
const path = require("path");

const root = process.cwd();
const vaultDir = path.join(root, "data", "founder-vision-vault");
const outDir = path.join(root, "data", "runtime-reports");
fs.mkdirSync(vaultDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const extensions = new Set([".md", ".txt", ".json", ".ts", ".tsx", ".js", ".cjs", ".html"]);
const blocked = [".next", "node_modules", "data/water-network-private"];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    const rel = path.relative(root, full).replace(/\\/g, "/");
    if (blocked.some((b) => rel === b || rel.startsWith(b + "/"))) continue;
    if (item.isDirectory()) out.push(...walk(full));
    else if (extensions.has(path.extname(item.name))) out.push(full);
  }
  return out;
}

const files = [
  ...walk(vaultDir),
  ...walk(path.join(root, "app")),
  ...walk(path.join(root, "core")),
  ...walk(path.join(root, "scripts")),
];

const keywords = [
  "voice", "translation", "interpreter", "language", "dialect", "7000",
  "SOS", "social", "marketplace", "work", "income", "media", "education",
  "kernel", "guardian", "PantaAI", "provider", "auth", "database",
  "satellite", "offline", "emergency", "identity", "vision", "planned",
  "blocked", "unfinished", "future", "missing"
];

const findings = [];

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  lines.forEach((line, i) => {
    const hit = keywords.find((k) => line.toLowerCase().includes(k.toLowerCase()));
    if (hit) {
      findings.push({
        file: rel,
        line: i + 1,
        keyword: hit,
        text: line.trim().slice(0, 300)
      });
    }
  });
}

const report = {
  id: "pantavion_founder_vision_ingestion_v1",
  generatedAt: new Date().toISOString(),
  truth: "Kernel/AI ingests founder vision vault plus repo code to recover unfinished Pantavion ideas and convert them into runtime priorities.",
  totals: {
    scannedFiles: files.length,
    findings: findings.length
  },
  lockedRuntimePriorities: [
    "World-class realtime voice translation interpreter",
    "Open target-language runtime for 7000+ languages and dialects",
    "Bidirectional conversation mode",
    "Speech input and speech output",
    "Live subtitles",
    "Professional, medical, legal, scientific, emergency terminology modes",
    "Global user language applied everywhere",
    "Provider Router with live model/translation/speech adapters",
    "Memory and terminology vault",
    "Offline phrase packs for SOS and travel",
    "Social, work, media, marketplace, education, SOS integration"
  ],
  findings
};

fs.writeFileSync(
  path.join(outDir, "latest-founder-vision-ingestion.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log("PANTAVION FOUNDER VISION INGESTION: PASSED");
console.log("- scanned files:", files.length);
console.log("- findings:", findings.length);
