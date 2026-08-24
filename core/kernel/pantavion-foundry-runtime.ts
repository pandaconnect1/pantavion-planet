import "server-only";

import {
  appendCheckpoint,
  type PantavionDurableExecutionRecord,
} from "@/core/runtime/durable-execution";
import { PantavionSupabaseDurableExecutionStore } from "@/core/runtime/supabase-durable-execution-store";
import { PANTAVION_OWNED_AGENT_TASK_NAME } from "./pantavion-work-order-runtime";
import {
  createPantavionFoundryBlockerResolution,
  type PantavionFoundryBlockerKind,
  type PantavionFoundryBlockerResolution,
} from "./pantavion-blocker-resolution";
import {
  isPantavionModuleId,
  type PantavionAgentModuleDeliveryAssignment,
} from "./pantavion-module-delivery-factory";
import { isPantavionEcosystemServiceId } from "./pantavion-ecosystem-cell-factory";
import type { PantavionOwnedAgentRole } from "./pantavion-agent-factory";
import type { PantavionAgentWorkloadAssignment } from "./pantavion-foundry-workload-planner";

const MAX_AGENTS_PER_TICK = 3;
const INTERNAL_AGENT_TIMEOUT_MS = 45_000;

type MaterializedAgent = {
  id: string;
  workOrderId: string;
  role: PantavionOwnedAgentRole;
  state: "defined" | "ready_for_internal_runtime" | "blocked";
  purpose: string;
  internalCapabilities: string[];
  allowedTargetFiles: string[];
  maxRuntimeSeconds: number;
  maxAttempts: number;
  blockers: string[];
};

type AgentExecutionInput = {
  marker: "pantavion_owned_agent_execution_v1";
  parentWorkOrderId: string;
  founderIntent?: string;
  agent: MaterializedAgent;
  agentSecurity: {
    mode: string;
    allowedAuthorities: string[];
    stopConditions: string[];
  };
  ecosystemCell: {
    marker: string;
    target: string;
    requiredServiceIds: string[];
  };
  workload: PantavionAgentWorkloadAssignment;
  moduleDelivery: PantavionAgentModuleDeliveryAssignment;
};

type PantavionInternalAgentEvidence = {
  kind: "source_reference" | "classification_record" | "canonical_record" | "audit" | "test" | "runtime_check";
  reference: string;
  outcome: "recorded" | "passed" | "blocked";
};

type PantavionInternalAgentBlocker = {
  id: string;
  kind: PantavionFoundryBlockerKind;
  summary: string;
};

type PantavionInternalAgentRuntimeOutput = {
  summary: string;
  nextActions: string[];
  evidence: PantavionInternalAgentEvidence[];
  blockers: PantavionInternalAgentBlocker[];
};

export interface PantavionFoundryTickReport {
  marker: "pantavion_foundry_tick_v1";
  status: "ran" | "blocked" | "degraded";
  durableStore: "available" | "unavailable";
  internalRuntime:
    | "pantavion_owned_internal_runtime"
    | "not_configured";
  scannedAgents: number;
  queuedAgents: number;
  attemptedAgents: number;
  succeededAgents: number;
  failedAgents: number;
  retriedAgents: number;
  skippedAgents: number;
  activatedAgents: number;
  repairAgentsQueued: number;
  checkedAt: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asStringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;
}

const SENSITIVE_RUNTIME_TEXT_PATTERNS = [
  /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/i,
  /\b(?:sk|sb_secret)_[a-zA-Z0-9_-]{12,}\b/,
  /\b(?:authorization|cookie|set-cookie)\s*[:=]\s*(?:bearer\s+)?[^\s]{8,}/i,
  /\bservice_role\s*[:=]\s*[^\s]{8,}/i,
];

function isSafeRuntimeText(value: string, maxLength: number): boolean {
  const normalized = value.trim();
  return (
    normalized.length > 0 &&
    normalized.length <= maxLength &&
    !normalized.includes("\u0000") &&
    !SENSITIVE_RUNTIME_TEXT_PATTERNS.some((pattern) => pattern.test(normalized))
  );
}

function isSafeAgentTargetFile(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 240 &&
    !value.startsWith("/") &&
    !value.startsWith(".") &&
    !value.includes("\\") &&
    !value.includes("..") &&
    /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9._-]+$/.test(value)
  );
}

