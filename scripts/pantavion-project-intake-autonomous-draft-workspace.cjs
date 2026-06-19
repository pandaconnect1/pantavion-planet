const fs = require("fs");
const path = require("path");

const root = process.cwd();
const dispatchPath = path.join(root, "exports", "project-intake", "local-autonomous-dispatch.json");

if (!fs.existsSync(dispatchPath)) {
  console.error("Missing local autonomous dispatch report.");
  console.error("Run first:");
  console.error("node scripts\\pantavion-project-intake-inventory.cjs --write");
  console.error("node scripts\\pantavion-project-intake-work-orders.cjs");
  console.error("node scripts\\pantavion-project-intake-prioritize-work-orders.cjs");
  console.error("node scripts\\pantavion-project-intake-autonomous-dispatch.cjs");
  process.exit(1);
}

const dispatchReport = JSON.parse(fs.readFileSync(dispatchPath, "utf8"));
const dispatchItems = dispatchReport.dispatchItems || [];

function modeFor(item) {
  if (item.decision === "allow_isolated_autonomous_draft") {
    return "isolated_autonomous_draft";
  }

  if (item.decision === "require_kernel_supervised_draft") {
    return "kernel_supervised_draft";
  }

  return null;
}

function statusFor(item, mode) {
  if (!mode) return "blocked";
  if (mode === "kernel_supervised_draft") return "waiting_for_kernel_supervision";
  return "ready_for_patch_writer";
}

function requiredArtifactsFor(item, mode) {
  const artifacts = [
    "scope-summary.md",
    "proposed.patch",
    "risk-report.md",
    "build-result.txt",
    "tsc-result.txt",
    "founder-diff-summary.md"
  ];

  if (mode === "kernel_supervised_draft") {
    artifacts.push("kernel-supervision-notes.md");
  }

  if (item.route) {
    artifacts.push("route-realness-check.md");
  }

  if (item.kind === "api_completion") {
    artifacts.push("api-contract-check.md");
  }

  return artifacts;
}

function blockedRulesFor(item) {
  const rules = [
    "Never deploy production automatically.",
    "Never use git add .",
    "Never expose exports/project-intake local JSON.",
    "Never present a fake route or fake button as live.",
    "Never modify protected Water/SOS/Security/Identity scope without founder approval."
  ];

  if (item.decision !== "allow_isolated_autonomous_draft") {
    rules.push("Direct source mutation is blocked until Kernel/Founder gate allows a scoped patch.");
  }

  if (item.founderApprovalRequired) {
    rules.push("Founder approval is required before any source change.");
  }

  return rules;
}

const workspaceItems = dispatchItems
  .map((item, index) => {
    const mode = modeFor(item);
    const status = statusFor(item, mode);

    return {
      workspaceId: `draft-workspace-${String(index + 1).padStart(5, "0")}`,
      dispatchId: item.dispatchId,
      workOrderId: item.workOrderId,
      title: item.title,
      mode,
      status,
      route: item.route,
      priority: item.priority,
      kind: item.kind,
      risk: item.risk,
      mappedCapabilityIds: item.mappedCapabilityIds || [],
      allowedToCreatePatchDraft: Boolean(mode),
      allowedToWriteSourceDirectly: false,
      allowedToRunBuild: Boolean(mode),
      allowedToRunTypecheck: Boolean(mode),
      allowedToPrepareCommit: false,
      allowedToDeployProduction: false,
      requiredArtifacts: requiredArtifactsFor(item, mode),
      blockedRules: blockedRulesFor(item),
      founderReportRequired: true
    };
  })
  .filter((item) => item.allowedToCreatePatchDraft || item.status === "blocked");

const report = {
  generatedAt: new Date().toISOString(),
  sourceGeneratedAt: dispatchReport.generatedAt,
  totalWorkspaceItems: workspaceItems.length,
  readyForPatchWriter: workspaceItems.filter((item) => item.status === "ready_for_patch_writer").length,
  waitingForKernelSupervision: workspaceItems.filter((item) => item.status === "waiting_for_kernel_supervision").length,
  blocked: workspaceItems.filter((item) => item.status === "blocked").length,
  workspaceItems
};

console.log("Pantavion Autonomous Draft Workspace");
console.log("------------------------------------");
console.log(`Generated: ${report.generatedAt}`);
console.log(`Total workspace items: ${report.totalWorkspaceItems}`);
console.log(`Ready for patch writer: ${report.readyForPatchWriter}`);
console.log(`Waiting for Kernel supervision: ${report.waitingForKernelSupervision}`);
console.log(`Blocked: ${report.blocked}`);
console.log("");

console.log("Ready for patch writer:");
for (const item of workspaceItems.filter((entry) => entry.status === "ready_for_patch_writer").slice(0, 10)) {
  console.log(`- [${item.priority}] ${item.title}`);
  console.log(`  mode: ${item.mode}`);
  if (item.route) console.log(`  route: ${item.route}`);
}

console.log("");
console.log("Waiting for Kernel supervision:");
for (const item of workspaceItems.filter((entry) => entry.status === "waiting_for_kernel_supervision").slice(0, 10)) {
  console.log(`- [${item.priority}] ${item.title}`);
  console.log(`  kind: ${item.kind}`);
  if (item.route) console.log(`  route: ${item.route}`);
}

const outDir = path.join(root, "exports", "project-intake");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "local-autonomous-draft-workspace.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log("");
console.log("Wrote exports/project-intake/local-autonomous-draft-workspace.json");
console.log("This file is local-only and ignored by git.");
