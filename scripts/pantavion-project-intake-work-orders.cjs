const fs = require("fs");
const path = require("path");

const root = process.cwd();
const inventoryPath = path.join(root, "exports", "project-intake", "local-project-inventory.json");

if (!fs.existsSync(inventoryPath)) {
  console.error("Missing local inventory.");
  console.error("Run first: node scripts\\pantavion-project-intake-inventory.cjs --write");
  process.exit(1);
}

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));

function slug(value) {
  return String(value || "unknown")
    .replace(/\\/g, "/")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/\/+/g, "/")
    .replace(/-+/g, "-")
    .replace(/^\/|\/$/g, "")
    .toLowerCase();
}

function priorityFor(item) {
  if (item.risk === "critical") return "p0_critical";
  if (item.risk === "high") return "p1_high";
  if ((item.signals || []).includes("has_provider_need")) return "p1_high";
  if ((item.signals || []).includes("needs_work_order")) return "p2_medium";
  return "p3_low";
}

function kindFor(item) {
  const signals = item.signals || [];

  if (signals.includes("has_protected_scope")) return "protected_scope_review";
  if (signals.includes("has_provider_need")) return "provider_integration";
  if (item.kind === "api_route") return "api_completion";
  if (item.kind === "page_route") return "route_completion";
  if (item.kind === "kernel_file") return "kernel_contract_completion";
  if ((item.mappedCapabilityIds || []).length === 0) return "capability_mapping_review";

  return "realness_repair";
}

function titleFor(item, kind) {
  const target = item.route || item.path;

  if (kind === "protected_scope_review") return `Protected scope review for ${target}`;
  if (kind === "provider_integration") return `Provider integration work order for ${target}`;
  if (kind === "api_completion") return `Complete API route ${target}`;
  if (kind === "route_completion") return `Complete real route ${target}`;
  if (kind === "kernel_contract_completion") return `Complete kernel contract for ${target}`;
  if (kind === "capability_mapping_review") return `Classify unmapped item ${target}`;

  return `Repair realness gaps for ${target}`;
}

function founderApprovalRequired(item) {
  const signals = item.signals || [];
  return (
    item.risk === "critical" ||
    item.risk === "high" ||
    signals.includes("has_protected_scope") ||
    /water|dwg|dxf|sos|auth|access|admin|security|identity|secret/i.test(item.path)
  );
}

function requiredActionsFor(item, kind) {
  const actions = [
    "Read existing file and related capability registry before making changes.",
    "Map the item to Pantavion Universal Life capability and autonomous kernel.",
    "Do not create fake buttons or public-live claims.",
    "Use shared common services instead of local duplicate systems."
  ];

  const signals = item.signals || [];

  if (kind === "route_completion") {
    actions.push("Verify route has real UI, state, loading, empty and error states.");
  }

  if (kind === "api_completion") {
    actions.push("Verify API has auth, permissions, validation, error handling and safe response shape.");
  }

  if (signals.includes("has_provider_need")) {
    actions.push("Define provider, cost, fallback, environment variables and failure behavior before live use.");
  }

  if (signals.includes("has_static_signal") || signals.includes("has_prototype_signal")) {
    actions.push("Convert prototype/static behavior into real implementation or mark explicitly as beta/disabled.");
  }

  if (signals.includes("has_protected_scope")) {
    actions.push("Require founder review before production change.");
    actions.push("Protect users, access records, Water data, SOS safety flows and private infrastructure.");
  }

  return actions;
}

function acceptanceCriteriaFor(item) {
  const criteria = [
    "No fake public action.",
    "No dead button presented as live.",
    "No protected path modified outside approved scope.",
    "npm run build passes.",
    "npx tsc --noEmit passes.",
    "Founder report produced if risk is high or critical."
  ];

  if (item.kind === "page_route") {
    criteria.push("Route renders successfully and has clear status: live, beta, foundation, planned or disabled.");
  }

  if (item.kind === "api_route") {
    criteria.push("API route has safe error handling and permission boundary.");
  }

  if ((item.signals || []).includes("has_provider_need")) {
    criteria.push("Provider dependency is declared with cost/fallback/failure policy.");
  }

  return criteria;
}

