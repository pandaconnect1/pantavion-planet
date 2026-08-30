import { createHash } from "node:crypto";

import type { PantavionRecoveryWorkUnit } from "./pantavion-recovery-runtime-fabric";
import { PANTAVION_RECOVERY_CORPUS_CONTRACT } from "./pantavion-recovery-runtime-fabric";
import type { AgentCapabilityScope } from "../sovereign/agent-capability-budget-control";
import type { SwarmRole } from "../sovereign/ephemeral-agent-swarm";
import type { TechnologyReadiness } from "../sovereign/technology-library";
import {
  compileSovereignKernelDecision,
  type SovereignKernelDecision,
} from "../sovereign/sovereign-capability-kernel";

export interface PantavionRecoveryCanonicalBuildRoute {
  module: string;
  subsystem: string;
  capability: string;
  feature: string | null;
  artifactType: string | null;
  canonicalTarget: string;
}

export type PantavionRecoveryDispatchDisposition =
  | "AWAITING_OWNER_SCOPED_BUILD"
  | "BLOCKED_GOVERNED_HOLD"
  | "BLOCKED_RECURSIVE_PROVENANCE";

export interface PantavionRecoverySovereignDispatchRecord {
  marker: "pantavion_recovery_sovereign_dispatch_record_v1";
  globalOrdinal: number;
  workUnitId: string;
  recordId: string;
  runtimeLane: PantavionRecoveryWorkUnit["runtimeLane"];
  disposition: PantavionRecoveryDispatchDisposition;
  buildOrderId: string | null;
  workUnitDigest: string;
  previousDispatchDigest: string | null;
  dispatchDigest: string;
  authority: {
    analysis: true;
    planning: true;
    codeMutation: false;
    execution: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
  };
  completion: false;
}

export interface PantavionRecoveryBuildMembership {
  memberCount: number;
  firstGlobalOrdinal: number;
  lastGlobalOrdinal: number;
  orderedMemberWorkUnitIdFingerprint: string;
}

export interface PantavionRecoverySovereignBuildOrder {
  marker: "pantavion_recovery_sovereign_build_order_v1";
  buildOrderOrdinal: number;
  buildOrderId: string;
  route: PantavionRecoveryCanonicalBuildRoute;
  membership: PantavionRecoveryBuildMembership;
  sovereignDecision: SovereignKernelDecision;
  ephemeralAgentRequest: {
    state: "not_issued";
    role: SwarmRole;
    requestedCapabilities: AgentCapabilityScope[];
    requestedBudgetLimit: 0;
    ownerApprovalRequired: true;
  };
  technologyLibraryGate: {
    readiness: TechnologyReadiness;
    approvedEntryIds: [];
    blocker: "technology_library_assessment_required";
    deploymentAuthorized: false;
  };
  disconnectedExecutionGate: {
    eligible: false;
    blocker: "owner_approval_and_deterministic_payload_required";
    productionWriteAuthorized: false;
  };
  ownerControlGate: {
    audience: "founder_only";
    approvalRecorded: false;
    releaseAuthorized: false;
  };
  implementationState: "idea";
  previousBuildOrderDigest: string | null;
  buildOrderDigest: string;
  authority: {
    analysis: true;
    planning: true;
    codeMutation: false;
    execution: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
  };
  completion: false;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("recovery_dispatch_non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  }
  throw new Error("recovery_dispatch_unsupported_digest_value");
}

function assertSha256(label: string, value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label}_must_be_sha256`);
  }
}

function requireText(label: string, value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label}_required`);
  return value.trim();
}

export function digestPantavionRecoveryWorkUnitForDispatch(
  unit: PantavionRecoveryWorkUnit,
): string {
  return sha256(canonicalJson({ ...unit, workUnitDigest: undefined }));
}