const OWNED_AGENT_ROLES = new Set<PantavionAgentWorkloadAssignment["assignedRole"]>([
  "orchestrator",
  "sentinel",
  "classifier",
  "planner",
  "researcher",
  "builder",
  "auditor",
  "verifier",
  "repairer",
  "memory_guard",
]);

const WORKLOAD_STAGE_IDS = new Set<PantavionAgentWorkloadAssignment["ownedStages"][number]>([
  "inventory",
  "classification",
  "canonicalization",
  "evidence_and_dependencies",
  "implementation_planning",
  "scoped_build",
  "audit_and_verification",
  "repair_queue",
]);

function parseWorkloadAssignment(value: unknown): PantavionAgentWorkloadAssignment | null {
  const root = asRecord(value);
  const partitionContract = asRecord(root?.partitionContract);
  const ownedStages = asStringList(root?.ownedStages);
  const assignedRole = typeof root?.assignedRole === "string" ? root.assignedRole : "";
  const unitCount = typeof root?.unitCount === "number" ? root.unitCount : 0;
  const batchSize = typeof partitionContract?.batchSize === "number" ? partitionContract.batchSize : 0;
  const batchCount = typeof partitionContract?.batchCount === "number" ? partitionContract.batchCount : 0;

  if (
    root?.marker !== "pantavion_agent_workload_assignment_v1" ||
    typeof root.workOrderId !== "string" ||
    (root.workloadKind !== "single_work_order" && root.workloadKind !== "recovery_excavation") ||
    !Number.isInteger(unitCount) ||
    unitCount < 1 ||
    unitCount > 100_000 ||
    !OWNED_AGENT_ROLES.has(assignedRole as PantavionAgentWorkloadAssignment["assignedRole"]) ||
    !ownedStages ||
    !ownedStages.every((stage) => WORKLOAD_STAGE_IDS.has(stage as PantavionAgentWorkloadAssignment["ownedStages"][number])) ||
    root.externalWorkerAllowed !== false ||
    partitionContract?.idFormat !== "{workOrderId}:batch:{zeroPaddedOrdinal}" ||
    partitionContract?.startsAtUnit !== 1 ||
    !Number.isInteger(batchSize) ||
    batchSize < 1 ||
    batchSize > 1_000 ||
    !Number.isInteger(batchCount) ||
    batchCount < 1 ||
    partitionContract?.batchRangeFormula !== "start=(ordinal-1)*batchSize+1; end=min(ordinal*batchSize,unitCount)" ||
    partitionContract?.rawPayloadStorage !== "forbidden_in_control_plane" ||
    partitionContract?.progressAuthority !== "durable_checkpoint_with_evidence"
  ) {
    return null;
  }

  return {
    marker: "pantavion_agent_workload_assignment_v1",
    workOrderId: root.workOrderId,
    workloadKind: root.workloadKind,
    unitCount,
    ...(typeof root.intakeReference === "string" ? { intakeReference: root.intakeReference } : {}),
    assignedRole: assignedRole as PantavionAgentWorkloadAssignment["assignedRole"],
    ownedStages: ownedStages as PantavionAgentWorkloadAssignment["ownedStages"],
    partitionContract: {
      idFormat: "{workOrderId}:batch:{zeroPaddedOrdinal}",
      startsAtUnit: 1,
      batchSize,
      batchCount,
      batchRangeFormula: "start=(ordinal-1)*batchSize+1; end=min(ordinal*batchSize,unitCount)",
      rawPayloadStorage: "forbidden_in_control_plane",
      progressAuthority: "durable_checkpoint_with_evidence",
    },
    externalWorkerAllowed: false,
  };
}

