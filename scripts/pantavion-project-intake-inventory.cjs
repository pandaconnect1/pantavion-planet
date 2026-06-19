const fs = require("fs");
const path = require("path");

const root = process.cwd();

const excludedDirs = new Set([
  ".git",
  ".next",
  "node_modules",
  ".vercel",
  "data/water-network-private",
  "data/private",
  "data/founder"
]);

const scannedRoots = [
  "app",
  "core",
  "components",
  "scripts",
  "public",
  "docs",
  ".github"
];

const staticPatterns = [
  /todo/i,
  /fixme/i,
  /placeholder/i,
  /coming soon/i,
  /not implemented/i,
  /demo/i,
  /prototype/i,
  /static/i,
  /href=["']#["']/i,
  /alert\(/i,
  /disabled/i
];

const providerPatterns = [
  /provider/i,
  /api key/i,
  /process\.env/i,
  /stripe/i,
  /openai/i,
  /anthropic/i,
  /blob/i,
  /vercel/i,
  /firebase/i,
  /supabase/i
];

const capabilityHints = [
  ["water-infrastructure", /water|dwg|dxf|infrastructure/i],
  ["sos", /sos|emergency|elder|care/i],
  ["support-care", /elder|care|guardian|trusted-contact/i],
  ["panta-ai", /pantaai|ai|agent|model|provider|chatbot/i],
  ["universal-life", /universal-life|capabilit/i],
  ["marketplace", /market|classified|listing/i],
  ["messages-chat", /chat|message|inbox/i],
  ["contacts-import", /contact|invite/i],
  ["music", /music|audio/i],
  ["photos-multimedia", /media|photo|video|image/i],
  ["work-business", /work|business|professional/i],
  ["research", /research|source|citation/i],
  ["academy", /academy|education|learn/i],
  ["flights-travel", /travel|flight|tourism/i],
  ["kernel-governance", /kernel|governance|audit|deploy|intake/i]
];

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function shouldExcludeDirectory(relativePath) {
  const normalized = toPosix(relativePath);
  if (!normalized) return false;

  for (const excluded of excludedDirs) {
    if (normalized === excluded || normalized.startsWith(`${excluded}/`)) {
      return true;
    }
  }

  return false;
}

function walkDirectory(directory, output) {
  if (!fs.existsSync(directory)) return;

  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = toPosix(path.relative(root, fullPath));

    if (entry.isDirectory()) {
      if (!shouldExcludeDirectory(relativePath)) {
        walkDirectory(fullPath, output);
      }
      continue;
    }

    if (entry.isFile()) {
      output.push(relativePath);
    }
  }
}

function readSmallTextFile(relativePath) {
  const fullPath = path.join(root, relativePath);
  const ext = path.extname(relativePath).toLowerCase();
  const textExtensions = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".md",
    ".txt",
    ".css",
    ".html",
    ".yml",
    ".yaml"
  ]);

  if (!textExtensions.has(ext)) return "";

  try {
    const buffer = fs.readFileSync(fullPath);
    return buffer.toString("utf8").slice(0, 120000);
  } catch {
    return "";
  }
}

function routeFromAppPath(relativePath) {
  if (!relativePath.startsWith("app/")) return undefined;

  const file = path.posix.basename(relativePath);
  const dir = path.posix.dirname(relativePath);

  if (file !== "page.tsx" && file !== "route.ts") return undefined;

  const parts = dir
    .split("/")
    .slice(1)
    .filter((part) => part && !part.startsWith("(") && !part.startsWith("@"));

  if (file === "route.ts" && parts[0] === "api") {
    return `/${parts.join("/")}`;
  }

  return `/${parts.join("/")}`.replace(/\/$/, "") || "/";
}

function kindFor(relativePath) {
  const file = path.posix.basename(relativePath);

  if (relativePath.startsWith("app/") && file === "page.tsx") return "page_route";
  if (relativePath.startsWith("app/") && file === "route.ts") return "api_route";
  if (relativePath.startsWith("app/") && file === "layout.tsx") return "layout";
  if (relativePath.startsWith("core/kernel/")) return "kernel_file";
  if (relativePath.startsWith("core/")) return "core_file";
  if (relativePath.startsWith("scripts/")) return "script";
  if (relativePath.startsWith("public/")) return "public_asset";
  if (relativePath.startsWith("docs/") || relativePath.endsWith(".md")) return "doc";
  if (/^(next\.config|package\.json|tsconfig|tailwind|postcss|eslint)/.test(relativePath)) return "config";

  return "unknown";
}

function mappedCapabilitiesFor(relativePath, content) {
  const source = `${relativePath}\n${content}`;
  const mapped = [];

  for (const [capabilityId, pattern] of capabilityHints) {
    if (pattern.test(source)) mapped.push(capabilityId);
  }

  return Array.from(new Set(mapped));
}