export function validatePantavionRecoveryWorkUnitForDispatch(input: {
  unit: PantavionRecoveryWorkUnit;
  expectedGlobalOrdinal: number;
  expectedPreviousWorkUnitDigest: string | null;
}): void {
  const { unit } = input;
  if (unit.version !== "pantavion_recovery_work_unit_v1") {
    throw new Error("recovery_dispatch_work_unit_version_invalid");
  }
  if (!/^recovery_work_unit_[0-9a-f]{64}$/.test(unit.workUnitId)) {
    throw new Error("recovery_dispatch_work_unit_id_invalid");
  }
  requireText("recovery_dispatch_record_id", unit.recordId);
  assertSha256("recovery_dispatch_work_unit_digest", unit.workUnitDigest);
  assertSha256("recovery_dispatch_source_record_digest", unit.source.sourceRecordSha256);
  assertSha256("recovery_dispatch_semantic_record_digest", unit.source.semanticRecordSha256);
  if (unit.source.globalOrdinal !== input.expectedGlobalOrdinal) {
    throw new Error("recovery_dispatch_global_ordinal_mismatch");
  }
  if (unit.previousWorkUnitDigest !== input.expectedPreviousWorkUnitDigest) {
    throw new Error("recovery_dispatch_work_unit_chain_mismatch");
  }
  if (
    unit.corpus.sourceFingerprint !== PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint ||
    unit.corpus.orderedIdFingerprint !== PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint ||
    unit.corpus.sourceRecordCount !== PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount
  ) {
    throw new Error("recovery_dispatch_corpus_binding_mismatch");
  }
  if (
    unit.governance.executionAuthority !== false ||
    unit.governance.releaseAuthority !== false ||
    unit.governance.productionWriteAuthority !== false
  ) {
    throw new Error("recovery_dispatch_work_unit_authority_forbidden");
  }
  if (digestPantavionRecoveryWorkUnitForDispatch(unit) !== unit.workUnitDigest) {
    throw new Error("recovery_dispatch_work_unit_digest_mismatch");
  }

  if (unit.runtimeLane === "CLASSIFIED_CANDIDATE") {
    if (unit.implementationState !== "idea" || unit.nextAction !== "PLAN_SCOPED_INTERNAL_DRAFT") {
      throw new Error("recovery_dispatch_classified_state_invalid");
    }
    requireText("recovery_dispatch_module", unit.route.module);
    requireText("recovery_dispatch_subsystem", unit.route.subsystem);
    requireText("recovery_dispatch_capability", unit.route.capability);
    requireText("recovery_dispatch_canonical_target", unit.route.canonicalTarget);
    return;
  }
  if (unit.runtimeLane === "GOVERNED_HOLD") {
    if (unit.implementationState !== "blocked" || unit.nextAction !== "PRESERVE_GOVERNED_HOLD") {
      throw new Error("recovery_dispatch_hold_state_invalid");
    }
    requireText("recovery_dispatch_hold_disposition", unit.governance.disposition);
    requireText("recovery_dispatch_hold_owner", unit.governance.canonicalOwner);
    requireText("recovery_dispatch_hold_reason", unit.governance.reason);
    return;
  }
  if (unit.runtimeLane === "QUARANTINED_RECURSIVE") {
    if (
      unit.implementationState !== "blocked" ||
      unit.nextAction !== "PRESERVE_RECURSIVE_PROVENANCE"
    ) {
      throw new Error("recovery_dispatch_recursive_state_invalid");
    }
    return;
  }
  throw new Error("recovery_dispatch_runtime_lane_invalid");
}

export function resolvePantavionRecoveryCanonicalBuildRoute(
  unit: PantavionRecoveryWorkUnit,
): PantavionRecoveryCanonicalBuildRoute {
  if (unit.runtimeLane !== "CLASSIFIED_CANDIDATE") {
    throw new Error("recovery_dispatch_build_route_requires_candidate");
  }
  return {
    module: requireText("recovery_dispatch_module", unit.route.module),
    subsystem: requireText("recovery_dispatch_subsystem", unit.route.subsystem),
    capability: requireText("recovery_dispatch_capability", unit.route.capability),
    feature:
      typeof unit.route.feature === "string" && unit.route.feature.trim()
        ? unit.route.feature.trim()
        : null,
    artifactType:
      typeof unit.route.artifactType === "string" && unit.route.artifactType.trim()
        ? unit.route.artifactType.trim()
        : null,
    canonicalTarget: requireText(
      "recovery_dispatch_canonical_target",
      unit.route.canonicalTarget,
    ),
  };
}

export function derivePantavionRecoveryBuildOrderId(
  route: PantavionRecoveryCanonicalBuildRoute,
): string {
  requireText("recovery_dispatch_route_module", route.module);
  requireText("recovery_dispatch_route_subsystem", route.subsystem);
  requireText("recovery_dispatch_route_capability", route.capability);
  requireText("recovery_dispatch_route_target", route.canonicalTarget);
  return `recovery_build_order_${sha256(canonicalJson(route))}`;
}

export function digestPantavionRecoverySovereignDispatchRecord(
  record: PantavionRecoverySovereignDispatchRecord,
): string {
  return sha256(canonicalJson({ ...record, dispatchDigest: undefined }));
}

