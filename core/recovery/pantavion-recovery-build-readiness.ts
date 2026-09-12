import { createHash } from "node:crypto";

import {
  derivePantavionRecoveryBuildOrderId,
  type PantavionRecoveryBuildMembership,
  type PantavionRecoveryCanonicalBuildRoute,
} from "./pantavion-recovery-sovereign-build-dispatch.ts";
import type { AgentCapabilityScope } from "../sovereign/agent-capability-budget-control.ts";
import type { SwarmRole } from "../sovereign/ephemeral-agent-swarm.ts";
import type { IntentDataClass, IntentRisk } from "../sovereign/intent-firewall.ts";
import {
  assessTechnologyLibraryEntry,
  type TechnologyLibraryAssessment,
  type TechnologyLibraryEntry,
} from "../sovereign/technology-library.ts";

const CRITICAL_MODULES = new Set([
  "SOS / Crisis",
  "Safety / Trust / Minors",
  "Identity / Auth / Consent",
  "Maps / World / Water",
  "Kernel / Guardian / Runtime",
  "Resilience / Offline / Infrastructure",
]);
const HIGH_MODULES = new Set([
  "Personal AI / PantaAI",
  "People",
  "Chat",
  "Social / Pulse / Communities",
  "Marketplace / Work / Business",
  "Interpreter / Translation",
]);
const REGULATED_MODULES = new Set([
  "SOS / Crisis",
  "Safety / Trust / Minors",
  "Identity / Auth / Consent",
]);
const SENSITIVE_MODULES = new Set([
  "Maps / World / Water",
  "Kernel / Guardian / Runtime",
  "Resilience / Offline / Infrastructure",
  "Personal AI / PantaAI",
  "People",
  "Chat",
  "Social / Pulse / Communities",
  "Marketplace / Work / Business",
  "Interpreter / Translation",
  "Recovery / Provenance",
]);

export interface PantavionRecoveryBuildOrderReadinessInput {
  buildOrderOrdinal: number;
  buildOrderId: string;
  buildOrderDigest: string;
  route: PantavionRecoveryCanonicalBuildRoute;
  membership: PantavionRecoveryBuildMembership;
  sovereignDisposition: "awaiting_owner";
  implementationState: "IDEA";
  ownerApprovalRequired: true;
  technologyReadiness: "hold";
  executionAuthority: false;
  codeMutationAuthority: false;
  productionWriteAuthority: false;
  mergeAuthority: false;
  deploymentAuthority: false;
  publicExposureAuthority: false;
  releaseAuthority: false;
}

