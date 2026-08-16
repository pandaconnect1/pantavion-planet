const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const outDir = path.join(root, "data", "pantavion-founder-doctrine");
const indexPath = path.join(outDir, "founder-doctrine-index.json");
const workOrdersPath = path.join(outDir, "founder-doctrine-work-orders.json");
const codeTargetsPath = path.join(outDir, "founder-doctrine-code-targets.json");
const docPath = path.join(root, "docs", "continuity", "pantavion-founder-doctrine-deep-intake.md");

const skipDirs = new Set([".git", ".next", "node_modules", ".vercel", "dist", "build"]);
const allowedExt = new Set([".md", ".txt", ".json", ".ts", ".tsx", ".js", ".cjs", ".mjs"]);

function normalizeSlash(value) {
  return String(value || "").replace(/\\/g, "/");
}

function walk(dir, limit = 6000) {
  const files = [];
  const stack = [dir];

  while (stack.length && files.length < limit) {
    const current = stack.pop();

    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (!skipDirs.has(entry.name)) stack.push(full);
      } else if (entry.isFile()) {
        files.push(full);
      }

      if (files.length >= limit) break;
    }
  }

  return files;
}

function isDoctrineCandidate(file) {
  const rel = normalizeSlash(path.relative(root, file));
  const base = path.basename(file).toLowerCase();
  const ext = path.extname(file).toLowerCase();

  if (!allowedExt.has(ext)) return false;

  if (
    base.includes("pantavion") ||
    base.includes("doctrine") ||
    base.includes("recovery") ||
    base.includes("snapshot") ||
    base.includes("canon") ||
    base.includes("archive") ||
    base.includes("ledger") ||
    base.includes("101")
  ) {
    return true;
  }

  if (
    rel.startsWith("docs/continuity/") ||
    rel.startsWith("data/pantavion-legacy-intake/") ||
    rel.startsWith("data/pantavion-canonical-archive/") ||
    rel.startsWith("data/pantavion-agent-orchestrator/")
  ) {
    return true;
  }

  return false;
}