function parseModuleDeliveryAssignment(
  value: unknown,
): PantavionAgentModuleDeliveryAssignment | null {
  const root = asRecord(value);
  const moduleIds = asStringList(root?.moduleIds);
  const requiredServiceIds = asStringList(root?.requiredServiceIds);
  const promotionBoundary = asRecord(root?.promotionBoundary);
  const assignedRole = typeof root?.assignedRole === "string" ? root.assignedRole : "";

  if (
    root?.marker !== "pantavion_agent_module_delivery_assignment_v1" ||
    typeof root.workOrderId !== "string" ||
    !OWNED_AGENT_ROLES.has(assignedRole as PantavionOwnedAgentRole) ||
    !moduleIds ||
    moduleIds.length === 0 ||
    moduleIds.length > 30 ||
    !moduleIds.every(isPantavionModuleId) ||
    !requiredServiceIds ||
    requiredServiceIds.length > 20 ||
    !requiredServiceIds.every(isPantavionEcosystemServiceId) ||
    root.externalWorkerAllowed !== false ||
    promotionBoundary?.mayPrepareInternalPlan !== true ||
    promotionBoundary?.maySendExternalMessages !== false ||
    promotionBoundary?.mayBuyMediaOrServices !== false ||
    promotionBoundary?.mayPublishPublicCampaign !== false ||
    promotionBoundary?.requiresFounderApprovalForExternalAction !== true
  ) {
    return null;
  }

  return {
    marker: "pantavion_agent_module_delivery_assignment_v1",
    workOrderId: root.workOrderId,
    assignedRole: assignedRole as PantavionOwnedAgentRole,
    moduleIds: moduleIds as PantavionAgentModuleDeliveryAssignment["moduleIds"],
    requiredServiceIds: requiredServiceIds as PantavionAgentModuleDeliveryAssignment["requiredServiceIds"],
    externalWorkerAllowed: false,
    promotionBoundary: {
      mayPrepareInternalPlan: true,
      maySendExternalMessages: false,
      mayBuyMediaOrServices: false,
      mayPublishPublicCampaign: false,
      requiresFounderApprovalForExternalAction: true,
    },
  };
}

function parseAgentExecutionInput(value: unknown): AgentExecutionInput | null {
  const root = asRecord(value);
  const agent = asRecord(root?.agent);
  const security = asRecord(root?.agentSecurity);
  const ecosystemCell = asRecord(root?.ecosystemCell);
  const workload = parseWorkloadAssignment(root?.workload);
  const moduleDelivery = parseModuleDeliveryAssignment(root?.moduleDelivery);
  const rawAgentBlockers = agent ? agent.blockers : undefined;
  const agentBlockers = rawAgentBlockers === undefined ? [] : asStringList(rawAgentBlockers);
  const allowedTargetFiles = asStringList(agent?.allowedTargetFiles);

  if (
    root?.marker !== "pantavion_owned_agent_execution_v1" ||
    typeof root.parentWorkOrderId !== "string" ||
    (root.founderIntent !== undefined && typeof root.founderIntent !== "string") ||
    typeof agent?.id !== "string" ||
    typeof agent?.workOrderId !== "string" ||
    typeof agent?.role !== "string" ||
    !OWNED_AGENT_ROLES.has(agent.role as PantavionOwnedAgentRole) ||
    (agent?.state !== "defined" && agent?.state !== "ready_for_internal_runtime" && agent?.state !== "blocked") ||
    typeof agent?.purpose !== "string" ||
    !asStringList(agent?.internalCapabilities) ||
    !allowedTargetFiles ||
    allowedTargetFiles.length > 100 ||
    !allowedTargetFiles.every(isSafeAgentTargetFile) ||
    typeof agent?.maxRuntimeSeconds !== "number" ||
    typeof agent?.maxAttempts !== "number" ||
    !agentBlockers ||
    typeof security?.mode !== "string" ||
    !asStringList(security?.allowedAuthorities) ||
    !asStringList(security?.stopConditions) ||
    typeof ecosystemCell?.marker !== "string" ||
    typeof ecosystemCell?.target !== "string" ||
    !asStringList(ecosystemCell?.requiredServiceIds) ||
    !workload ||
    !moduleDelivery ||
    agent.id !== `${agent.workOrderId}:${agent.role}` ||
    agent.workOrderId !== workload.workOrderId ||
    agent.workOrderId !== moduleDelivery.workOrderId ||
    agent.role !== workload.assignedRole ||
    agent.role !== moduleDelivery.assignedRole
  ) {
    return null;
  }

  return {
    marker: "pantavion_owned_agent_execution_v1",
    parentWorkOrderId: root.parentWorkOrderId,
    founderIntent: typeof root.founderIntent === "string" ? root.founderIntent : undefined,
    agent: {
      id: agent.id,
      workOrderId: agent.workOrderId,
      role: agent.role as PantavionOwnedAgentRole,
      state: agent.state,
      purpose: agent.purpose,
      internalCapabilities: agent.internalCapabilities as string[],
      allowedTargetFiles,
      maxRuntimeSeconds: agent.maxRuntimeSeconds,
      maxAttempts: agent.maxAttempts,
      blockers: agentBlockers,
    },
    agentSecurity: {
      mode: security.mode,
      allowedAuthorities: security.allowedAuthorities as string[],
      stopConditions: security.stopConditions as string[],
    },
    ecosystemCell: {
      marker: ecosystemCell.marker,
      target: ecosystemCell.target,
      requiredServiceIds: ecosystemCell.requiredServiceIds as string[],
    },
    workload,
    moduleDelivery,
  };
}

