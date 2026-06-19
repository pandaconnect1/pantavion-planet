const fs = require("fs");
const path = require("path");

const root = process.cwd();
const priorityPlanPath = path.join(root, "exports", "project-intake", "local-priority-plan.json");

if (!fs.existsSync(priorityPlanPath)) {
  console.error("Missing local priority plan.");
  console.error("Run first:");
  console.error("node scripts\\pantavion-project-intake-inventory.cjs --write");
  console.error("node scripts\\pantavion-project-intake-work-orders.cjs");
  console.error("node scripts\\pantavion-project-intake-prioritize-work-orders.cjs");
  process.exit(1);
}

const plan = JSON.parse(fs.readFileSync(priorityPlanPath, "utf8"));

const allOrders = [
  ...(plan.topFounderReview || []),
  ...(plan.topSafeAutonomous || []),
  ...(plan.topProviderDecisions || []),
  ...(plan.topRouteRealness || [])
];

const byId = new Map();
for (const order of allOrders) {
  if (!byId.has(order.workOrderId)) {
    byId.set(order.workOrderId, order);
  }
}

function isProtectedText(order) {
  const text = `${order.title || ""} ${order.route || ""} ${(order.mappedCapabilityIds || []).join(" ")}`.toLowerCase();

  return (
    text.includes("water") ||
    text.includes("dwg") ||
    text.includes("dxf") ||
    text.includes("sos") ||
    text.includes("emergency") ||
    text.includes("health") ||
    text.includes("admin") ||
    text.includes("access") ||
    text.includes("auth") ||
    text.includes("identity") ||
    text.includes("security") ||
    text.includes("secret")
  );
}

function decisionFor(order) {
  if (order.founderApprovalRequired && isProtectedText(order)) {
    return "block_protected_scope";
  }

  if (order.founderApprovalRequired) {
    return "block_founder_review";
  }

  if (order.lane === "provider_decision" || order.kind === "provider_integration") {
    return "require_provider_decision";
  }

  if (order.lane === "api_completion") {
    return "require_kernel_supervised_draft";
  }

  if (order.lane === "capability_classification") {
    return "require_capability_classification";
  }

  if (order.recommendedMode === "isolated_autonomous_draft") {
    return "allow_isolated_autonomous_draft";
  }

  return "require_kernel_supervised_draft";
}

function humanActionFor(decision) {
  if (decision === "block_protected_scope") {
    return "Founder must review protected scope before any code patch.";
  }

  if (decision === "block_founder_review") {
    return "Founder approval required before implementation.";
  }

  if (decision === "require_provider_decision") {
    return "Define provider, cost, env variables, fallback and legal boundary.";
  }

  if (decision === "require_capability_classification") {
    return "Classify capability and kernel ownership before drafting code.";
  }

  if (decision === "require_kernel_supervised_draft") {
    return "Kernel may draft only with scoped test/build gate and no production deploy.";
  }

  return "Autonomous kernel may draft isolated local patch, run tests, and prepare founder-visible report.";
}

function reasonFor(order, decision) {
  if (decision === "allow_isolated_autonomous_draft") {
    return "Non-protected route/work item can be drafted locally under realness gate.";
  }

  if (decision === "require_kernel_supervised_draft") {
    return "API/kernel-sensitive item needs stronger supervision before code changes.";
  }

  if (decision === "require_provider_decision") {
    return "Provider dependency must be resolved before live implementation.";
  }

  if (decision === "block_protected_scope") {
    return "Protected or sensitive area detected. No autonomous mutation.";
  }

  if (decision === "block_founder_review") {
    return "Founder gate required by priority/risk.";
  }

  return "Capability ownership is not sufficiently classified.";
}

const dispatchItems = Array.from(byId.values()).map((order, index) => {
  const decision = decisionFor(order);
  const allowedToDraftCode = decision === "allow_isolated_autonomous_draft";
  const allowedToRunTests =
    decision === "allow_isolated_autonomous_draft" ||
    decision === "require_kernel_supervised_draft";

  return {
    dispatchId: `dispatch-${String(index + 1).padStart(5, "0")}`,
    workOrderId: order.workOrderId,
    title: order.title,
    lane: order.lane,
    priority: order.priority,
    kind: order.kind,
    risk: order.risk,
    route: order.route,
    mappedCapabilityIds: order.mappedCapabilityIds || [],
    founderApprovalRequired: Boolean(order.founderApprovalRequired),
    recommendedMode: order.recommendedMode,
    decision,
    allowedToDraftCode,
    allowedToRunTests,
    allowedToPrepareCommit: false,
    allowedToDeployProduction: false,
    requiredHumanAction: humanActionFor(decision),
    kernelReason: reasonFor(order, decision)
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  sourceGeneratedAt: plan.generatedAt,
  totalItems: dispatchItems.length,
  autonomousDraftAllowed: dispatchItems.filter((item) => item.decision === "allow_isolated_autonomous_draft").length,
  kernelSupervisedRequired: dispatchItems.filter((item) => item.decision === "require_kernel_supervised_draft").length,
  founderBlocked: dispatchItems.filter((item) => item.decision === "block_founder_review").length,
  protectedBlocked: dispatchItems.filter((item) => item.decision === "block_protected_scope").length,
  providerDecisionRequired: dispatchItems.filter((item) => item.decision === "require_provider_decision").length,
  classificationRequired: dispatchItems.filter((item) => item.decision === "require_capability_classification").length,
  dispatchItems
};

console.log("Pantavion Autonomous Dispatch Gate");
console.log("----------------------------------");
console.log(`Generated: ${report.generatedAt}`);
console.log(`Total dispatch items: ${report.totalItems}`);
console.log(`Autonomous draft allowed: ${report.autonomousDraftAllowed}`);
console.log(`Kernel supervised required: ${report.kernelSupervisedRequired}`);
console.log(`Founder blocked: ${report.founderBlocked}`);
console.log(`Protected blocked: ${report.protectedBlocked}`);
console.log(`Provider decision required: ${report.providerDecisionRequired}`);
console.log(`Classification required: ${report.classificationRequired}`);
console.log("");

console.log("Allowed autonomous drafts:");
for (const item of dispatchItems.filter((entry) => entry.allowedToDraftCode).slice(0, 10)) {
  console.log(`- [${item.priority}] ${item.title}`);
  console.log(`  decision: ${item.decision}`);
  console.log(`  reason: ${item.kernelReason}`);
}

console.log("");
console.log("Blocked / founder-gated:");
for (const item of dispatchItems.filter((entry) => !entry.allowedToDraftCode).slice(0, 10)) {
  console.log(`- [${item.priority}] ${item.title}`);
  console.log(`  decision: ${item.decision}`);
  console.log(`  required: ${item.requiredHumanAction}`);
}

const outDir = path.join(root, "exports", "project-intake");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "local-autonomous-dispatch.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log("");
console.log("Wrote exports/project-intake/local-autonomous-dispatch.json");
console.log("This file is local-only and ignored by git.");
