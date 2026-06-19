const fs = require("fs");
const path = require("path");

const root = process.cwd();
const workOrdersPath = path.join(root, "exports", "project-intake", "local-work-orders.json");

if (!fs.existsSync(workOrdersPath)) {
  console.error("Missing local work orders.");
  console.error("Run first:");
  console.error("node scripts\\pantavion-project-intake-inventory.cjs --write");
  console.error("node scripts\\pantavion-project-intake-work-orders.cjs");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(workOrdersPath, "utf8"));
const orders = report.workOrders || [];

const priorityWeight = {
  p0_critical: 0,
  p1_high: 1,
  p2_medium: 2,
  p3_low: 3
};

const kindWeight = {
  protected_scope_review: 0,
  provider_integration: 1,
  api_completion: 2,
  route_completion: 3,
  realness_repair: 4,
  kernel_contract_completion: 5,
  capability_mapping_review: 6
};

function laneFor(order) {
  const text = `${order.sourcePath || ""} ${order.route || ""} ${order.title || ""}`.toLowerCase();

  if (
    order.founderApprovalRequired ||
    order.risk === "critical" ||
    text.includes("water") ||
    text.includes("dwg") ||
    text.includes("dxf") ||
    text.includes("sos") ||
    text.includes("auth") ||
    text.includes("access") ||
    text.includes("admin") ||
    text.includes("security") ||
    text.includes("identity") ||
    text.includes("secret")
  ) {
    if (order.kind === "provider_integration") return "provider_decision";
    if (order.kind === "api_completion") return "api_completion";
    return "founder_gate";
  }

  if (order.kind === "protected_scope_review") return "protected_scope";
  if (order.kind === "provider_integration") return "provider_decision";
  if (order.kind === "api_completion") return "api_completion";
  if (order.kind === "route_completion" || order.kind === "realness_repair") return "route_realness";
  if (order.kind === "kernel_contract_completion") return "kernel_contract";
  if (order.kind === "capability_mapping_review") return "capability_classification";

  return "safe_autonomous_candidate";
}

function recommendedModeFor(order, lane) {
  if (lane === "founder_gate" || lane === "protected_scope") return "manual_protected_review";
  if (order.founderApprovalRequired) return "founder_review_only";
  if (lane === "provider_decision" || lane === "api_completion") return "kernel_supervised_draft";
  return "isolated_autonomous_draft";
}

function reasonFor(order, lane) {
  if (lane === "founder_gate") {
    return "High/critical or sensitive scope. No production change without founder review.";
  }

  if (lane === "protected_scope") {
    return "Protected module. Requires scoped inspection, audit and founder approval.";
  }

  if (lane === "provider_decision") {
    return "Provider/cost/env dependency detected. Needs provider policy before live implementation.";
  }

  if (lane === "api_completion") {
    return "API route needs auth, validation, error handling and safe response contract.";
  }

  if (lane === "route_realness") {
    return "Public route/static/prototype signal detected. Must pass realness gate before live claim.";
  }

  if (lane === "kernel_contract") {
    return "Kernel file needs contract completion and governance alignment.";
  }

  if (lane === "capability_classification") {
    return "No strong capability mapping detected. Needs Project Intake classification.";
  }

  return "Safe non-protected candidate for isolated autonomous drafting.";
}

function rankOrders(input) {
  return [...input].sort((a, b) => {
    const pa = priorityWeight[a.priority] ?? 9;
    const pb = priorityWeight[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;

    const ka = kindWeight[a.kind] ?? 9;
    const kb = kindWeight[b.kind] ?? 9;
    if (ka !== kb) return ka - kb;

    if (a.founderApprovalRequired !== b.founderApprovalRequired) {
      return a.founderApprovalRequired ? -1 : 1;
    }

    return String(a.title).localeCompare(String(b.title));
  });
}

const prioritized = rankOrders(orders).map((order, index) => {
  const lane = laneFor(order);

  return {
    rank: index + 1,
    lane,
    workOrderId: order.workOrderId,
    title: order.title,
    priority: order.priority,
    kind: order.kind,
    risk: order.risk,
    route: order.route,
    mappedCapabilityIds: order.mappedCapabilityIds || [],
    founderApprovalRequired: Boolean(order.founderApprovalRequired),
    recommendedMode: recommendedModeFor(order, lane),
    reason: reasonFor(order, lane)
  };
});

function byLane(lane) {
  return prioritized.filter((order) => order.lane === lane);
}

const plan = {
  generatedAt: new Date().toISOString(),
  sourceGeneratedAt: report.generatedAt,
  totalWorkOrders: prioritized.length,
  founderGate: byLane("founder_gate").length,
  protectedScope: byLane("protected_scope").length,
  providerDecision: byLane("provider_decision").length,
  safeAutonomousCandidates: prioritized.filter(
    (order) =>
      !order.founderApprovalRequired &&
      order.recommendedMode === "isolated_autonomous_draft"
  ).length,
  routeRealness: byLane("route_realness").length,
  apiCompletion: byLane("api_completion").length,
  kernelContracts: byLane("kernel_contract").length,
  topFounderReview: byLane("founder_gate").slice(0, 20),
  topSafeAutonomous: prioritized
    .filter((order) => order.recommendedMode === "isolated_autonomous_draft")
    .slice(0, 20),
  topProviderDecisions: byLane("provider_decision").slice(0, 20),
  topRouteRealness: byLane("route_realness").slice(0, 20)
};

console.log("Pantavion Work Order Priority Plan");
console.log("----------------------------------");
console.log(`Generated: ${plan.generatedAt}`);
console.log(`Total work orders: ${plan.totalWorkOrders}`);
console.log(`Founder gate: ${plan.founderGate}`);
console.log(`Protected scope: ${plan.protectedScope}`);
console.log(`Provider decisions: ${plan.providerDecision}`);
console.log(`API completion: ${plan.apiCompletion}`);
console.log(`Route realness: ${plan.routeRealness}`);
console.log(`Safe autonomous candidates: ${plan.safeAutonomousCandidates}`);
console.log("");

console.log("Top founder review:");
for (const order of plan.topFounderReview.slice(0, 10)) {
  console.log(`- [${order.priority}] ${order.kind} | ${order.title}`);
  console.log(`  mode: ${order.recommendedMode}`);
  console.log(`  reason: ${order.reason}`);
}

console.log("");
console.log("Top safe autonomous candidates:");
for (const order of plan.topSafeAutonomous.slice(0, 10)) {
  console.log(`- [${order.priority}] ${order.kind} | ${order.title}`);
  console.log(`  mode: ${order.recommendedMode}`);
  console.log(`  reason: ${order.reason}`);
}

console.log("");
console.log("Top provider decisions:");
for (const order of plan.topProviderDecisions.slice(0, 10)) {
  console.log(`- [${order.priority}] ${order.kind} | ${order.title}`);
  console.log(`  reason: ${order.reason}`);
}

const outDir = path.join(root, "exports", "project-intake");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "local-priority-plan.json"),
  JSON.stringify(plan, null, 2) + "\n",
  "utf8"
);

console.log("");
console.log("Wrote exports/project-intake/local-priority-plan.json");
console.log("This file is local-only and ignored by git.");