function configuredRuntime(): { url: string; token: string } | null {
  const url = process.env.PANTAVION_INTERNAL_AGENT_RUNTIME_URL?.trim() ?? "";
  const token = process.env.PANTAVION_INTERNAL_AGENT_RUNTIME_TOKEN?.trim() ?? "";
  const ownership = process.env.PANTAVION_INTERNAL_AGENT_RUNTIME_OWNERSHIP?.trim();
  if (!url || !token || ownership !== "pantavion_owned") return null;

  try {
    const parsed = new URL(url);
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") return null;
    return { url: parsed.toString().replace(/\/$/, ""), token };
  } catch {
    return null;
  }
}

function parseEvidence(value: unknown): PantavionInternalAgentEvidence[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) return null;

  const evidence: PantavionInternalAgentEvidence[] = [];
  for (const item of value) {
    const record = asRecord(item);
    const kind = record?.kind;
    const reference = typeof record?.reference === "string" ? record.reference.trim() : "";
    const outcome = record?.outcome;

    if (
      ![
        "source_reference",
        "classification_record",
        "canonical_record",
        "audit",
        "test",
        "runtime_check",
      ].includes(String(kind)) ||
      !isSafeRuntimeText(reference, 500) ||
      !["recorded", "passed", "blocked"].includes(String(outcome))
    ) {
      return null;
    }

    evidence.push({
      kind: kind as PantavionInternalAgentEvidence["kind"],
      reference,
      outcome: outcome as PantavionInternalAgentEvidence["outcome"],
    });
  }

  return evidence;
}

const BLOCKER_KINDS = new Set<PantavionFoundryBlockerKind>([
  "runtime_failure",
  "invalid_execution_input",
  "missing_evidence",
  "unresolved_dependency",
  "validation_failure",
  "environment_configuration",
  "scope_or_policy",
  "founder_approval",
]);

function parseRuntimeBlockers(value: unknown): PantavionInternalAgentBlocker[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 12) return null;

  const blockers: PantavionInternalAgentBlocker[] = [];
  for (const item of value) {
    const record = asRecord(item);
    const id = typeof record?.id === "string" ? record.id.trim() : "";
    const kind = typeof record?.kind === "string" ? record.kind : "";
    const summary = typeof record?.summary === "string" ? record.summary.trim() : "";

    if (
      !/^[a-zA-Z0-9_.:-]{1,120}$/.test(id) ||
      !BLOCKER_KINDS.has(kind as PantavionFoundryBlockerKind) ||
      !isSafeRuntimeText(summary, 500)
    ) {
      return null;
    }

    blockers.push({
      id,
      kind: kind as PantavionFoundryBlockerKind,
      summary,
    });
  }

  return blockers;
}

function outputFromRuntime(value: unknown): PantavionInternalAgentRuntimeOutput | null {
  const root = asRecord(value);
  const summary = typeof root?.summary === "string" ? root.summary.trim() : "";
  const nextActions = asStringList(root?.nextActions) ?? [];
  const evidence = parseEvidence(root?.evidence);
  const blockers = parseRuntimeBlockers(root?.blockers);

  if (
    root?.ok !== true ||
    !isSafeRuntimeText(summary, 4_000) ||
    !nextActions.every((item) => isSafeRuntimeText(item, 500)) ||
    !evidence ||
    !blockers
  ) {
    return null;
  }

  return {
    summary: summary.slice(0, 4000),
    nextActions: nextActions.map((item) => item.slice(0, 500)).slice(0, 30),
    evidence,
    blockers,
  };
}

