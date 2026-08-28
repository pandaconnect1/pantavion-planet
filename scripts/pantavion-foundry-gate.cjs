const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "core/kernel/agent-security-policy.ts",
  "core/kernel/pantavion-agent-factory.ts",
  "core/kernel/pantavion-blocker-resolution.ts",
  "core/kernel/pantavion-foundry-workload-planner.ts",
  "core/kernel/pantavion-module-delivery-factory.ts",
  "core/kernel/pantavion-work-order-runtime.ts",
  "core/kernel/pantavion-foundry-runtime.ts",
  "core/kernel/pantavion-foundry-nervous-system-runtime.ts",
  "core/runtime/supabase-durable-execution-store.ts",
  "kernel/foundry-nervous-system.ts",
  "app/api/kernel/work-orders/route.ts",
  "app/api/pantavion/intelligence/cron/route.ts",
  "app/kernel/kernel-work-order-client.tsx",
  "scripts/pantavion-foundry-gate.cjs",
  "scripts/pantavion-kernel-foundry-nervous-system-test.mjs",
  "package.json",
];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

const files = Object.fromEntries(requiredFiles.map((file) => [file, read(file)]));
const fleet = files["core/kernel/pantavion-agent-factory.ts"];
const blockers = files["core/kernel/pantavion-blocker-resolution.ts"];
const planner = files["core/kernel/pantavion-foundry-workload-planner.ts"];
const modules = files["core/kernel/pantavion-module-delivery-factory.ts"];
const runtime = files["core/kernel/pantavion-foundry-runtime.ts"];
const nervousRuntime = files["core/kernel/pantavion-foundry-nervous-system-runtime.ts"];
const nervousPlan = files["kernel/foundry-nervous-system.ts"];
const workOrders = files["core/kernel/pantavion-work-order-runtime.ts"];
const durableStore = files["core/runtime/supabase-durable-execution-store.ts"];
const route = files["app/api/kernel/work-orders/route.ts"];
const cron = files["app/api/pantavion/intelligence/cron/route.ts"];
const panel = files["app/kernel/kernel-work-order-client.tsx"];

for (const marker of [
  "pantavion_owned_agent_fleet_v1",
  "logical_specialists_on_pantavion_owned_runtime",
  "mayCreateOnlyRecordedBoundedPartitions: true",
  "mayUseThirdPartyWorkers: false",
]) {
  if (!fleet.includes(marker)) failures.push(`Agent fleet missing marker: ${marker}`);
}

for (const marker of [
  "pantavion_foundry_workload_plan_v1",
  "recovery_excavation",
  "forbidden_in_control_plane",
  "every_partition_must_have_canonical_record_evidence_and_terminal_status",
  "createPantavionAgentWorkloadAssignment",
]) {
  if (!planner.includes(marker)) failures.push(`Workload planner missing marker: ${marker}`);
}

for (const marker of [
  "pantavion_foundry_blocker_resolution_v1",
  "repair_queued",
  "awaiting_founder_approval",
  "safety_halted",
  "third_party_worker",
  "merge_or_production_deploy",
]) {
  if (!blockers.includes(marker)) failures.push(`Blocker resolution contract missing marker: ${marker}`);
}

for (const marker of [
  "pantavion_module_delivery_cell_v1",
  "pantavion_agent_module_delivery_assignment_v1",
  "backend_live_ui_live_tested_deployed_verified_live",
  "maySendExternalMessages: false",
  "mayBuyMediaOrServices: false",
  "mayPublishPublicCampaign: false",
]) {
  if (!modules.includes(marker)) failures.push(`Module delivery factory missing marker: ${marker}`);
}

for (const marker of [
  "pantavion_foundry_tick_v1",
  "PANTAVION_INTERNAL_AGENT_RUNTIME_OWNERSHIP",
  'ownership !== "pantavion_owned"',
  "externalWorkerAllowed: false",
  "privateDataExportAllowed: false",
  "productionDeployAllowed: false",
  "mergeAllowed: false",
  "unboundedShellAllowed: false",
  "requiredOutputEvidence",
  "blockerProtocol",
  "activateDefinedAgents",
  "queueRepairAgentForResolution",
  "PantavionSupabaseDurableExecutionStore",
  ".claim(",
]) {
  if (!runtime.includes(marker)) failures.push(`Foundry runtime missing marker: ${marker}`);
}

for (const marker of [
  "pantavion_foundry_dependency_plan_v1",
  "PANTAVION_NERVOUS_SYSTEM_DEPENDENCY_BLOCKER",
  "planPantavionFoundryDependencyGate",
  'classifier: ["orchestrator", "sentinel"]',
  "repairer: []",
]) {
  if (!nervousPlan.includes(marker)) failures.push(`Foundry nervous-system plan missing marker: ${marker}`);
}

