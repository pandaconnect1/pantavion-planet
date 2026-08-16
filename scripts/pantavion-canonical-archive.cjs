const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const root = process.cwd();
const outDir = path.join(root, "data", "pantavion-canonical-archive");
const sourceArchivePath = path.join(outDir, "source-archive.json");
const queuePath = path.join(outDir, "agent-implementation-queue.json");
const githubPlanPath = path.join(outDir, "github-sync-plan.json");
const docPath = path.join(root, "docs", "continuity", "pantavion-canonical-archive.md");

function exec(command) {
  try {
    return cp.execSync(command, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function listFiles(dir, limit) {
  const base = path.join(root, dir);
  const found = [];

  if (!fs.existsSync(base)) return found;

  const stack = [base];

  while (stack.length && found.length < limit) {
    const current = stack.pop();
    let entries = [];

    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      const rel = path.relative(root, full).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (!["node_modules", ".git", ".next", ".vercel"].includes(entry.name)) {
          stack.push(full);
        }
      } else if (entry.isFile()) {
        found.push(rel);
      }

      if (found.length >= limit) break;
    }
  }

  return found;
}

function readJson(relativePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  } catch {
    return fallback;
  }
}

function classifyScript(name, command) {
  const value = `${name} ${command}`.toLowerCase();

  if (name.startsWith("audit:")) return "audit";
  if (name.startsWith("agent:")) return "agent";
  if (name.startsWith("kernel") || name === "kernel") return "kernel";
  if (value.includes("water") || value.includes("dwg") || value.includes("cad")) return "water_dwg";
  if (value.includes("founder") || value.includes("apply") || value.includes("evolve")) return "self_evolution";
  if (name === "dev" || name === "build" || name === "start" || name.includes("typecheck")) return "lifecycle";
  return "other";
}

function zoneForScript(name, command) {
  const value = `${name} ${command}`.toLowerCase();

  if (value.includes("git add .") || value.includes("push --force") || value.includes("vercel --prod")) return "Z4";
  if (value.includes("--apply") || value.includes("founder") || value.includes("autoevolve") || value.includes("apply-pack")) return "Z3";
  if (name.startsWith("audit:") || name === "build" || name === "typecheck" || name === "kernel") return "Z1";
  return "Z2";
}

const pkg = readJson("package.json", {});
const scripts = pkg.scripts || {};

const scriptLedger = Object.entries(scripts).map(([name, command]) => ({
  name,
  command,
  class: classifyScript(name, command),
  riskZone: zoneForScript(name, command),
  approvalRequired: ["Z3", "Z4"].includes(zoneForScript(name, command))
}));

const repo = {
  branch: exec("git branch --show-current"),
  head: exec("git log --oneline -1"),
  recentLog: exec("git log --oneline -40").split(/\r?\n/).filter(Boolean),
  statusShort: exec("git status --short")
};

const sourceArchive = {
  ok: true,
  id: "pantavion_source_archive_v1",
  generatedAt: new Date().toISOString(),
  root: root.replace(/\\/g, "/"),
  repo,
  packageScripts: {
    total: scriptLedger.length,
    scripts: scriptLedger
  },
  sourceFiles: {
    app: listFiles("app", 600),
    core: listFiles("core", 600),
    scripts: listFiles("scripts", 300),
    docsContinuity: listFiles("docs/continuity", 300),
    dataLegacyIntake: listFiles("data/pantavion-legacy-intake", 200),
    pantavionRootDocs: fs.readdirSync(root)
      .filter((name) => /^PANTAVION/i.test(name) && fs.statSync(path.join(root, name)).isFile())
      .slice(0, 100)
  },
  evidenceStatus: {
    universalEntry: exists("core/access/pantavion-universal-entry.ts"),
    legacyIntake: exists("data/pantavion-legacy-intake/legacy-source-manifest.json"),
    twoYearCanon: exists("data/pantavion-legacy-intake/two-year-recovery-canon.json"),
    orchestratorPlan: exists("data/pantavion-agent-orchestrator/orchestrator-plan.json"),
    agentRuntime: exists("core/agents/pantavion-agent-runtime-guardrails.ts"),
    agentTick: exists("core/agents/pantavion-agent-runtime-tick.ts")
  }
};