export function materializePantavionRecoverySovereignDispatchRecord(input: {
  unit: PantavionRecoveryWorkUnit;
  expectedGlobalOrdinal: number;
  expectedPreviousWorkUnitDigest: string | null;
  previousDispatchDigest: string | null;
}): PantavionRecoverySovereignDispatchRecord {
  validatePantavionRecoveryWorkUnitForDispatch(input);
  if (input.expectedGlobalOrdinal === 1) {
    if (input.previousDispatchDigest !== null) {
      throw new Error("recovery_dispatch_first_chain_must_be_empty");
    }
  } else {
    assertSha256("recovery_dispatch_previous_digest", input.previousDispatchDigest);
  }

  const route =
    input.unit.runtimeLane === "CLASSIFIED_CANDIDATE"
      ? resolvePantavionRecoveryCanonicalBuildRoute(input.unit)
      : null;
  const disposition: PantavionRecoveryDispatchDisposition =
    input.unit.runtimeLane === "CLASSIFIED_CANDIDATE"
      ? "AWAITING_OWNER_SCOPED_BUILD"
      : input.unit.runtimeLane === "GOVERNED_HOLD"
        ? "BLOCKED_GOVERNED_HOLD"
        : "BLOCKED_RECURSIVE_PROVENANCE";
  const unsigned = {
    marker: "pantavion_recovery_sovereign_dispatch_record_v1" as const,
    globalOrdinal: input.expectedGlobalOrdinal,
    workUnitId: input.unit.workUnitId,
    recordId: input.unit.recordId,
    runtimeLane: input.unit.runtimeLane,
    disposition,
    buildOrderId: route ? derivePantavionRecoveryBuildOrderId(route) : null,
    workUnitDigest: input.unit.workUnitDigest,
    previousDispatchDigest: input.previousDispatchDigest,
    authority: {
      analysis: true as const,
      planning: true as const,
      codeMutation: false as const,
      execution: false as const,
      productionWrite: false as const,
      merge: false as const,
      deployment: false as const,
      publicExposure: false as const,
      release: false as const,
    },
    completion: false as const,
  };
  return {
    ...unsigned,
    dispatchDigest: sha256(canonicalJson(unsigned)),
  };
}

export function digestPantavionRecoverySovereignBuildOrder(
  order: PantavionRecoverySovereignBuildOrder,
): string {
  return sha256(canonicalJson({ ...order, buildOrderDigest: undefined }));
}