export interface PantavionRecoveryBuildReadinessPacket {
  marker: "pantavion_recovery_build_readiness_packet_v1";
  buildOrderOrdinal: number;
  buildOrderId: string;
  buildOrderDigest: string;
  route: PantavionRecoveryCanonicalBuildRoute;
  membership: PantavionRecoveryBuildMembership;
  currentImplementationState: "IDEA";
  risk: { level: IntentRisk; reasonCodes: string[] };
  data: { classes: IntentDataClass[]; reasonCodes: string[] };
  technology: {
    candidate: TechnologyLibraryEntry;
    assessment: TechnologyLibraryAssessment;
  };
  agent: {
    state: "not_issued";
    primaryRole: SwarmRole;
    requestedCapabilities: AgentCapabilityScope[];
    requestedBudgetLimit: 0;
    budgetUnit: "pantavion_compute_units";
    ownerApprovalRequired: true;
  };
  disconnectedEdge: {
    disposition: "blocked";
    executionMode: "ephemeral_sandbox_only";
    networkPolicy: "deny_by_default";
    maximumDurationSeconds: 0;
    signedPayloadRequired: true;
    replayProtectionRequired: true;
    rollbackReceiptRequired: true;
    eligible: false;
    blockers: string[];
    productionWriteAuthorized: false;
  };
  verification: {
    requiredGates: string[];
    nextPermittedLifecycleStateAfterScopedImplementation: "CODED";
    testedPromotionRequiresExternalEvidence: true;
  };
  ownerControl: {
    audience: "founder_only";
    state: "awaiting_owner";
    founderDecisionRequired: true;
    approvalRecorded: false;
    approvalIdentity: null;
    approvedAt: null;
    releaseAuthorized: false;
  };
  previousReadinessDigest: string | null;
  readinessDigest: string;
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
    if (!Number.isFinite(value)) throw new Error("recovery_readiness_non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return "{" + entries
      .map(([key, entry]) => JSON.stringify(key) + ":" + canonicalJson(entry))
      .join(",") + "}";
  }
  throw new Error("recovery_readiness_unsupported_digest_value");
}

function assertSha256(label: string, value: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error(label + "_must_be_sha256");
}

function assertGitCommitSha(label: string, value: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(label + "_must_be_git_commit_sha");
}

function classifyRisk(route: PantavionRecoveryCanonicalBuildRoute): {
  level: IntentRisk;
  reasonCodes: string[];
} {
  if (route.artifactType === "database-migration" || route.capability === "delete") {
    return { level: "critical", reasonCodes: ["destructive_or_schema_change"] };
  }
  if (CRITICAL_MODULES.has(route.module)) {
    return { level: "critical", reasonCodes: ["critical_domain"] };
  }
  if (HIGH_MODULES.has(route.module)) {
    return { level: "high", reasonCodes: ["sensitive_domain"] };
  }
  return { level: "medium", reasonCodes: ["bounded_internal_domain"] };
}

function classifyData(route: PantavionRecoveryCanonicalBuildRoute): {
  classes: IntentDataClass[];
  reasonCodes: string[];
} {
  if (REGULATED_MODULES.has(route.module)) {
    return { classes: ["regulated"], reasonCodes: ["regulated_domain_default"] };
  }
  if (SENSITIVE_MODULES.has(route.module)) {
    return { classes: ["sensitive"], reasonCodes: ["sensitive_domain_default"] };
  }
  return { classes: ["private"], reasonCodes: ["recovered_material_private_by_default"] };
}

function derivePrimaryRole(route: PantavionRecoveryCanonicalBuildRoute): SwarmRole {
  if (
    route.module === "Safety / Trust / Minors" ||
    route.module === "Identity / Auth / Consent" ||
    route.capability === "protect"
  ) return "security";
  if (route.artifactType === "runtime-evidence") return "verifier";
  if (route.artifactType === "requirement-document") return "planner";
  if (
    route.module === "Maps / World / Water" ||
    route.module === "SOS / Crisis" ||
    route.module === "Interpreter / Translation"
  ) return "domain_specialist";
  return "builder";
}

function createTechnologyCandidate(
  route: PantavionRecoveryCanonicalBuildRoute,
): TechnologyLibraryEntry {
  return {
    id: "recovery_technology_" + sha256(canonicalJson(route)),
    name: route.feature ?? route.canonicalTarget,
    capability: route.capability,
    source: "pantavion_native",
    maturity: "research",
    commercialUseAllowed: false,
    sourceAvailable: false,
    reversibleIntegration: false,
    securityReviewed: false,
    privacyReviewed: false,
    evidence: [],
  };
}

export function createPantavionRecoveryBuildReadinessPacket(input: {
  order: PantavionRecoveryBuildOrderReadinessInput;
  expectedOrdinal: number;
  previousReadinessDigest: string | null;
}): PantavionRecoveryBuildReadinessPacket {
  const { order } = input;
  if (order.buildOrderOrdinal !== input.expectedOrdinal) {
    throw new Error("recovery_readiness_ordinal_mismatch");
  }
  if (derivePantavionRecoveryBuildOrderId(order.route) !== order.buildOrderId) {
    throw new Error("recovery_readiness_build_order_identity_mismatch");
  }
  assertSha256("recovery_readiness_build_order_digest", order.buildOrderDigest);
  assertSha256(
    "recovery_readiness_membership_fingerprint",
    order.membership.orderedMemberWorkUnitIdFingerprint,
  );
  if (!Number.isInteger(order.membership.memberCount) || order.membership.memberCount < 1) {
    throw new Error("recovery_readiness_member_count_invalid");
  }
  if (
    order.sovereignDisposition !== "awaiting_owner" ||
    order.implementationState !== "IDEA" ||
    order.ownerApprovalRequired !== true ||
    order.technologyReadiness !== "hold"
  ) throw new Error("recovery_readiness_source_gate_mismatch");
  if (
    order.executionAuthority ||
    order.codeMutationAuthority ||
    order.productionWriteAuthority ||
    order.mergeAuthority ||
    order.deploymentAuthority ||
    order.publicExposureAuthority ||
    order.releaseAuthority
  ) throw new Error("recovery_readiness_source_authority_escalation");
  if (input.expectedOrdinal === 1) {
    if (input.previousReadinessDigest !== null) {
      throw new Error("recovery_readiness_first_chain_must_be_empty");
    }
  } else {
    if (input.previousReadinessDigest === null) {
      throw new Error("recovery_readiness_previous_digest_required");
    }
    assertSha256("recovery_readiness_previous_digest", input.previousReadinessDigest);
  }

  const technologyCandidate = createTechnologyCandidate(order.route);
  const unsigned = {
    marker: "pantavion_recovery_build_readiness_packet_v1" as const,
    buildOrderOrdinal: order.buildOrderOrdinal,
    buildOrderId: order.buildOrderId,
    buildOrderDigest: order.buildOrderDigest,
    route: order.route,
    membership: order.membership,
    currentImplementationState: "IDEA" as const,
    risk: classifyRisk(order.route),
    data: classifyData(order.route),
    technology: {
      candidate: technologyCandidate,
      assessment: assessTechnologyLibraryEntry(technologyCandidate),
    },
    agent: {
      state: "not_issued" as const,
      primaryRole: derivePrimaryRole(order.route),
      requestedCapabilities: [{
        capability: order.route.capability,
        scope: order.route.canonicalTarget,
        access: "write" as const,
      }],
      requestedBudgetLimit: 0 as const,
      budgetUnit: "pantavion_compute_units" as const,
      ownerApprovalRequired: true as const,
    },
    disconnectedEdge: {
      disposition: "blocked" as const,
      executionMode: "ephemeral_sandbox_only" as const,
      networkPolicy: "deny_by_default" as const,
      maximumDurationSeconds: 0 as const,
      signedPayloadRequired: true as const,
      replayProtectionRequired: true as const,
      rollbackReceiptRequired: true as const,
      eligible: false as const,
      blockers: [
        "owner_approval_missing",
        "technology_assessment_incomplete",
        "capability_grant_missing",
        "budget_grant_missing",
        "signed_payload_missing",
      ],
      productionWriteAuthorized: false as const,
    },
    verification: {
      requiredGates: [
        "source_binding",
        "unit_tests",
        "typecheck",
        "security_review",
        "production_build",
        "rollback_receipt",
        "exact_revision_evidence",
      ],
      nextPermittedLifecycleStateAfterScopedImplementation: "CODED" as const,
      testedPromotionRequiresExternalEvidence: true as const,
    },
    ownerControl: {
      audience: "founder_only" as const,
      state: "awaiting_owner" as const,
      founderDecisionRequired: true as const,
      approvalRecorded: false as const,
      approvalIdentity: null,
      approvedAt: null,
      releaseAuthorized: false as const,
    },
    previousReadinessDigest: input.previousReadinessDigest,
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

  return { ...unsigned, readinessDigest: sha256(canonicalJson(unsigned)) };
}

export function createPantavionRecoveryBuildReadinessIndex(input: {
  source: {
    repository: string;
    parentPr: number;
    parentRevision: string;
    buildOrderIndexDigest: string;
    dispatchPr: number;
    dispatchRevision: string;
    dispatchArtifactId: number;
    dispatchArtifactArchiveSha256: string;
  };
  corpus: {
    sourceRecordCount: number;
    classifiedCandidateCount: number;
    governedHoldCount: number;
    recursiveProvenanceCount: number;
  };
  orders: readonly PantavionRecoveryBuildOrderReadinessInput[];
}) {
  assertGitCommitSha("recovery_readiness_parent_revision", input.source.parentRevision);
  assertSha256("recovery_readiness_build_order_index", input.source.buildOrderIndexDigest);
  assertGitCommitSha("recovery_readiness_dispatch_revision", input.source.dispatchRevision);
  assertSha256(
    "recovery_readiness_dispatch_artifact",
    input.source.dispatchArtifactArchiveSha256,
  );
  if (
    input.corpus.sourceRecordCount !== 82413 ||
    input.corpus.classifiedCandidateCount !== 31779 ||
    input.corpus.governedHoldCount !== 355 ||
    input.corpus.recursiveProvenanceCount !== 50279
  ) throw new Error("recovery_readiness_corpus_boundary_mismatch");
  if (input.orders.length !== 279) throw new Error("recovery_readiness_order_count_mismatch");

  let previousReadinessDigest: string | null = null;
  const packets = input.orders.map((order, offset) => {
    const packet = createPantavionRecoveryBuildReadinessPacket({
      order,
      expectedOrdinal: offset + 1,
      previousReadinessDigest,
    });
    previousReadinessDigest = packet.readinessDigest;
    return packet;
  });

  const countBy = <T>(items: readonly T[], selector: (item: T) => string) => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const key = selector(item);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  };
  const unsigned = {
    marker: "pantavion_recovery_build_readiness_index_v1" as const,
    source: input.source,
    corpus: {
      ...input.corpus,
      nonExecutablePreservedCount:
        input.corpus.governedHoldCount + input.corpus.recursiveProvenanceCount,
    },
    totals: {
      readinessPacketCount: packets.length,
      groupedCandidateCount: packets.reduce(
        (total, packet) => total + packet.membership.memberCount,
        0,
      ),
      riskCounts: countBy(packets, (packet) => packet.risk.level),
      dataClassCounts: countBy(packets, (packet) => packet.data.classes[0]),
      primaryRoleCounts: countBy(packets, (packet) => packet.agent.primaryRole),
      technologyHoldCount: packets.filter(
        (packet) => packet.technology.assessment.readiness === "hold",
      ).length,
      ownerDecisionRequiredCount: packets.filter(
        (packet) => packet.ownerControl.state === "awaiting_owner",
      ).length,
      agentGrantIssuedCount: 0 as const,
      edgeEligibleCount: 0 as const,
      executionReadyCount: 0 as const,
    },
    terminalReadinessDigest: previousReadinessDigest,
    packets,
    authority: {
      visibility: "founder_only" as const,
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
  return { ...unsigned, indexDigest: sha256(canonicalJson(unsigned)) };
}