async function callPantavionInternalAgentRuntime(
  runtime: { url: string; token: string },
  input: AgentExecutionInput,
): Promise<PantavionInternalAgentRuntimeOutput> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INTERNAL_AGENT_TIMEOUT_MS);

  try {
    const response = await fetch(`${runtime.url}/v1/pantavion/agents/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${runtime.token}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        protocol: "pantavion_internal_agent_execute_v1",
        ownership: "pantavion_owned",
        parentWorkOrderId: input.parentWorkOrderId,
        founderIntent: input.founderIntent ?? "",
        agent: input.agent,
        policy: {
          allowedAuthorities: input.agentSecurity.allowedAuthorities,
          stopConditions: input.agentSecurity.stopConditions,
          externalWorkerAllowed: false,
          privateDataExportAllowed: false,
          productionDeployAllowed: false,
          mergeAllowed: false,
          unboundedShellAllowed: false,
        },
        ecosystemCell: input.ecosystemCell,
        workload: input.workload,
        moduleDelivery: input.moduleDelivery,
        requiredOutputEvidence: ["kind", "reference", "outcome"],
        blockerProtocol: {
          mayReturnStructuredBlockers: true,
          allowedKinds: [...BLOCKER_KINDS],
          rule: "resolve_internally_when_safe_or_return_a_specific_founder_approval_blocker",
        },
      }),
    });

    if (!response.ok) throw new Error("pantavion_internal_agent_runtime_http_error");
    const output = outputFromRuntime(await response.json());
    if (!output) throw new Error("pantavion_internal_agent_runtime_invalid_output");
    return output;
  } finally {
    clearTimeout(timer);
  }
}

function deriveEvidenceBlockers(input: {
  workOrderId: string;
  sourceAgentRole: PantavionOwnedAgentRole;
  output: PantavionInternalAgentRuntimeOutput;
}): PantavionFoundryBlockerResolution[] {
  const structured = input.output.blockers.map((blocker) =>
    createPantavionFoundryBlockerResolution({
      workOrderId: input.workOrderId,
      sourceAgentRole: input.sourceAgentRole,
      blockerId: blocker.id,
      kind: blocker.kind,
      summary: blocker.summary,
    }),
  );

  if (structured.length > 0) return structured;

  return input.output.evidence
    .filter((evidence) => evidence.outcome === "blocked")
    .slice(0, 3)
    .map((evidence, index) =>
      createPantavionFoundryBlockerResolution({
        workOrderId: input.workOrderId,
        sourceAgentRole: input.sourceAgentRole,
        blockerId: `blocked_evidence_${index + 1}`,
        kind: "missing_evidence",
        summary: `The runtime reported blocked evidence: ${evidence.reference.slice(0, 360)}`,
      }),
    );
}

async function attachBlockerResolutions(input: {
  record: PantavionDurableExecutionRecord;
  resolutions: PantavionFoundryBlockerResolution[];
  store: PantavionSupabaseDurableExecutionStore;
}): Promise<PantavionDurableExecutionRecord> {
  if (input.resolutions.length === 0) return input.record;

  let updated = input.record;
  for (const resolution of input.resolutions) {
    updated = appendCheckpoint(
      updated,
      "pantavion_foundry_blocker_resolution_created",
      { resolution },
    );
  }
  await input.store.put(updated);
  return updated;
}

function canQueueRepairFor(resolution: PantavionFoundryBlockerResolution): boolean {
  return resolution.disposition === "self_resolving" || resolution.disposition === "repair_queued";
}

async function queueRepairAgentForResolution(input: {
  sourceAgent: Pick<MaterializedAgent, "id" | "workOrderId" | "role">;
  parentWorkOrderId: string;
  resolution: PantavionFoundryBlockerResolution;
  store: PantavionSupabaseDurableExecutionStore;
}): Promise<boolean> {
  if (input.sourceAgent.role === "repairer" || !canQueueRepairFor(input.resolution)) return false;

  const repairRecord = await input.store.get(`${input.sourceAgent.workOrderId}:repairer`);
  if (
    !repairRecord ||
    repairRecord.taskName !== PANTAVION_OWNED_AGENT_TASK_NAME ||
    ["queued", "running", "succeeded", "failed", "cancelled"].includes(repairRecord.status)
  ) {
    return false;
  }

  const repairInput = parseAgentExecutionInput(repairRecord.input);
  if (
    !repairInput ||
    repairInput.parentWorkOrderId !== input.parentWorkOrderId ||
    repairInput.agent.role !== "repairer"
  ) {
    return false;
  }

  const nonTriggerBlockers = repairInput.agent.blockers.filter(
    (blocker) => blocker !== "awaiting_verified_failure_or_repair_instruction",
  );
  if (nonTriggerBlockers.length > 0) return false;

  const queued = appendCheckpoint(
    {
      ...repairRecord,
      status: "queued",
      lastError: undefined,
      updatedAt: new Date().toISOString(),
      input: {
        ...repairInput,
        agent: {
          ...repairInput.agent,
          state: "ready_for_internal_runtime",
          blockers: [],
        },
      },
    },
    "pantavion_repair_agent_queued",
    {
      marker: "pantavion_repair_agent_queued_v1",
      sourceAgentRole: input.sourceAgent.role,
      sourceAgentId: input.sourceAgent.id,
      blockerId: input.resolution.blockerId,
      blockerKind: input.resolution.kind,
      externalWorkerDependency: false,
      productionDeployAllowed: false,
    },
  );
  await input.store.put(queued);
  return true;
}

function agentIdentityFromExecutionId(
  executionId: string,
): Pick<MaterializedAgent, "id" | "workOrderId" | "role"> | null {
  const separator = executionId.lastIndexOf(":");
  if (separator < 1) return null;

  const workOrderId = executionId.slice(0, separator);
  const role = executionId.slice(separator + 1);
  if (!workOrderId || !OWNED_AGENT_ROLES.has(role as PantavionOwnedAgentRole)) return null;

  return {
    id: executionId,
    workOrderId,
    role: role as PantavionOwnedAgentRole,
  };
}

async function activateDefinedAgents(input: {
  records: PantavionDurableExecutionRecord[];
  store: PantavionSupabaseDurableExecutionStore;
}): Promise<number> {
  let activated = 0;

  for (const record of input.records) {
    if (record.taskName !== PANTAVION_OWNED_AGENT_TASK_NAME || record.status !== "planned") continue;

    const executionInput = parseAgentExecutionInput(record.input);
    if (
      !executionInput ||
      executionInput.agent.state !== "defined" ||
      executionInput.agent.blockers.length > 0
    ) {
      continue;
    }

    const queued = appendCheckpoint(
      {
        ...record,
        status: "queued",
        lastError: undefined,
        updatedAt: new Date().toISOString(),
        input: {
          ...executionInput,
          agent: {
            ...executionInput.agent,
            state: "ready_for_internal_runtime",
          },
        },
      },
      "pantavion_internal_runtime_activated",
      {
        marker: "pantavion_internal_runtime_activated_v1",
        ownership: "pantavion_owned",
        role: executionInput.agent.role,
        externalWorkerDependency: false,
      },
    );
    await input.store.put(queued);
    activated += 1;
  }

  return activated;
}

type QueuedAgentExecutionResult = {
  outcome: "succeeded" | "failed" | "retry_scheduled" | "skipped";
  repairQueued: boolean;
};

async function executeQueuedAgent(input: {
  record: PantavionDurableExecutionRecord;
  runtime: { url: string; token: string };
  store: PantavionSupabaseDurableExecutionStore;
}): Promise<QueuedAgentExecutionResult> {
  const claimed = await input.store.claim(input.record.executionId, ["queued"]);
  if (!claimed) return { outcome: "skipped", repairQueued: false };

  const executionInput = parseAgentExecutionInput(claimed.input);

  if (!executionInput || executionInput.agent.state !== "ready_for_internal_runtime") {
    let failed = appendCheckpoint(
      {
        ...claimed,
        status: "failed",
        lastError: "invalid_internal_agent_execution_input",
        updatedAt: new Date().toISOString(),
      },
      "pantavion_internal_agent_input_rejected",
      {
        marker: "pantavion_internal_agent_input_rejected_v1",
        ownership: "pantavion_owned",
      },
    );
    const identity = agentIdentityFromExecutionId(claimed.executionId);
    const resolution = identity
      ? createPantavionFoundryBlockerResolution({
          workOrderId: identity.workOrderId,
          sourceAgentRole: identity.role,
          blockerId: "invalid_internal_agent_execution_input",
          kind: "invalid_execution_input",
          summary: "The queued agent input failed validation and was preserved for bounded repair.",
        })
      : null;
    failed = await attachBlockerResolutions({
      record: failed,
      resolutions: resolution ? [resolution] : [],
      store: input.store,
    });
    const rawInput = asRecord(claimed.input);
    const parentWorkOrderId = typeof rawInput?.parentWorkOrderId === "string"
      ? rawInput.parentWorkOrderId
      : "";
    const repairQueued = identity && resolution && parentWorkOrderId
      ? await queueRepairAgentForResolution({
          sourceAgent: identity,
          parentWorkOrderId,
          resolution,
          store: input.store,
        })
      : false;
    return { outcome: "failed", repairQueued };
  }

  let running = appendCheckpoint(
    {
      ...claimed,
      status: "running",
      updatedAt: new Date().toISOString(),
      lastError: undefined,
    },
    "pantavion_internal_agent_started",
    {
      marker: "pantavion_internal_agent_started_v1",
      ownership: "pantavion_owned",
      role: executionInput.agent.role,
      externalWorkerAllowed: false,
      workloadKind: executionInput.workload.workloadKind,
      workloadUnits: executionInput.workload.unitCount,
      workloadBatchCount: executionInput.workload.partitionContract.batchCount,
    },
  );
  await input.store.put(running);

  try {
    const output = await callPantavionInternalAgentRuntime(input.runtime, executionInput);
    let succeeded = appendCheckpoint(
      {
        ...running,
        status: "succeeded",
        output,
        updatedAt: new Date().toISOString(),
      },
      "pantavion_internal_agent_succeeded",
      {
        marker: "pantavion_internal_agent_succeeded_v1",
        role: executionInput.agent.role,
        nextActionCount: output.nextActions.length,
        evidenceCount: output.evidence.length,
        blockerCount: output.blockers.length,
      },
    );
    await input.store.put(succeeded);
    const resolutions = deriveEvidenceBlockers({
      workOrderId: executionInput.agent.workOrderId,
      sourceAgentRole: executionInput.agent.role,
      output,
    });
    succeeded = await attachBlockerResolutions({
      record: succeeded,
      resolutions,
      store: input.store,
    });
    let repairQueued = false;
    for (const resolution of resolutions) {
      repairQueued = (await queueRepairAgentForResolution({
        sourceAgent: executionInput.agent,
        parentWorkOrderId: executionInput.parentWorkOrderId,
        resolution,
        store: input.store,
      })) || repairQueued;
    }
    return { outcome: "succeeded", repairQueued };
  } catch {
    const maxAttempts = running.maxAttempts ?? 3;
    const retryable = running.attempt < maxAttempts;
    let failed = appendCheckpoint(
      {
        ...running,
        maxAttempts,
        status: retryable ? "queued" : "failed",
        lastError: "pantavion_internal_agent_runtime_failed",
        updatedAt: new Date().toISOString(),
      },
      retryable ? "pantavion_internal_agent_retry_scheduled" : "pantavion_internal_agent_failed",
      {
        marker: retryable
          ? "pantavion_internal_agent_retry_scheduled_v1"
          : "pantavion_internal_agent_failed_v1",
        role: executionInput.agent.role,
        attempt: running.attempt,
        maxAttempts,
      },
    );
    await input.store.put(failed);

    if (retryable) return { outcome: "retry_scheduled", repairQueued: false };

    const resolution = createPantavionFoundryBlockerResolution({
      workOrderId: executionInput.agent.workOrderId,
      sourceAgentRole: executionInput.agent.role,
      blockerId: "pantavion_internal_agent_runtime_failed",
      kind: "runtime_failure",
      summary: "The Pantavion-owned runtime exhausted its bounded retry budget; a repair analysis was queued.",
    });
    failed = await attachBlockerResolutions({
      record: failed,
      resolutions: [resolution],
      store: input.store,
    });
    const repairQueued = await queueRepairAgentForResolution({
      sourceAgent: executionInput.agent,
      parentWorkOrderId: executionInput.parentWorkOrderId,
      resolution,
      store: input.store,
    });
    return { outcome: "failed", repairQueued };
  }
}

export async function runPantavionFoundryTick(): Promise<PantavionFoundryTickReport> {
  const checkedAt = new Date().toISOString();
  const runtime = configuredRuntime();
  const store = new PantavionSupabaseDurableExecutionStore();

  let records: PantavionDurableExecutionRecord[];
  try {
    records = await store.list(100);
  } catch {
    return {
      marker: "pantavion_foundry_tick_v1",
      status: "blocked",
      durableStore: "unavailable",
      internalRuntime: runtime ? "pantavion_owned_internal_runtime" : "not_configured",
      scannedAgents: 0,
      queuedAgents: 0,
      attemptedAgents: 0,
      succeededAgents: 0,
      failedAgents: 0,
      retriedAgents: 0,
      skippedAgents: 0,
      activatedAgents: 0,
      repairAgentsQueued: 0,
      checkedAt,
    };
  }

  let agents = records.filter((record) => record.taskName === PANTAVION_OWNED_AGENT_TASK_NAME);
  let queued = agents.filter((record) => record.status === "queued");

  if (!runtime) {
    return {
      marker: "pantavion_foundry_tick_v1",
      status: "blocked",
      durableStore: "available",
      internalRuntime: "not_configured",
      scannedAgents: agents.length,
      queuedAgents: queued.length,
      attemptedAgents: 0,
      succeededAgents: 0,
      failedAgents: 0,
      retriedAgents: 0,
      skippedAgents: 0,
      activatedAgents: 0,
      repairAgentsQueued: 0,
      checkedAt,
    };
  }

  let activatedAgents = 0;
  try {
    activatedAgents = await activateDefinedAgents({ records, store });
    if (activatedAgents > 0) {
      records = await store.list(100);
      agents = records.filter((record) => record.taskName === PANTAVION_OWNED_AGENT_TASK_NAME);
      queued = agents.filter((record) => record.status === "queued");
    }
  } catch {
    return {
      marker: "pantavion_foundry_tick_v1",
      status: "degraded",
      durableStore: "available",
      internalRuntime: "pantavion_owned_internal_runtime",
      scannedAgents: agents.length,
      queuedAgents: queued.length,
      attemptedAgents: 0,
      succeededAgents: 0,
      failedAgents: 0,
      retriedAgents: 0,
      skippedAgents: 0,
      activatedAgents: 0,
      repairAgentsQueued: 0,
      checkedAt,
    };
  }

  let succeededAgents = 0;
  let failedAgents = 0;
  let retriedAgents = 0;
  let skippedAgents = 0;
  let repairAgentsQueued = 0;
  const eligibleQueuedAgents = queued.filter((item) => item.attempt < (item.maxAttempts ?? 3));

  for (const record of eligibleQueuedAgents.slice(0, MAX_AGENTS_PER_TICK)) {
    try {
      const result = await executeQueuedAgent({ record, runtime, store });
      if (result.outcome === "succeeded") succeededAgents += 1;
      else if (result.outcome === "failed") failedAgents += 1;
      else if (result.outcome === "retry_scheduled") retriedAgents += 1;
      else skippedAgents += 1;
      if (result.repairQueued) repairAgentsQueued += 1;
    } catch {
      failedAgents += 1;
    }
  }

  return {
    marker: "pantavion_foundry_tick_v1",
    status: failedAgents > 0 ? "degraded" : "ran",
    durableStore: "available",
    internalRuntime: "pantavion_owned_internal_runtime",
    scannedAgents: agents.length,
    queuedAgents: queued.length,
    attemptedAgents: Math.min(eligibleQueuedAgents.length, MAX_AGENTS_PER_TICK),
    succeededAgents,
    failedAgents,
    retriedAgents,
    skippedAgents,
    activatedAgents,
    repairAgentsQueued,
    checkedAt,
  };
}