for (const marker of [
  "pantavion_foundry_nervous_system_tick_v1",
  "pantavion_nervous_system_dependency_wait",
  "pantavion_nervous_system_dependency_released",
  "runPantavionFoundryTick",
  "PantavionSupabaseDurableExecutionStore",
  "dependencyGateRunsBeforeClaim: true",
  'durableWorkerLeaseReassignment: "not_yet_enforced"',
  "externalWorkerAllowed: false",
  "productionDeployAllowed: false",
]) {
  if (!nervousRuntime.includes(marker)) failures.push(`Foundry nervous-system runtime missing marker: ${marker}`);
}

for (const marker of [
  "pantavion_claim_durable_execution",
  "Atomically claims a queued execution",
]) {
  if (!durableStore.includes(marker)) failures.push(`Durable store missing marker: ${marker}`);
}

for (const marker of [
  "PantavionFoundryWorkloadRequest",
  "createPantavionFoundryWorkloadPlan",
  "createPantavionAgentWorkloadAssignment",
  "createPantavionModuleDeliveryCells",
  "createPantavionAgentModuleDeliveryAssignment",
  "thirdPartyWorkerAllowed: false",
  "externalWorkerDependency: false",
]) {
  if (!workOrders.includes(marker)) failures.push(`Work-order runtime missing marker: ${marker}`);
}

for (const marker of [
  "isPantavionKernelFounderRequestAllowed",
  "parseWorkload",
  "recovery_excavation",
  "durable_execution_runtime_unavailable",
]) {
  if (!route.includes(marker)) failures.push(`Founder route missing marker: ${marker}`);
}

if (!cron.includes("runPantavionNervousSystemFoundryTick")) {
  failures.push("Protected scheduler route does not invoke the Nervous-System-gated Foundry tick.");
}
if (cron.includes('from "@/core/kernel/pantavion-foundry-runtime"')) {
  failures.push("Protected scheduler must not bypass the Nervous System with a direct Foundry runtime import.");
}

for (const marker of [
  "Χώρισε ανάκτηση/ταξινόμηση σε εσωτερικές παρτίδες",
  "Κανένας εξωτερικός cloud worker δεν συμμετέχει",
  "workloadPlan",
  "moduleDeliveryCells",
  "Κάθε blocker δημιουργεί αποδεικτικό",
]) {
  if (!panel.includes(marker)) failures.push(`Founder panel missing marker: ${marker}`);
}

const forbidden = [
  [fleet, /mayUseThirdPartyWorkers:\s*true/, "Agent fleet must not authorize third-party workers."],
  [planner, /externalWorkerDependency:\s*true/, "Workload planner must not depend on external workers."],
  [runtime, /externalWorkerAllowed:\s*true/, "Foundry runtime must not authorize external workers."],
  [runtime, /productionDeployAllowed:\s*true/, "Foundry runtime must not authorize production deploy."],
  [runtime, /mergeAllowed:\s*true/, "Foundry runtime must not authorize merge."],
  [runtime, /privateDataExportAllowed:\s*true/, "Foundry runtime must not export private data."],
  [runtime, /unboundedShellAllowed:\s*true/, "Foundry runtime must not authorize unbounded shell."],
  [nervousRuntime, /externalWorkerAllowed:\s*true/, "Nervous System must not authorize external workers."],
  [nervousRuntime, /productionDeployAllowed:\s*true/, "Nervous System must not authorize production deploy."],
  [modules, /maySendExternalMessages:\s*true/, "Module cells must not authorize external messages."],
  [modules, /mayBuyMediaOrServices:\s*true/, "Module cells must not authorize buying media or services."],
  [modules, /mayPublishPublicCampaign:\s*true/, "Module cells must not authorize public campaign publishing."],
];

for (const [source, pattern, message] of forbidden) {
  if (pattern.test(source)) failures.push(message);
}

let packageJson = null;
try {
  packageJson = JSON.parse(files["package.json"]);
} catch {
  failures.push("package.json is not valid JSON.");
}

if (packageJson?.scripts?.["audit:foundry"] !== "node scripts/pantavion-foundry-gate.cjs") {
  failures.push('package.json must include "audit:foundry": "node scripts/pantavion-foundry-gate.cjs".');
}

if (failures.length > 0) {
  console.error("PANTAVION FOUNDRY GATE: FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("PANTAVION FOUNDRY GATE: PASSED");
  console.log("- internal multi-specialist Foundry topology is present");
  console.log("- durable dependency gating runs before the existing atomic execution claim");
  console.log("- recovery work is bounded into deterministic internal partitions");
  console.log("- no third-party workers, merge, deploy, secrets, private-data export, or unbounded shell are authorized");
  console.log("- durable claim and evidence requirements are present");
}