export function createPantavionRecoverySovereignBuildOrder(input: {
  buildOrderOrdinal: number;
  route: PantavionRecoveryCanonicalBuildRoute;
  membership: PantavionRecoveryBuildMembership;
  previousBuildOrderDigest: string | null;
}): PantavionRecoverySovereignBuildOrder {
  if (!Number.isInteger(input.buildOrderOrdinal) || input.buildOrderOrdinal < 1) {
    throw new Error("recovery_build_order_ordinal_invalid");
  }
  if (input.buildOrderOrdinal === 1) {
    if (input.previousBuildOrderDigest !== null) {
      throw new Error("recovery_build_order_first_chain_must_be_empty");
    }
  } else {
    assertSha256("recovery_build_order_previous_digest", input.previousBuildOrderDigest);
  }
  if (!Number.isInteger(input.membership.memberCount) || input.membership.memberCount < 1) {
    throw new Error("recovery_build_order_member_count_invalid");
  }
  if (
    !Number.isInteger(input.membership.firstGlobalOrdinal) ||
    !Number.isInteger(input.membership.lastGlobalOrdinal) ||
    input.membership.firstGlobalOrdinal < 1 ||
    input.membership.lastGlobalOrdinal < input.membership.firstGlobalOrdinal
  ) {
    throw new Error("recovery_build_order_member_range_invalid");
  }
  assertSha256(
    "recovery_build_order_member_fingerprint",
    input.membership.orderedMemberWorkUnitIdFingerprint,
  );

  const route = {
    ...input.route,
    module: requireText("recovery_build_order_module", input.route.module),
    subsystem: requireText("recovery_build_order_subsystem", input.route.subsystem),
    capability: requireText("recovery_build_order_capability", input.route.capability),
    canonicalTarget: requireText(
      "recovery_build_order_canonical_target",
      input.route.canonicalTarget,
    ),
  };
  const buildOrderId = derivePantavionRecoveryBuildOrderId(route);
  const intentId = buildOrderId.replace("recovery_build_order_", "recovery_build_intent_");
  const scopeStepId = `${intentId}:scope`;
  const buildStepId = `${intentId}:build`;
  const verifyStepId = `${intentId}:verify`;
  const sovereignDecision = compileSovereignKernelDecision({
    intent: {
      id: intentId,
      userId: "pantavion_recovery_factory",
      text: "Canonical recovered capability requires a bounded isolated draft.",
      desiredOutcome: `Prepare and verify an isolated draft for ${route.module}/${route.capability}.`,
      jurisdiction: "CY",
      maxCost: 0,
    },
    steps: [
      {
        id: scopeStepId,
        title: "Validate canonical scope and acceptance boundary",
        kind: "deterministic",
        capability: "pantavion.recovery.scoped_build.plan",
        risk: "medium",
        reversible: true,
        requiresOwnerApproval: false,
        dependsOn: [],
      },
      {
        id: buildStepId,
        title: "Prepare founder-authorized isolated draft",
        kind: "agent",
        capability: route.capability,
        risk: "high",
        reversible: true,
        requiresOwnerApproval: true,
        dependsOn: [scopeStepId],
      },
      {
        id: verifyStepId,
        title: "Verify type, test, build, security, rollback and audit evidence",
        kind: "workflow",
        capability: "pantavion.recovery.scoped_build.verify",
        risk: "medium",
        reversible: true,
        requiresOwnerApproval: false,
        dependsOn: [buildStepId],
      },
    ],
    estimatedCost: 0,
    outcomePolicy: {
      ownerApprovalRisks: ["high", "critical"],
      requireApprovalForIrreversible: true,
      maximumAutomaticCost: 0,
    },
    firewallRequest: {
      intentId,
      actorId: "pantavion_recovery_factory",
      actorKind: "system_agent",
      jurisdiction: "CY",
      capabilities: [route.capability],
      dataClasses: ["private"],
      estimatedCost: 0,
      risk: "high",
      reversible: true,
      legalConsentRecorded: false,
      writesProduction: false,
      publishesToUsers: false,
      sendsExternalMessage: false,
      changesIdentityOrAccess: false,
    },
    firewallPolicy: {
      allowedJurisdictions: ["CY"],
      automaticCapabilities: [
        "pantavion.recovery.scoped_build.plan",
        "pantavion.recovery.scoped_build.verify",
      ],
      maximumAutomaticCost: 0,
      ownerApprovalRisks: ["high", "critical"],
      requireConsentForSensitiveData: true,
      productionMutationMode: "deny",
      publicExposureMode: "deny",
    },
  });
  if (
    sovereignDecision.disposition !== "awaiting_owner" ||
    sovereignDecision.firewall.disposition !== "owner_approval" ||
    sovereignDecision.plan.state !== "ready" ||
    sovereignDecision.plan.requiresOwnerApproval !== true ||
    sovereignDecision.mayMerge !== false ||
    sovereignDecision.mayDeployProduction !== false ||
    sovereignDecision.mayPublishToUsers !== false
  ) {
    throw new Error("recovery_build_order_sovereign_gate_mismatch");
  }

  const unsigned = {
    marker: "pantavion_recovery_sovereign_build_order_v1" as const,
    buildOrderOrdinal: input.buildOrderOrdinal,
    buildOrderId,
    route,
    membership: input.membership,
    sovereignDecision,
    ephemeralAgentRequest: {
      state: "not_issued" as const,
      role: "builder" as const,
      requestedCapabilities: [
        {
          capability: route.capability,
          scope: route.canonicalTarget,
          access: "write" as const,
        },
      ],
      requestedBudgetLimit: 0 as const,
      ownerApprovalRequired: true as const,
    },
    technologyLibraryGate: {
      readiness: "hold" as const,
      approvedEntryIds: [] as [],
      blocker: "technology_library_assessment_required" as const,
      deploymentAuthorized: false as const,
    },
    disconnectedExecutionGate: {
      eligible: false as const,
      blocker: "owner_approval_and_deterministic_payload_required" as const,
      productionWriteAuthorized: false as const,
    },
    ownerControlGate: {
      audience: "founder_only" as const,
      approvalRecorded: false as const,
      releaseAuthorized: false as const,
    },
    implementationState: "idea" as const,
    previousBuildOrderDigest: input.previousBuildOrderDigest,
    authority: {
      analysis: true as const,
      planning: true as const,
      codeMutation: false as const,
      execution: false as const,
      productionWrite: false as const,
      merge: false as const,
      deployment: false as const,
      publicExposure: false as const,
      release: false as const,
    },
    completion: false as const,
  };
  return {
    ...unsigned,
    buildOrderDigest: sha256(canonicalJson(unsigned)),
  };
}
