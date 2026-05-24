const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

const root = process.cwd();
const outDir = path.join(root, "data", "runtime-reports");
fs.mkdirSync(outDir, { recursive: true });

const includeRoots = ["app", "core", "scripts", ".github"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".cjs", ".yml", ".yaml", ".json", ".md"]);

const markers = [
  "planned",
  "blocked",
  "provider_pending",
  "provider-required",
  "TODO",
  "FIXME",
  "missing",
  "foundation",
  "future",
  "not yet",
  "requires",
  "Founder OK",
  "approval",
  "runtimeTarget",
  "mustNotFake",
  "translation",
  "interpreter",
  "voice",
  "sos",
  "marketplace",
  "social",
  "identity",
  "auth",
  "database",
  "provider",
  "radar",
  "guardian",
  "kernel",
];

const blockedRoots = [
  ".next",
  "node_modules",
  "data/water-network-private",
  "_local_backups",
  ".pantavion-backups",
];

function isBlocked(file) {
  return blockedRoots.some((blocked) => file === blocked || file.startsWith(blocked + path.sep));
}

function walk(dir) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) return [];

  const out = [];
  for (const item of fs.readdirSync(absolute, { withFileTypes: true })) {
    const rel = path.join(dir, item.name);
    if (isBlocked(rel)) continue;

    if (item.isDirectory()) out.push(...walk(rel));
    else if (extensions.has(path.extname(item.name))) out.push(rel);
  }
  return out;
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const files = includeRoots.flatMap(walk);
const findings = [];

for (const file of files) {
  let content = "";
  try {
    content = read(file);
  } catch {
    continue;
  }

  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const hit = markers.find((marker) => line.toLowerCase().includes(marker.toLowerCase()));
    if (!hit) return;

    findings.push({
      file: file.replace(/\\/g, "/"),
      line: index + 1,
      marker: hit,
      text: line.trim().slice(0, 260),
    });
  });
}

let gitStatus = "";
try {
  gitStatus = child_process.execSync("git status --short --untracked-files=all", {
    cwd: root,
    encoding: "utf8",
  });
} catch (error) {
  gitStatus = String(error.stdout || "") + String(error.stderr || "");
}

const plan = {
  id: "pantavion_unfinished_plan_ingestion_v1",
  generatedAt: new Date().toISOString(),
  truth:
    "This report scans pushed/local repository files for unfinished Pantavion plans, runtime gaps, provider-pending states, fake-risk markers, and untracked work. It does not inspect private VS Code memory outside the repository.",
  totals: {
    scannedFiles: files.length,
    findings: findings.length,
    untrackedOrModifiedLines: gitStatus.split(/\r?\n/).filter(Boolean).length,
  },
  immediateRuntimePriorities: [
    "Realtime voice interpreter: mic in, language detection, translation, subtitles, speech out",
    "Global language runtime across all Pantavion UI/routes",
    "Provider Router v1 with OpenAI/Google/Anthropic/Mistral/local model adapter slots",
    "Agent Identity + Delegation + Provenance audit",
    "Auth/database/session foundation",
    "SOS trusted contacts backend + provider-pending SMS/push",
    "Social/chat backend foundation",
    "Marketplace/work/services backend foundation",
  ],
  gitStatus,
  findings: findings.slice(0, 800),
};

fs.writeFileSync(
  path.join(outDir, "latest-unfinished-plan-ingestion.json"),
  JSON.stringify(plan, null, 2) + "\n",
  "utf8"
);

console.log("PANTAVION UNFINISHED PLAN INGESTION: WRITTEN");
console.log("- scanned files:", files.length);
console.log("- findings:", findings.length);
console.log("- report: data/runtime-reports/latest-unfinished-plan-ingestion.json");