function safetyNotesFor(item) {
  const notes = [];

  if ((item.signals || []).includes("has_protected_scope")) {
    notes.push("Protected scope: no blind patching, no raw private data exposure, no public leak.");
  }

  if (/water|dwg|dxf/i.test(item.path)) {
    notes.push("Water/DWG rule: preserve source exactly; do not transform, filter, simplify or expose raw source.");
  }

  if (/sos|elder|care|health/i.test(item.path)) {
    notes.push("Safety/care rule: no false emergency, medical or authority-dispatch claims.");
  }

  if (/secret|token|auth|identity|security/i.test(item.path)) {
    notes.push("Security rule: do not expose secrets, tokens, identity data or internal security structure.");
  }

  if (notes.length === 0) {
    notes.push("Standard Pantavion realness and safety gates apply.");
  }

  return notes;
}

const candidates = inventory.items.filter((item) => {
  const signals = item.signals || [];

  return (
    signals.includes("needs_work_order") ||
    signals.includes("has_provider_need") ||
    signals.includes("has_protected_scope") ||
    item.risk === "critical" ||
    item.risk === "high" ||
    (item.mappedCapabilityIds || []).length === 0
  );
});

const workOrders = candidates.map((item, index) => {
  const kind = kindFor(item);
  const approvalRequired = founderApprovalRequired(item);

  return {
    workOrderId: `wo-${String(index + 1).padStart(5, "0")}-${slug(item.route || item.path).replace(/\//g, "-")}`,
    title: titleFor(item, kind),
    kind,
    priority: priorityFor(item),
    sourcePath: item.path,
    route: item.route,
    risk: item.risk,
    mappedCapabilityIds: item.mappedCapabilityIds || [],
    signals: item.signals || [],
    founderApprovalRequired: approvalRequired,
    productionChangeAllowedWithoutFounder: false,
    requiredActions: requiredActionsFor(item, kind),
    acceptanceCriteria: acceptanceCriteriaFor(item),
    safetyNotes: safetyNotesFor(item)
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  sourceGeneratedAt: inventory.generatedAt,
  totalWorkOrders: workOrders.length,
  byPriority: workOrders.reduce((acc, order) => {
    acc[order.priority] = (acc[order.priority] || 0) + 1;
    return acc;
  }, {}),
  byKind: workOrders.reduce((acc, order) => {
    acc[order.kind] = (acc[order.kind] || 0) + 1;
    return acc;
  }, {}),
  founderApprovalRequired: workOrders.filter((order) => order.founderApprovalRequired).length,
  workOrders
};

console.log("Pantavion Project Intake Work Order Generator");
console.log("--------------------------------------------");
console.log(`Generated: ${report.generatedAt}`);
console.log(`Total work orders: ${report.totalWorkOrders}`);
console.log(`Founder approval required: ${report.founderApprovalRequired}`);
console.log("");

console.log("By priority:");
for (const [priority, count] of Object.entries(report.byPriority)) {
  console.log(`- ${priority}: ${count}`);
}

console.log("");
console.log("Top work orders:");
for (const order of workOrders.slice(0, 25)) {
  console.log(`- [${order.priority}] ${order.title}`);
  console.log(`  kind: ${order.kind}`);
  console.log(`  risk: ${order.risk}`);
  console.log(`  founderApprovalRequired: ${order.founderApprovalRequired}`);
  if (order.route) console.log(`  route: ${order.route}`);
  if (order.mappedCapabilityIds.length > 0) {
    console.log(`  capabilities: ${order.mappedCapabilityIds.join(", ")}`);
  }
}

const outDir = path.join(root, "exports", "project-intake");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "local-work-orders.json");
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("");
console.log("Wrote exports/project-intake/local-work-orders.json");
console.log("This file is local-only and ignored by git.");