function signalsFor(relativePath, kind, content) {
  const signals = [];

  if (kind === "page_route") signals.push("has_route");
  if (kind === "api_route") signals.push("has_api_route");
  if (relativePath.startsWith("core/")) signals.push("has_core_logic");
  if (relativePath.startsWith("core/kernel/")) signals.push("has_kernel_contract");

  if (staticPatterns.some((pattern) => pattern.test(content))) {
    signals.push("has_static_signal");
    signals.push("needs_work_order");
  }

  if (/prototype|demo|template/i.test(content) || /v0-new-project/i.test(relativePath)) {
    signals.push("has_prototype_signal");
    signals.push("needs_work_order");
  }

  if (/disabled|coming soon|not implemented/i.test(content)) {
    signals.push("has_disabled_signal");
    signals.push("needs_work_order");
  }

  if (/todo|fixme/i.test(content)) {
    signals.push("has_todo_signal");
    signals.push("needs_work_order");
  }

  if (/placeholder/i.test(content)) {
    signals.push("has_placeholder_signal");
    signals.push("needs_work_order");
  }

  if (providerPatterns.some((pattern) => pattern.test(content))) {
    signals.push("has_provider_need");
  }

  if (/water|dwg|dxf|sos|auth|access|admin|security|identity/i.test(relativePath)) {
    signals.push("has_protected_scope");
  }

  return Array.from(new Set(signals));
}

function riskFor(relativePath, kind, signals) {
  if (/data\/water-network-private|\.env|auth|security|identity|final-master-dwg/i.test(relativePath)) {
    return "critical";
  }

  if (signals.includes("has_protected_scope")) return "high";
  if (kind === "api_route") return "high";
  if (signals.includes("needs_work_order")) return "medium";

  return "low";
}

function notesFor(relativePath, kind, signals, mappedCapabilityIds) {
  const notes = [];

  if (kind === "page_route") notes.push("Public route candidate. Must pass realness gate before being treated as live.");
  if (kind === "api_route") notes.push("API route candidate. Must pass auth, permission, error and provider checks.");
  if (signals.includes("has_static_signal")) notes.push("Static/prototype signal detected. Needs work order before live claim.");
  if (signals.includes("has_provider_need")) notes.push("Provider/env/cost dependency detected.");
  if (signals.includes("has_protected_scope")) notes.push("Protected or sensitive scope. Founder review may be required.");
  if (mappedCapabilityIds.length === 0) notes.push("No capability mapping detected yet. Needs Project Intake classification.");

  return notes;
}

function createInventory() {
  const files = [];

  for (const rootName of scannedRoots) {
    walkDirectory(path.join(root, rootName), files);
  }

  const items = files.sort().map((relativePath) => {
    const kind = kindFor(relativePath);
    const content = readSmallTextFile(relativePath);
    const route = routeFromAppPath(relativePath);
    const mappedCapabilityIds = mappedCapabilitiesFor(relativePath, content);
    const signals = signalsFor(relativePath, kind, content);
    const risk = riskFor(relativePath, kind, signals);

    return {
      path: relativePath,
      kind,
      route,
      risk,
      mappedCapabilityIds,
      signals,
      notes: notesFor(relativePath, kind, signals, mappedCapabilityIds)
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalItems: items.length,
    pageRoutes: items.filter((item) => item.kind === "page_route").length,
    apiRoutes: items.filter((item) => item.kind === "api_route").length,
    kernelFiles: items.filter((item) => item.kind === "kernel_file").length,
    staticOrPrototypeItems: items.filter((item) =>
      item.signals.includes("has_static_signal") || item.signals.includes("has_prototype_signal")
    ).length,
    protectedItems: items.filter((item) => item.signals.includes("has_protected_scope")).length,
    workOrderCandidates: items.filter((item) => item.signals.includes("needs_work_order")).length,
    items
  };
}

function printSummary(report) {
  console.log("Pantavion Project Inventory Scanner");
  console.log("-----------------------------------");
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Total items: ${report.totalItems}`);
  console.log(`Page routes: ${report.pageRoutes}`);
  console.log(`API routes: ${report.apiRoutes}`);
  console.log(`Kernel files: ${report.kernelFiles}`);
  console.log(`Static/prototype items: ${report.staticOrPrototypeItems}`);
  console.log(`Protected items: ${report.protectedItems}`);
  console.log(`Work order candidates: ${report.workOrderCandidates}`);
  console.log("");

  const important = report.items
    .filter((item) => item.risk === "critical" || item.signals.includes("needs_work_order"))
    .slice(0, 30);

  console.log("Important items:");
  for (const item of important) {
    console.log(`- [${item.risk}] ${item.path}${item.route ? ` -> ${item.route}` : ""}`);
    if (item.mappedCapabilityIds.length > 0) {
      console.log(`  capabilities: ${item.mappedCapabilityIds.join(", ")}`);
    }
    if (item.signals.length > 0) {
      console.log(`  signals: ${item.signals.join(", ")}`);
    }
  }
}

const report = createInventory();
printSummary(report);

if (process.argv.includes("--write")) {
  const exportDir = path.join(root, "exports", "project-intake");
  fs.mkdirSync(exportDir, { recursive: true });
  const outputPath = path.join(exportDir, "local-project-inventory.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log("");
  console.log(`Wrote ${toPosix(path.relative(root, outputPath))}`);
}
