export type PantavionSupervisorRiskZone = "Z1" | "Z2" | "Z3" | "Z4";
export type PantavionSupervisorPriority = "P0" | "P1" | "P2" | "P3";

export type PantavionImplementationSlice = {
  id: string;
  workOrderId?: string;
  title?: string;
  priority?: PantavionSupervisorPriority;
  riskZone?: PantavionSupervisorRiskZone;
  approvalRequired?: boolean;
  implementationMode?: string;
  targetFiles?: string[];
  requiredChecks?: string[];
  nextAction?: string;
  truthRule?: string;
};

export type PantavionSupervisorReport = {
  ok: true;
  id: string;
  generatedAt: string;
  status: "supervisor_report";
  repo: {
    clean: boolean;
    head: string;
    branch: string;
  };
  summary: {
    totalSlices: number;
    safeInternalSlices: number;
    approvalRequiredSlices: number;
    completedTargetSlices: number;
    pendingTargetSlices: number;
  };
  nextSafeSlice: PantavionImplementationSlice | null;
  approvalQueue: PantavionImplementationSlice[];
  blockedActions: string[];
  executionRules: string[];
  nextPatchRecommendation: string;
};

export const PANTAVION_AGENT_SUPERVISOR_ID =
  "pantavion_agent_supervisor_work_order_executor_v1";

function priorityScore(priority: string | undefined): number {
  if (priority === "P0") return 0;
  if (priority === "P1") return 1;
  if (priority === "P2") return 2;
  return 3;
}

function riskScore(zone: string | undefined): number {
  if (zone === "Z1") return 0;
  if (zone === "Z2") return 1;
  if (zone === "Z3") return 2;
  return 3;
}

function isSafeInternal(slice: PantavionImplementationSlice): boolean {
  return (
    slice.approvalRequired !== true &&
    (slice.riskZone === "Z1" || slice.riskZone === "Z2")
  );
}

function targetsComplete(
  slice: PantavionImplementationSlice,
  existingFiles: Set<string>
): boolean {
  const targets = Array.isArray(slice.targetFiles) ? slice.targetFiles : [];

  if (targets.length === 0) return false;

  return targets.every((target) => existingFiles.has(target.replace(/\\/g, "/")));
}

export function createPantavionAgentSupervisorReport(input: {
  slices: PantavionImplementationSlice[];
  existingFiles: string[];
  gitStatusShort?: string;
  gitHead?: string;
  gitBranch?: string;
}): PantavionSupervisorReport {
  const existingFiles = new Set(input.existingFiles.map((file) => file.replace(/\\/g, "/")));

  const slices = [...input.slices].sort((a, b) => {
    const priorityDelta = priorityScore(a.priority) - priorityScore(b.priority);
    if (priorityDelta !== 0) return priorityDelta;

    const riskDelta = riskScore(a.riskZone) - riskScore(b.riskZone);
    if (riskDelta !== 0) return riskDelta;

    return String(a.id).localeCompare(String(b.id));
  });

  const approvalQueue = slices.filter((slice) => slice.approvalRequired === true);
  const safeInternal = slices.filter(isSafeInternal);
  const completedTargetSlices = slices.filter((slice) => targetsComplete(slice, existingFiles));
  const pendingSafe = safeInternal.filter((slice) => !targetsComplete(slice, existingFiles));

  const nextSafeSlice = pendingSafe[0] || safeInternal[0] || null;

  return {
    ok: true,
    id: PANTAVION_AGENT_SUPERVISOR_ID,
    generatedAt: new Date().toISOString(),
    status: "supervisor_report",
    repo: {
      clean: !String(input.gitStatusShort || "").trim(),
      head: input.gitHead || "unknown",
      branch: input.gitBranch || "unknown"
    },
    summary: {
      totalSlices: slices.length,
      safeInternalSlices: safeInternal.length,
      approvalRequiredSlices: approvalQueue.length,
      completedTargetSlices: completedTargetSlices.length,
      pendingTargetSlices: Math.max(0, slices.length - completedTargetSlices.length)
    },
    nextSafeSlice,
    approvalQueue: approvalQueue.slice(0, 20),
    blockedActions: [
      "No blanket git add.",
      "No force push.",
      "No production deploy without founder approval.",
      "No secrets in committed files.",
      "No billing/auth/user-data/DWG/source-truth/SOS production action without founder approval."
    ],
    executionRules: [
      "Z1 can become automatic after green checks.",
      "Z2 can produce safe internal patches and preview plans.",
      "Z3 requires founder approval.",
      "Z4 remains blocked/manual only.",
      "Every implementation must include route, state or data, audit and verification."
    ],
    nextPatchRecommendation:
      "Patch 10 should add Safe Patch Writer for the selected Z1/Z2 implementation slice."
  };
}