function readSafe(file) {
  try {
    const stat = fs.statSync(file);
    if (stat.size > 1200000) {
      return {
        text: "",
        omitted: "too_large",
        sizeBytes: stat.size
      };
    }

    return {
      text: fs.readFileSync(file, "utf8"),
      omitted: null,
      sizeBytes: stat.size
    };
  } catch {
    return {
      text: "",
      omitted: "read_failed",
      sizeBytes: 0
    };
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function classify(text, rel) {
  const value = `${rel}\n${text}`.toLowerCase();
  const categories = [];

  if (/intent|plan|capability|execution|orchestrator|doing|result/.test(value)) categories.push("execution_system");
  if (/tool ingestion|tool registry|registry|tools|provider|adapter|api/.test(value)) categories.push("tool_registry");
  if (/workspace|workspaces|create|build|learn|business|security|productivity/.test(value)) categories.push("workspace_mapping");
  if (/kernel|agent|self-upgrade|self upgrade|self-improvement|daemon|supervisor|work order/.test(value)) categories.push("kernel_agents");
  if (/memory|continuity|graph|neo4j|knowledge graph/.test(value)) categories.push("memory_graph");
  if (/voice|image|video|multimodal|speech|camera|microphone|input/.test(value)) categories.push("multimodal_access");
  if (/research|absorption|technology intelligence|market intelligence|global/.test(value)) categories.push("global_absorption");
  if (/auth|identity|login|session|profile/.test(value)) categories.push("auth_identity");
  if (/stripe|billing|payment|vip|entitlement/.test(value)) categories.push("billing_vip");
  if (/dwg|dxf|cad|water|gis|source truth/.test(value)) categories.push("dwg_water");
  if (/sos|emergency|rescue|offline|satellite/.test(value)) categories.push("sos_rescue");
  if (/repo|github|deploy|vercel|commit|pull request/.test(value)) categories.push("repo_deploy");

  return categories.length ? categories : ["general_doctrine"];
}

function workOrderTemplate(category) {
  const templates = {
    execution_system: {
      priority: "P0",
      riskZone: "Z2",
      title: "Build real Pantavion execution kernel",
      requiredOutcome: "Intent -> Plan -> Capability -> Execution -> Result route with state, artifacts and audit."
    },
    tool_registry: {
      priority: "P0",
      riskZone: "Z2",
      title: "Build formal tool/capability ingestion registry",
      requiredOutcome: "Tools become capabilities with cost, risk, license, status and integration type."
    },
    workspace_mapping: {
      priority: "P0",
      riskZone: "Z2",
      title: "Map workspaces to executable workflows",
      requiredOutcome: "Create/Build/Learn/Business/Security/Productivity become workflows, not static categories."
    },
    kernel_agents: {
      priority: "P0",
      riskZone: "Z2",
      title: "Connect Kernel/Agents to archive, work orders and code writer",
      requiredOutcome: "Agent supervisor reads archive/work-orders and produces implementation slices."
    },
    memory_graph: {
      priority: "P0",
      riskZone: "Z3",
      title: "Design durable memory and knowledge graph foundation",
      requiredOutcome: "User/project/domain memory with consent, privacy class, export/delete and audit."
    },
    multimodal_access: {
      priority: "P1",
      riskZone: "Z2",
      title: "Create multimodal access roadmap",
      requiredOutcome: "Text, voice, image, video, docs and mixed inputs become one normalized meaning layer."
    },
    global_absorption: {
      priority: "P1",
      riskZone: "Z2",
      title: "Create daily global absorption pipeline",
      requiredOutcome: "Discover, verify, classify, distill and convert new technology into Pantavion work orders."
    },
    auth_identity: {
      priority: "P0",
      riskZone: "Z3",
      title: "Build auth/identity implementation plan",
      requiredOutcome: "Account, session, profile, consent memory and security gates."
    },
    billing_vip: {
      priority: "P0",
      riskZone: "Z3",
      title: "Build billing/VIP implementation plan",
      requiredOutcome: "Stripe/provider gate, VIP entitlements, billing audit and production approval."
    },
    dwg_water: {
      priority: "P0",
      riskZone: "Z3",
      title: "Protect DWG/water source truth implementation path",
      requiredOutcome: "Original DWG read-only, licensed adapter, private vault and no fake source map."
    },
    sos_rescue: {
      priority: "P0",
      riskZone: "Z3",
      title: "Build SOS/rescue governed implementation plan",
      requiredOutcome: "Emergency circle, offline packet, lawful recovery and institutional boundaries."
    },
    repo_deploy: {
      priority: "P0",
      riskZone: "Z3",
      title: "Build repo/deploy controller plan",
      requiredOutcome: "Scoped git, checks, PR/preview plan and founder approval for production."
    },
    general_doctrine: {
      priority: "P2",
      riskZone: "Z2",
      title: "Classify general founder doctrine into implementation queue",
      requiredOutcome: "General doctrine becomes a typed work order."
    }
  };

  return templates[category] || templates.general_doctrine;
}

function codeTargetsFor(category) {
  const targets = {
    execution_system: [
      "core/execution/pantavion-execution-kernel.ts",
      "app/api/pantavion/execute/route.ts",
      "scripts/pantavion-execution-kernel-gate.cjs"
    ],
    tool_registry: [
      "core/capabilities/pantavion-capability-registry.ts",
      "app/api/pantavion/capabilities/route.ts",
      "scripts/pantavion-capability-registry-gate.cjs"
    ],
    workspace_mapping: [
      "core/workspaces/pantavion-workspace-execution-map.ts",
      "app/api/pantavion/workspaces/map/route.ts"
    ],
    kernel_agents: [
      "core/agents/pantavion-agent-supervisor.ts",
      "app/api/pantavion/agents/runtime/supervisor/route.ts",
      "scripts/pantavion-agent-supervisor.cjs"
    ],
    memory_graph: [
      "core/memory/pantavion-memory-contract.ts",
      "app/api/pantavion/memory/status/route.ts"
    ],
    multimodal_access: [
      "core/input/pantavion-universal-input.ts",
      "app/api/pantavion/input/route.ts"
    ],
    global_absorption: [
      "core/research/pantavion-global-absorption.ts",
      "app/api/pantavion/research/absorption/route.ts"
    ],
    auth_identity: [
      "core/auth/pantavion-auth-plan.ts",
      "app/api/pantavion/auth/status/route.ts"
    ],
    billing_vip: [
      "core/billing/pantavion-billing-plan.ts",
      "app/api/pantavion/billing/status/route.ts"
    ],
    dwg_water: [
      "core/water/pantavion-dwg-source-truth-plan.ts",
      "app/api/professional/infrastructure/water/dwg-viewer/status/route.ts"
    ],
    sos_rescue: [
      "core/sos/pantavion-sos-rescue-plan.ts",
      "app/api/pantavion/sos/status/route.ts"
    ],
    repo_deploy: [
      "core/agents/pantavion-repo-deploy-controller.ts",
      "app/api/pantavion/agents/runtime/repo-plan/route.ts"
    ],
    general_doctrine: [
      "docs/continuity/pantavion-general-doctrine-queue.md"
    ]
  };

  return targets[category] || targets.general_doctrine;
}

const files = walk(root).filter(isDoctrineCandidate);
const sourceRecords = [];
const evidenceByCategory = new Map();

for (const file of files) {
  const rel = normalizeSlash(path.relative(root, file));
  const safe = readSafe(file);
  const categories = safe.text ? classify(safe.text, rel) : ["metadata_only"];

  const record = {
    path: rel,
    sizeBytes: safe.sizeBytes,
    omitted: safe.omitted,
    sha256: safe.text ? sha256(safe.text) : null,
    categories,
    excerpt: safe.text ? safe.text.slice(0, 1800) : null
  };

  sourceRecords.push(record);

  for (const category of categories) {
    if (!evidenceByCategory.has(category)) evidenceByCategory.set(category, []);
    const evidence = evidenceByCategory.get(category);

    if (evidence.length < 25) {
      evidence.push({
        path: rel,
        sha256: record.sha256,
        excerpt: record.excerpt ? record.excerpt.slice(0, 600) : null
      });
    }
  }
}

const workOrders = Array.from(evidenceByCategory.entries()).map(([category, evidence], index) => {
  const base = workOrderTemplate(category);

  return {
    id: `founder_${category}_${String(index + 1).padStart(3, "0")}`,
    category,
    priority: base.priority,
    riskZone: base.riskZone,
    title: base.title,
    requiredOutcome: base.requiredOutcome,
    evidence,
    status: "ready_for_agent_code_writer",
    approvalRequired: base.riskZone === "Z3" || base.riskZone === "Z4",
    createdAt: new Date().toISOString()
  };
});

const codeTargets = workOrders.map((workOrder) => ({
  workOrderId: workOrder.id,
  category: workOrder.category,
  priority: workOrder.priority,
  riskZone: workOrder.riskZone,
  approvalRequired: workOrder.approvalRequired,
  targetFiles: codeTargetsFor(workOrder.category),
  implementationMode: workOrder.approvalRequired ? "plan_only_until_founder_approval" : "safe_internal_patch_allowed"
}));

const index = {
  ok: true,
  id: "pantavion_founder_doctrine_index_v1",
  generatedAt: new Date().toISOString(),
  sourceCount: sourceRecords.length,
  workOrderCount: workOrders.length,
  rule:
    "Founder doctrine is not static archive. It is converted into executable work orders and code targets.",
  sourceRecords
};

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(docPath), { recursive: true });

fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n", "utf8");
fs.writeFileSync(workOrdersPath, JSON.stringify({ ok: true, workOrders }, null, 2) + "\n", "utf8");
fs.writeFileSync(codeTargetsPath, JSON.stringify({ ok: true, codeTargets }, null, 2) + "\n", "utf8");

const doc = [
  "# Pantavion Founder Doctrine Deep Intake",
  "",
  "This patch turns old Pantavion doctrine, recovery notes, snapshots, archive data and kernel files into work orders and code targets.",
  "",
  "## Totals",
  "",
  `- Sources indexed: ${sourceRecords.length}`,
  `- Work orders: ${workOrders.length}`,
  `- Code targets: ${codeTargets.length}`,
  "",
  "## Rule",
  "",
  "Old files are not ignored and not raw-added blindly. They are analyzed and converted into implementation work orders for Kernel, Agents and Code Writer.",
  "",
  "## Top work orders",
  "",
  ...workOrders.slice(0, 20).map((item) => `- ${item.priority} ${item.id}: ${item.title}`)
].join("\n");

fs.writeFileSync(docPath, doc + "\n", "utf8");

console.log(JSON.stringify({
  ok: true,
  wrote: [
    "data/pantavion-founder-doctrine/founder-doctrine-index.json",
    "data/pantavion-founder-doctrine/founder-doctrine-work-orders.json",
    "data/pantavion-founder-doctrine/founder-doctrine-code-targets.json",
    "docs/continuity/pantavion-founder-doctrine-deep-intake.md"
  ],
  sourceCount: sourceRecords.length,
  workOrderCount: workOrders.length,
  codeTargetCount: codeTargets.length
}, null, 2));