const domains = [
  "kernel_agent_runtime",
  "universal_entry_user_gateway",
  "legacy_two_year_recovery",
  "auth_identity_memory",
  "billing_vip_payments",
  "dwg_water_source_truth",
  "social_messaging_dating_safety",
  "repo_github_deploy",
  "voice_translation_search",
  "files_conversion_omnimodal",
  "sos_rescue_recovery",
  "global_research_radar_24_365",
  "observability_runtime_ops"
];

const queue = {
  ok: true,
  id: "pantavion_agent_implementation_queue_v1",
  generatedAt: sourceArchive.generatedAt,
  rule: "Agents must turn archive evidence into route + state/data + audit + verification. Z3/Z4 need founder approval.",
  nextWorkOrders: domains.map((id, index) => {
    const approvalRequired = [
      "auth_identity_memory",
      "billing_vip_payments",
      "dwg_water_source_truth",
      "social_messaging_dating_safety",
      "repo_github_deploy",
      "sos_rescue_recovery",
      "observability_runtime_ops"
    ].includes(id);

    return {
      id,
      order: index + 1,
      priority: index < 8 ? "P0" : "P1",
      riskZone: approvalRequired ? "Z3" : "Z2",
      approvalRequired,
      status: "ready_for_agent_supervisor",
      requiredOutcome: "Create implementation slice with real route, state/data, audit, verification and scoped repo plan."
    };
  })
};

const githubPlan = {
  ok: true,
  id: "pantavion_github_sync_plan_v1",
  generatedAt: sourceArchive.generatedAt,
  branch: repo.branch,
  head: repo.head,
  allowed: [
    "scoped git add only",
    "commit after build/typecheck/audits",
    "push current branch",
    "preview deploy after checks",
    "production deploy only after founder approval"
  ],
  blocked: [
    "git add .",
    "force push",
    "secret exposure",
    "raw old repo dump",
    "DWG/source-truth cloud translation without approval",
    "production deploy without approval"
  ],
  requiredChecks: [
    "npx tsc --noEmit --pretty false",
    "npm run build",
    "npm run audit:agent-runtime",
    "npm run audit:agent-tick",
    "npm run audit:archive"
  ]
};

const doc = [
  "# Pantavion Canonical Archive",
  "",
  "This archive is the permanent bridge between the founder vision, old repos, old patches, current repo, Kernel, Agent runtime and GitHub execution.",
  "",
  "## Current repo",
  "",
  "- Branch: " + repo.branch,
  "- Head: " + repo.head,
  "- Git status: " + (repo.statusShort || "clean"),
  "",
  "## Evidence status",
  "",
  ...Object.entries(sourceArchive.evidenceStatus).map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## Rule",
  "",
  "Pantavion must not raw-add old repos blindly. It archives evidence, produces implementation queues, creates GitHub sync plans and lets Kernel/Agent implement in safe order.",
  "",
  "## Next",
  "",
  "Patch 7 must add Agent Supervisor + Work Order API that reads this archive and creates the next implementation slice automatically."
].join("\n");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(docPath), { recursive: true });

fs.writeFileSync(sourceArchivePath, JSON.stringify(sourceArchive, null, 2) + "\n", "utf8");
fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + "\n", "utf8");
fs.writeFileSync(githubPlanPath, JSON.stringify(githubPlan, null, 2) + "\n", "utf8");
fs.writeFileSync(docPath, doc + "\n", "utf8");

console.log(JSON.stringify({
  ok: true,
  wrote: [
    "data/pantavion-canonical-archive/source-archive.json",
    "data/pantavion-canonical-archive/agent-implementation-queue.json",
    "data/pantavion-canonical-archive/github-sync-plan.json",
    "docs/continuity/pantavion-canonical-archive.md"
  ],
  scripts: scriptLedger.length,
  workOrders: queue.nextWorkOrders.length,
  approvalRequired: queue.nextWorkOrders.filter((item) => item.approvalRequired).length
}, null, 2));
