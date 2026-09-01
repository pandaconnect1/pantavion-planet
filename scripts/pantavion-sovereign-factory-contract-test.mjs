import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { evaluateReplacement } from "../core/sovereign/technology-factory.ts";
import { compileOutcomePlan } from "../core/sovereign/intent-to-outcome-fabric.ts";
import { activateEphemeralAgent, createEphemeralAgent, canAgentUseCapability } from "../core/sovereign/ephemeral-agent-swarm.ts";
import { evaluateIntentFirewall } from "../core/sovereign/intent-firewall.ts";
import {
  authorizeAgentCapability,
  consumeAuthorizedBudget,
  createAgentBudgetGrant,
} from "../core/sovereign/agent-capability-budget-control.ts";
import {
  createDisconnectedExecutionPacket,
  verifyDisconnectedExecutionPacket,
} from "../core/sovereign/edge-execution.ts";
import { assessTechnologyLibraryEntry } from "../core/sovereign/technology-library.ts";
import {
  createBoundedExecutionCheckpoint,
  createBoundedExecutionSession,
  recordBoundedStepCompletion,
  restoreBoundedExecutionSession,
  verifyBoundedExecutionCheckpoint,
  verifyBoundedExecutionSession,
} from "../core/sovereign/bounded-execution-runtime.ts";
import {
  durableBoundedCheckpointLabel,
  persistFencedBoundedExecutionCheckpoint,
  takeoverFencedBoundedExecutionSession,
} from "../core/sovereign/durable-bounded-execution-coordinator.ts";
import {
  advanceImplementationItem,
  canAdvanceImplementationState,
  sovereignFactoryImplementationItems,
  synchronizeImplementationItems,
  validateImplementationTruth,
} from "../core/pantavion/implementation-sync-registry.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectThrows(operation, message) {
  let threw = false;
  try {
    operation();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

async function expectRejects(operation, message) {
  let rejected = false;
  try {
    await operation();
  } catch {
    rejected = true;
  }
  assert(rejected, message);
}

function createTestKernelDecision(steps, estimatedCost = steps.length) {
  return {
    intentId: "intent_safe",
    disposition: "ready_for_bounded_execution",
    firewall: {
      intentId: "intent_safe",
      disposition: "allow",
      reasons: ["policy_satisfied"],
      auditRequired: true,
    },
    plan: {
      intentId: "intent_safe",
      state: "ready",
      steps,
      blockers: [],
      estimatedCost,
      requiresOwnerApproval: false,
    },
    blockers: [],
    mayMerge: false,
    mayDeployProduction: false,
    mayPublishToUsers: false,
  };
}

const firewallPolicy = {
  allowedJurisdictions: ["CY", "EU"],
  automaticCapabilities: ["classify", "read"],
  maximumAutomaticCost: 5,
  ownerApprovalRisks: ["high", "critical"],
  requireConsentForSensitiveData: true,
  productionMutationMode: "owner_approval",
  publicExposureMode: "owner_approval",
};
const safeIntentRequest = {
  intentId: "intent_safe",
  actorId: "founder_test",
  actorKind: "founder",
  jurisdiction: "CY",
  capabilities: ["classify"],
  dataClasses: ["private"],
  estimatedCost: 1,
  risk: "low",
  reversible: true,
  legalConsentRecorded: true,
  writesProduction: false,
  publishesToUsers: false,
  sendsExternalMessage: false,
  changesIdentityOrAccess: false,
};
assert(evaluateIntentFirewall(safeIntentRequest, firewallPolicy).disposition === "allow", "Safe bounded intent must pass.");
assert(
  evaluateIntentFirewall({ ...safeIntentRequest, writesProduction: true }, firewallPolicy).disposition === "owner_approval",
  "Production writes must wait for explicit owner approval.",
);
assert(
  evaluateIntentFirewall({ ...safeIntentRequest, actorId: "" }, firewallPolicy).disposition === "deny",
  "Missing actor identity must fail closed.",
);
assert(
  evaluateIntentFirewall({ ...safeIntentRequest, dataClasses: ["regulated"], legalConsentRecorded: false }, firewallPolicy).disposition === "deny",
  "Regulated data without consent must fail closed.",
);

const grant = createAgentBudgetGrant({
  id: "grant_1",
  agentId: "agent_1",
  intentId: "intent_safe",
  capabilities: [{ capability: "classify", scope: "recovery/corpus", access: "read" }],
  budgetLimit: 3,
  issuedAt: "2026-08-27T20:00:00.000Z",
  expiresAt: "2026-08-28T20:00:00.000Z",
});
const readRequest = {
  agentId: "agent_1",
  intentId: "intent_safe",
  capability: "classify",
  scope: "recovery/corpus",
  access: "read",
  cost: 2,
  now: "2026-08-27T21:00:00.000Z",
};
assert(authorizeAgentCapability(grant, readRequest).allowed, "Scoped read must be authorized.");
const spentGrant = consumeAuthorizedBudget(grant, readRequest);
assert(spentGrant.spent === 2, "Authorized cost must be recorded immutably.");
assert(
  !authorizeAgentCapability(spentGrant, { ...readRequest, cost: 2 }).allowed,
  "Agent must stop at its budget boundary.",
);
assert(
  !authorizeAgentCapability(grant, { ...readRequest, access: "write" }).allowed,
  "Read grant must never authorize writes.",
);

const edgeTask = {
  id: "edge_task_1",
  intentId: "intent_safe",
  capability: "classify",
  payload: { batch: 55, mode: "verify" },
  deterministic: true,
  reversible: true,
  requiresNetwork: false,
  writesProduction: false,
  issuedAt: "2026-08-27T20:00:00.000Z",
  expiresAt: "2026-08-28T20:00:00.000Z",
};
const edgePolicy = {
  allowedCapabilities: ["classify"],
  maximumPayloadBytes: 1024,
};
const packet = createDisconnectedExecutionPacket(edgeTask, edgePolicy);
assert(
  verifyDisconnectedExecutionPacket(packet, "2026-08-27T21:00:00.000Z", edgePolicy).valid,
  "Untampered offline packet must verify.",
);
assert(
  !verifyDisconnectedExecutionPacket(
    packet,
    "2026-08-27T21:00:00.000Z",
    edgePolicy,
    new Set([packet.payloadDigest]),
  ).valid,
  "Consumed offline packet must be rejected as replay.",
);
expectThrows(
  () => createDisconnectedExecutionPacket({ ...edgeTask, writesProduction: true }, { allowedCapabilities: ["classify"], maximumPayloadBytes: 1024 }),
  "Offline execution must reject production writes.",
);

const completeTechnology = {
  id: "tech_local_runtime",
  name: "Local runtime",
  capability: "model_execution",
  source: "open_source",
  maturity: "prototype",
  licenseId: "Apache-2.0",
  commercialUseAllowed: true,
  sourceAvailable: true,
  reversibleIntegration: true,
  securityReviewed: true,
  privacyReviewed: true,
  evidence: [
    { kind: "source", reference: "source-digest", observedAt: "2026-08-27T20:00:00.000Z" },
    { kind: "benchmark", reference: "benchmark-1", observedAt: "2026-08-27T20:00:00.000Z" },
    { kind: "security", reference: "security-1", observedAt: "2026-08-27T20:00:00.000Z" },
    { kind: "privacy", reference: "privacy-1", observedAt: "2026-08-27T20:00:00.000Z" },
    { kind: "license", reference: "Apache-2.0", observedAt: "2026-08-27T20:00:00.000Z" },
  ],
};
const technologyAssessment = assessTechnologyLibraryEntry(completeTechnology);
assert(technologyAssessment.readiness === "prototype_ready", "Evidence-backed open technology should become prototype-ready.");
assert(technologyAssessment.deploymentAuthorized === false, "Technology Library must never imply deployment authorization.");
assert(
  assessTechnologyLibraryEntry({ ...completeTechnology, evidence: [] }).readiness === "hold",
  "Technology without evidence must remain on hold.",
);

const incumbent = {
  id: "external_incumbent",
  capability: "translation",
  source: "external_provider",
  provider: "provider-a",
  quality: 90,
  latencyMs: 300,
  unitCost: 5,
  privacyScore: 70,
  resilienceScore: 70,
  sovereigntyScore: 30,
  reversible: true,
};
const replacement = { ...incumbent, id: "native_candidate", source: "pantavion_native", quality: 92, unitCost: 1, sovereigntyScore: 95 };
assert(
  evaluateReplacement(incumbent, replacement, {
    minimumQuality: 85,
    minimumPrivacy: 65,
    minimumResilience: 65,
    maximumUnitCost: 6,
    ownerApprovalForExternalReplacement: true,
  }).decision === "owner_approval",
  "External replacement must stop at the owner gate.",
);

const plan = compileOutcomePlan(
  { id: "intent_safe", userId: "founder_test", text: "verify", desiredOutcome: "verified classification" },
  [{ id: "step_1", title: "Verify", kind: "workflow", capability: "classify", risk: "high", reversible: true, requiresOwnerApproval: false, dependsOn: [] }],
  1,
  { ownerApprovalRisks: ["high", "critical"], requireApprovalForIrreversible: true, maximumAutomaticCost: 5 },
);
assert(plan.requiresOwnerApproval, "High-risk outcome plan must wait for owner approval.");

const createdEphemeralAgent = createEphemeralAgent({
  id: "agent_1",
  parentIntentId: "intent_safe",
  role: "verifier",
  capabilities: [{ capability: "classify", scope: "recovery/corpus", expiresAt: "2026-08-28T20:00:00.000Z" }],
  budget: 3,
  createdAt: "2026-08-27T20:00:00.000Z",
  expiresAt: "2026-08-28T20:00:00.000Z",
});
assert(
  !canAgentUseCapability(
    createdEphemeralAgent,
    "classify",
    "recovery/corpus",
    new Date("2026-08-27T21:00:00.000Z"),
  ),
  "Created agents must not execute before explicit activation.",
);
const ephemeralAgent = activateEphemeralAgent(
  createdEphemeralAgent,
  new Date("2026-08-27T21:00:00.000Z"),
);
assert(
  canAgentUseCapability(
    ephemeralAgent,
    "classify",
    "recovery/corpus",
    new Date("2026-08-27T21:00:00.000Z"),
  ),
  "Activated ephemeral agent must use only its bounded live scope.",
);


const boundedStep = {
  id: "bounded_classify",
  title: "Classify preserved recovery evidence",
  kind: "workflow",
  capability: "classify",
  risk: "low",
  reversible: true,
  requiresOwnerApproval: false,
  dependsOn: [],
};
const boundedDecision = createTestKernelDecision([boundedStep], 1);
const boundedSession = createBoundedExecutionSession({
  id: "bounded_session_1",
  decision: boundedDecision,
  agent: ephemeralAgent,
  grant,
  maximumEvidenceBytes: 1024,
  now: "2026-08-27T21:00:00.000Z",
});
const completedBoundedSession = recordBoundedStepCompletion(boundedSession, {
  sessionId: boundedSession.id,
  intentId: boundedSession.intentId,
  agentId: ephemeralAgent.id,
  stepId: boundedStep.id,
  scope: "recovery/corpus",
  access: "read",
  cost: 1,
  observedAt: "2026-08-27T21:05:00.000Z",
  outputBytes: Buffer.from("evidence-backed-classification"),
  auditReference: "audit://bounded-session-1",
  rollbackReference: "rollback://read-only-no-write",
});
assert(
  completedBoundedSession.state === "completed",
  "A dependency-ready bounded step must produce a completed session.",
);
assert(
  completedBoundedSession.grant.spent === 1 &&
    completedBoundedSession.receipts[0]?.outputDigestVerifiedFromBytes === true,
  "Bounded completion must consume the exact budget and hash the real output bytes.",
);
assert(
  !completedBoundedSession.mayMerge &&
    !completedBoundedSession.mayDeployProduction &&
    !completedBoundedSession.mayPublishToUsers &&
    completedBoundedSession.receipts[0]?.releaseAuthority === false,
  "Bounded execution must never imply protected release authority.",
);
assert(
  verifyBoundedExecutionSession(completedBoundedSession).valid,
  "The complete bounded execution receipt chain must verify.",
);
expectThrows(
  () =>
    recordBoundedStepCompletion(boundedSession, {
      sessionId: boundedSession.id,
      intentId: boundedSession.intentId,
      agentId: "different_agent",
      stepId: boundedStep.id,
      scope: "recovery/corpus",
      access: "read",
      cost: 1,
      observedAt: "2026-08-27T21:05:00.000Z",
      outputBytes: Buffer.from("invalid-agent"),
      auditReference: "audit://denied",
      rollbackReference: "rollback://denied",
    }),
  "A completion from a different agent identity must fail closed.",
);
const dependencyDecision = createTestKernelDecision(
  [
    boundedStep,
    {
      ...boundedStep,
      id: "bounded_verify",
      title: "Verify classification",
      dependsOn: [boundedStep.id],
    },
  ],
  2,
);
const dependencySession = createBoundedExecutionSession({
  id: "bounded_session_dependency",
  decision: dependencyDecision,
  agent: ephemeralAgent,
  grant,
  maximumEvidenceBytes: 1024,
  now: "2026-08-27T21:00:00.000Z",
});
expectThrows(
  () =>
    recordBoundedStepCompletion(dependencySession, {
      sessionId: dependencySession.id,
      intentId: dependencySession.intentId,
      agentId: ephemeralAgent.id,
      stepId: "bounded_verify",
      scope: "recovery/corpus",
      access: "read",
      cost: 1,
      observedAt: "2026-08-27T21:05:00.000Z",
      outputBytes: Buffer.from("out-of-order"),
      auditReference: "audit://out-of-order",
      rollbackReference: "rollback://read-only-no-write",
    }),
  "A dependent step must never execute before its prerequisite receipt.",
);
const tamperedBoundedSession = {
  ...completedBoundedSession,
  receipts: [
    {
      ...completedBoundedSession.receipts[0],
      auditReference: "audit://tampered",
    },
  ],
};
assert(
  !verifyBoundedExecutionSession(tamperedBoundedSession).valid,
  "Tampering with a bounded execution receipt must break verification.",
);

const rootBoundedCheckpoint = createBoundedExecutionCheckpoint({
  session: boundedSession,
  sequence: 1,
  fencingToken: 7,
  workerId: "worker_alpha",
  observedAt: "2026-08-27T21:01:00.000Z",
});
assert(
  verifyBoundedExecutionCheckpoint(rootBoundedCheckpoint).valid &&
    rootBoundedCheckpoint.releaseAuthority === false,
  "A root bounded checkpoint must be self-verifying and carry no release authority.",
);
const restoredBoundedSession = restoreBoundedExecutionSession(
  rootBoundedCheckpoint,
  {
    sessionId: boundedSession.id,
    intentId: boundedSession.intentId,
    agentId: boundedSession.agent.id,
    planFingerprint: boundedSession.planFingerprint,
    trustedCheckpointDigest: rootBoundedCheckpoint.checkpointDigest,
    minimumSequence: 1,
    minimumFencingToken: 7,
  },
);
const resumedCompletedSession = recordBoundedStepCompletion(
  restoredBoundedSession,
  {
    sessionId: restoredBoundedSession.id,
    intentId: restoredBoundedSession.intentId,
    agentId: restoredBoundedSession.agent.id,
    stepId: boundedStep.id,
    scope: "recovery/corpus",
    access: "read",
    cost: 1,
    observedAt: "2026-08-27T21:05:00.000Z",
    outputBytes: Buffer.from("checkpoint-resumed-classification"),
    auditReference: "audit://checkpoint-resume",
    rollbackReference: "rollback://read-only-no-write",
  },
);
const completedBoundedCheckpoint = createBoundedExecutionCheckpoint({
  session: resumedCompletedSession,
  sequence: 2,
  fencingToken: 7,
  workerId: "worker_alpha",
  observedAt: "2026-08-27T21:06:00.000Z",
  previous: rootBoundedCheckpoint,
});
assert(
  verifyBoundedExecutionCheckpoint(
    completedBoundedCheckpoint,
    rootBoundedCheckpoint,
  ).valid,
  "A resumed completion must advance the checkpoint digest chain exactly once.",
);
const restoredCompletedSession = restoreBoundedExecutionSession(
  completedBoundedCheckpoint,
  {
    sessionId: boundedSession.id,
    intentId: boundedSession.intentId,
    agentId: boundedSession.agent.id,
    planFingerprint: boundedSession.planFingerprint,
    trustedCheckpointDigest: completedBoundedCheckpoint.checkpointDigest,
    minimumSequence: 2,
    minimumFencingToken: 7,
  },
);
assert(
  restoredCompletedSession.state === "completed",
  "The trusted checkpoint head must restore the exact completed session state.",
);
const tamperedBoundedCheckpoint = {
  ...completedBoundedCheckpoint,
  session: {
    ...completedBoundedCheckpoint.session,
    receipts: [
      {
        ...completedBoundedCheckpoint.session.receipts[0],
        auditReference: "audit://tampered-checkpoint",
      },
    ],
  },
};
assert(
  !verifyBoundedExecutionCheckpoint(
    tamperedBoundedCheckpoint,
    rootBoundedCheckpoint,
  ).valid,
  "Nested checkpoint session tampering must invalidate the checkpoint.",
);
expectThrows(
  () =>
    restoreBoundedExecutionSession(rootBoundedCheckpoint, {
      sessionId: boundedSession.id,
      intentId: boundedSession.intentId,
      agentId: boundedSession.agent.id,
      planFingerprint: boundedSession.planFingerprint,
      trustedCheckpointDigest: completedBoundedCheckpoint.checkpointDigest,
      minimumSequence: 2,
      minimumFencingToken: 7,
    }),
  "A stale checkpoint must not restore after a newer trusted head exists.",
);
expectThrows(
  () =>
    createBoundedExecutionCheckpoint({
      session: resumedCompletedSession,
      sequence: 3,
      fencingToken: 7,
      workerId: "worker_beta",
      observedAt: "2026-08-27T21:07:00.000Z",
      previous: completedBoundedCheckpoint,
    }),
  "A worker failover must advance the fencing token.",
);
const failoverBoundedCheckpoint = createBoundedExecutionCheckpoint({
  session: resumedCompletedSession,
  sequence: 3,
  fencingToken: 8,
  workerId: "worker_beta",
  observedAt: "2026-08-27T21:07:00.000Z",
  previous: completedBoundedCheckpoint,
});
assert(
  verifyBoundedExecutionCheckpoint(
    failoverBoundedCheckpoint,
    completedBoundedCheckpoint,
  ).valid,
  "A worker failover with a higher fencing token must preserve the checkpoint chain.",
);
const failoverRestoredSession = restoreBoundedExecutionSession(
  failoverBoundedCheckpoint,
  {
    sessionId: boundedSession.id,
    intentId: boundedSession.intentId,
    agentId: boundedSession.agent.id,
    planFingerprint: boundedSession.planFingerprint,
    trustedCheckpointDigest: failoverBoundedCheckpoint.checkpointDigest,
    minimumSequence: 3,
    minimumFencingToken: 8,
  },
);
assert(
  failoverRestoredSession.state === "completed" &&
    failoverRestoredSession.mayMerge === false &&
    failoverRestoredSession.mayDeployProduction === false &&
    failoverRestoredSession.mayPublishToUsers === false,
  "Failover restore must preserve state while retaining all founder release locks.",
);

class DurableBoundedCheckpointTestStore {
  constructor(binding, fence) {
    this.activeFence = { ...fence };
    this.record = {
      executionId: binding.executionId,
      idempotencyKey: binding.idempotencyKey,
      taskName: "sovereign-bounded-execution",
      status: "running",
      createdAt: "2026-08-27T21:00:00.000Z",
      updatedAt: "2026-08-27T21:00:00.000Z",
      attempt: 1,
      maxAttempts: 3,
      checkpoints: [],
    };
  }

  async get(executionId) {
    return executionId === this.record.executionId
      ? structuredClone(this.record)
      : null;
  }

  async heartbeatFenced(fence, leaseMs = 120_000) {
    if (
      fence.executionId !== this.record.executionId ||
      fence.ownerId !== this.activeFence.ownerId ||
      fence.fencingToken !== this.activeFence.fencingToken ||
      this.record.status !== "running"
    ) {
      throw new Error("stale_execution_fence");
    }
    if (!Number.isFinite(leaseMs) || leaseMs <= 0) {
      throw new Error("lease_duration_invalid");
    }
    return true;
  }

  async checkpointFenced(fence, label, state = {}) {
    await this.heartbeatFenced(fence);
    const checkpoint = state.checkpoint;
    if (
      !checkpoint ||
      typeof checkpoint !== "object" ||
      typeof checkpoint.observedAt !== "string"
    ) {
      throw new Error("checkpoint_state_invalid");
    }
    const durableCheckpoint = {
      id: this.record.executionId + ":" + (this.record.checkpoints.length + 1),
      at: checkpoint.observedAt,
      label,
      state: structuredClone(state),
    };
    this.record = {
      ...this.record,
      updatedAt: checkpoint.observedAt,
      checkpoints: [...this.record.checkpoints, durableCheckpoint],
    };
    return structuredClone(this.record);
  }

  takeover(fence) {
    this.activeFence = { ...fence };
    this.record = {
      ...this.record,
      status: "running",
      attempt: this.record.attempt + 1,
    };
  }

  tamperLatestReceipt() {
    const latest = this.record.checkpoints.at(-1);
    latest.state.checkpoint.session.receipts[0].auditReference =
      "audit://tampered-durable-state";
  }

  checkpointCount() {
    return this.record.checkpoints.filter(
      (checkpoint) => checkpoint.label === durableBoundedCheckpointLabel,
    ).length;
  }

  latestEnvelope() {
    return this.record.checkpoints.at(-1)?.state;
  }
}

const durableFenceAlpha = {
  executionId: "durable_factory_execution_1",
  ownerId: "worker_alpha",
  fencingToken: 7,
};
const durableFenceBeta = {
  executionId: durableFenceAlpha.executionId,
  ownerId: "worker_beta",
  fencingToken: 8,
};
const durableBoundedRuntime = {
  createCheckpoint: createBoundedExecutionCheckpoint,
  restoreSession: restoreBoundedExecutionSession,
  verifyCheckpoint: verifyBoundedExecutionCheckpoint,
  verifySession: verifyBoundedExecutionSession,
};
const durableBinding = {
  executionId: durableFenceAlpha.executionId,
  idempotencyKey: "factory:bounded-session-1",
  sessionId: boundedSession.id,
  intentId: boundedSession.intentId,
  agentId: boundedSession.agent.id,
  planFingerprint: boundedSession.planFingerprint,
};
const durableCheckpointStore = new DurableBoundedCheckpointTestStore(
  durableBinding,
  durableFenceAlpha,
);
const persistedDurableRoot =
  await persistFencedBoundedExecutionCheckpoint(durableBoundedRuntime, durableCheckpointStore, {
    binding: durableBinding,
    fence: durableFenceAlpha,
    operationId: "bounded-session-root",
    session: boundedSession,
    observedAt: "2026-08-27T21:01:00.000Z",
  });
assert(
  persistedDurableRoot.checkpoint.sequence === 1 &&
    persistedDurableRoot.checkpoint.fencingToken === 7 &&
    persistedDurableRoot.deduplicated === false &&
    durableCheckpointStore.checkpointCount() === 1 &&
    durableCheckpointStore.latestEnvelope().executionAuthority === false &&
    durableCheckpointStore.latestEnvelope().releaseAuthority === false,
  "The active durable fence must persist one founder-locked root checkpoint.",
);
const deduplicatedDurableRoot =
  await persistFencedBoundedExecutionCheckpoint(durableBoundedRuntime, durableCheckpointStore, {
    binding: durableBinding,
    fence: durableFenceAlpha,
    operationId: "bounded-session-root",
    session: boundedSession,
    observedAt: "2026-08-27T21:01:00.000Z",
  });
assert(
  deduplicatedDurableRoot.deduplicated === true &&
    deduplicatedDurableRoot.checkpoint.checkpointDigest ===
      persistedDurableRoot.checkpoint.checkpointDigest &&
    durableCheckpointStore.checkpointCount() === 1,
  "A repeated durable checkpoint operation must return the exact persisted receipt without duplication.",
);
await expectRejects(
  () =>
    persistFencedBoundedExecutionCheckpoint(durableBoundedRuntime, durableCheckpointStore, {
      binding: {
        ...durableBinding,
        idempotencyKey: "factory:different-execution",
      },
      fence: durableFenceAlpha,
      operationId: "wrong-binding",
      session: boundedSession,
      observedAt: "2026-08-27T21:02:00.000Z",
    }),
  "A durable record with a different idempotency identity must fail closed.",
);
const persistedDurableCompletion =
  await persistFencedBoundedExecutionCheckpoint(durableBoundedRuntime, durableCheckpointStore, {
    binding: durableBinding,
    fence: durableFenceAlpha,
    operationId: "bounded-session-completed",
    session: resumedCompletedSession,
    observedAt: "2026-08-27T21:06:00.000Z",
  });
assert(
  persistedDurableCompletion.checkpoint.sequence === 2 &&
    persistedDurableCompletion.checkpoint.session.state === "completed" &&
    durableCheckpointStore.checkpointCount() === 2,
  "Durable persistence must advance the cryptographic chain with the exact completed session.",
);

durableCheckpointStore.takeover(durableFenceBeta);
await expectRejects(
  () =>
    persistFencedBoundedExecutionCheckpoint(durableBoundedRuntime, durableCheckpointStore, {
      binding: durableBinding,
      fence: durableFenceAlpha,
      operationId: "stale-worker-write",
      session: resumedCompletedSession,
      observedAt: "2026-08-27T21:07:00.000Z",
    }),
  "The previous worker must lose all checkpoint authority after fenced takeover.",
);
const durableTakeover = await takeoverFencedBoundedExecutionSession(
  durableBoundedRuntime,
  durableCheckpointStore,
  {
    binding: durableBinding,
    fence: durableFenceBeta,
    operationId: "worker-beta-takeover",
    observedAt: "2026-08-27T21:07:00.000Z",
  },
);
assert(
  durableTakeover.checkpoint.sequence === 3 &&
    durableTakeover.checkpoint.fencingToken === 8 &&
    durableTakeover.checkpoint.workerId === "worker_beta" &&
    durableTakeover.session.state === "completed" &&
    durableTakeover.session.mayMerge === false &&
    durableTakeover.session.mayDeployProduction === false &&
    durableTakeover.session.mayPublishToUsers === false &&
    durableCheckpointStore.checkpointCount() === 3,
  "A higher fenced worker must roll the trusted durable head forward before restoring it.",
);
const repeatedDurableTakeover =
  await takeoverFencedBoundedExecutionSession(durableBoundedRuntime, durableCheckpointStore, {
    binding: durableBinding,
    fence: durableFenceBeta,
    operationId: "worker-beta-takeover",
    observedAt: "2026-08-27T21:07:00.000Z",
  });
assert(
  repeatedDurableTakeover.deduplicated === true &&
    repeatedDurableTakeover.checkpoint.checkpointDigest ===
      durableTakeover.checkpoint.checkpointDigest &&
    durableCheckpointStore.checkpointCount() === 3,
  "A retried takeover must be idempotent and must not fork the durable checkpoint chain.",
);

const tamperedDurableStore = new DurableBoundedCheckpointTestStore(
  durableBinding,
  durableFenceAlpha,
);
await persistFencedBoundedExecutionCheckpoint(durableBoundedRuntime, tamperedDurableStore, {
  binding: durableBinding,
  fence: durableFenceAlpha,
  operationId: "tamper-root",
  session: resumedCompletedSession,
  observedAt: "2026-08-27T21:06:00.000Z",
});
tamperedDurableStore.tamperLatestReceipt();
tamperedDurableStore.takeover(durableFenceBeta);
await expectRejects(
  () =>
    takeoverFencedBoundedExecutionSession(durableBoundedRuntime, tamperedDurableStore, {
      binding: durableBinding,
      fence: durableFenceBeta,
      operationId: "tampered-takeover",
      observedAt: "2026-08-27T21:07:00.000Z",
    }),
  "A tampered durable receipt must never fall back to an older checkpoint or restore.",
);
const protectedDecision = {
  ...createTestKernelDecision([boundedStep], 1),
  disposition: "awaiting_owner",
  firewall: {
    intentId: "intent_safe",
    disposition: "owner_approval",
    reasons: ["production_mutation_requires_owner"],
    auditRequired: true,
  },
  blockers: ["production_mutation_requires_owner"],
};
expectThrows(
  () =>
    createBoundedExecutionSession({
      id: "bounded_session_protected",
      decision: protectedDecision,
      agent: ephemeralAgent,
      grant,
      maximumEvidenceBytes: 1024,
      now: "2026-08-27T21:00:00.000Z",
    }),
  "Owner-controlled production work must never enter bounded automatic execution.",
);

const codedItem = {
  id: "intent-firewall",
  title: "Intent Firewall",
  domain: "sovereign",
  state: "coded",
  source: "core/sovereign/intent-firewall.ts",
  evidenceRecords: [{ kind: "code", reference: "core/sovereign/intent-firewall.ts", recordedAt: "2026-08-27T20:00:00.000Z" }],
  updatedAt: "2026-08-27T20:00:00.000Z",
};
assert(validateImplementationTruth(codedItem).length === 0, "Coded state needs code evidence.");
assert(canAdvanceImplementationState("coded", "tested"), "Sequential promotion should be allowed.");
assert(!canAdvanceImplementationState("coded", "deployed"), "Truth chain must not skip TESTED and MERGED.");
const testedItem = advanceImplementationItem(
  codedItem,
  "tested",
  [{ kind: "test", reference: "test:sovereign-factory-contract", recordedAt: "2026-08-27T21:00:00.000Z" }],
  "2026-08-27T21:00:00.000Z",
);
assert(testedItem.state === "tested", "Test evidence must permit the CODED to TESTED transition.");
expectThrows(
  () => advanceImplementationItem(codedItem, "deployed", [], "2026-08-27T21:00:00.000Z"),
  "Implementation state must not skip intermediate truth states.",
);
const falseLive = { ...codedItem, state: "verified_live", updatedAt: "2026-08-27T22:00:00.000Z" };
assert(validateImplementationTruth(falseLive).length > 0, "VERIFIED_LIVE without exact evidence must be rejected.");
assert(
  synchronizeImplementationItems([falseLive])[0].state === "blocked",
  "Registry must quarantine a false completion claim.",
);

const mergedRegistryIds = [
  "canonical-conversation-intake",
  "universal-artifact-intake",
  "universal-raw-artifact-upload",
  "sovereign-technology-factory",
  "intent-to-outcome-fabric",
  "ephemeral-agent-swarm",
  "intent-firewall",
  "agent-capability-budget",
  "disconnected-edge-execution",
  "technology-library",
  "bounded-execution-runtime",
  "bounded-execution-checkpointing",
  "durable-bounded-execution-coordinator",
  "sovereign-capability-kernel",
  "implementation-sync",
  "owner-implementation-surface",
  "recovery-corpus-runtime-fabric",
  "privileged-mutation-boundary",
  "recovery-partition-scheduler",
  "recovery-source-batch-index",
  "recovery-partition-inventory",
  "recovery-source-index-preservation",
  "translation-e2e-cooldown",
  "recovery-fenced-production-executor",
  "internal-scheduler-redundancy",
  "scheduler-history-admin-binding-repair",
];
for (const id of mergedRegistryIds) {
  const item = sovereignFactoryImplementationItems.find((candidate) => candidate.id === id);
  assert(item?.state === "merged", `${id} must be recorded as MERGED only.`);
  assert(validateImplementationTruth(item).length === 0, `${id} must carry code, test and merge evidence.`);
  assert(
    !["deployed", "verified_live"].includes(item.state),
    `${id} must not infer deployment or VERIFIED_LIVE from merge evidence.`,
  );
}

const testedRegistryIds = [
  "scheduler-single-credential-admin-repair",
  "recovery-partition-semantic-receipts",
  "recovery-implementation-planning",
  "recovery-sovereign-build-dispatch",
  "recovery-founder-build-order-surface",
  "recovery-sovereign-build-readiness",
  "recovery-founder-build-decision-receipts",
  "recovery-founder-scoped-build-capsules",
  "recovery-bounded-build-admission",
  "recovery-bounded-step-execution",
  "recovery-implementation-review-packets",
];
for (const id of testedRegistryIds) {
  const item = sovereignFactoryImplementationItems.find((candidate) => candidate.id === id);
  assert(item?.state === "tested", `${id} must remain TESTED and unmerged.`);
  assert(validateImplementationTruth(item).length === 0, `${id} must carry exact code and test evidence.`);
  assert(
    !["merged", "deployed", "verified_live"].includes(item.state),
    `${id} must not skip MERGED, DEPLOYED or VERIFIED_LIVE.`,
  );
}

const semanticReceipts = sovereignFactoryImplementationItems.find(
  (item) => item.id === "recovery-partition-semantic-receipts",
);
const implementationPlanning = sovereignFactoryImplementationItems.find(
  (item) => item.id === "recovery-implementation-planning",
);
const sovereignDispatch = sovereignFactoryImplementationItems.find(
  (item) => item.id === "recovery-sovereign-build-dispatch",
);
const founderBuildOrderSurface = sovereignFactoryImplementationItems.find(
  (item) => item.id === "recovery-founder-build-order-surface",
);
const sovereignReadiness = sovereignFactoryImplementationItems.find(
  (item) => item.id === "recovery-sovereign-build-readiness",
);
const founderBuildDecisions = sovereignFactoryImplementationItems.find(
  (item) => item.id === "recovery-founder-build-decision-receipts",
);
const founderScopedBuildCapsules = sovereignFactoryImplementationItems.find(
  (item) => item.id === "recovery-founder-scoped-build-capsules",
);
const boundedBuildAdmission = sovereignFactoryImplementationItems.find(
  (item) => item.id === "recovery-bounded-build-admission",
);
const boundedStepExecution = sovereignFactoryImplementationItems.find(
  (item) => item.id === "recovery-bounded-step-execution",
);
const implementationReviewPackets = sovereignFactoryImplementationItems.find(
  (item) => item.id === "recovery-implementation-review-packets",
);
assert(
  semanticReceipts?.evidence?.includes("records:82413") &&
    implementationPlanning?.evidence?.includes("records:82413") &&
    sovereignDispatch?.evidence?.includes("records:82413") &&
    founderBuildOrderSurface?.evidence?.includes("records:82413") &&
    sovereignReadiness?.evidence?.includes("records:82413") &&
    founderBuildDecisions?.evidence?.includes("records:82413") &&
    founderScopedBuildCapsules?.evidence?.includes("records:82413") &&
    boundedBuildAdmission?.evidence?.includes("records:82413") &&
    boundedStepExecution?.evidence?.includes("records:82413") &&
    implementationReviewPackets?.evidence?.includes("records:82413"),
  "All ten current recovery surfaces must preserve the exact 82,413-record boundary.",
);
assert(
  sovereignDispatch?.evidence?.includes("canonical_build_orders:279") &&
    sovereignDispatch?.evidence?.includes("awaiting_owner:279") &&
    sovereignDispatch?.evidence?.includes("execution_ready:0"),
  "Sovereign dispatch truth must expose all 279 owner-gated orders and zero execution authority.",
);
assert(
  founderBuildOrderSurface?.evidence?.includes("canonical_build_orders:279") &&
    founderBuildOrderSurface?.evidence?.includes("visibility:founder_only_aal2") &&
    founderBuildOrderSurface?.evidence?.includes("execution_ready:0"),
  "Founder build-order truth must expose all orders under AAL2 without execution authority.",
);
assert(
  sovereignReadiness?.evidence?.includes("readiness_packets:279") &&
    sovereignReadiness?.evidence?.includes("technology_hold:279") &&
    sovereignReadiness?.evidence?.includes("agent_grants:0") &&
    sovereignReadiness?.evidence?.includes("edge_eligible:0"),
  "Readiness truth must expose every packet and preserve all Technology, agent and edge gates.",
);
assert(
  founderBuildDecisions?.evidence?.includes("decision_sources:279") &&
    founderBuildDecisions?.evidence?.includes("visibility:founder_only_aal2") &&
    founderBuildDecisions?.evidence?.includes("same_origin_post:true") &&
    founderBuildDecisions?.evidence?.includes("execution_authority:0") &&
    founderBuildDecisions?.evidence?.includes("migration:authored_not_applied"),
  "Founder decision truth must bind all 279 readiness packets without implying runtime or production authority.",
);
assert(
  founderScopedBuildCapsules?.evidence?.includes("scoped_build_capsules:279") &&
    founderScopedBuildCapsules?.evidence?.includes("classified_members:31779") &&
    founderScopedBuildCapsules?.evidence?.includes("blocked_governed_hold:355") &&
    founderScopedBuildCapsules?.evidence?.includes("blocked_recursive_provenance:50279") &&
    founderScopedBuildCapsules?.evidence?.includes("synthetic_receipts_only:true") &&
    founderScopedBuildCapsules?.evidence?.includes("founder_approvals:0") &&
    founderScopedBuildCapsules?.evidence?.includes("technology_hold:279") &&
    founderScopedBuildCapsules?.evidence?.includes("agent_grants:0") &&
    founderScopedBuildCapsules?.evidence?.includes("budget_grants:0") &&
    founderScopedBuildCapsules?.evidence?.includes("executions:0") &&
    founderScopedBuildCapsules?.evidence?.includes("network_access:0") &&
    founderScopedBuildCapsules?.evidence?.includes("secrets_access:0") &&
    founderScopedBuildCapsules?.evidence?.includes("production_writes:0") &&
    founderScopedBuildCapsules?.evidence?.includes("merge_authority:0") &&
    founderScopedBuildCapsules?.evidence?.includes("deployment_authority:0") &&
    founderScopedBuildCapsules?.evidence?.includes("release_authority:0"),
  "Scoped-build capsule truth must preserve the complete corpus and every Founder, Technology, agent, network, secret, production and release gate.",
);

assert(
  boundedBuildAdmission?.evidence?.includes("bounded_admissions:279") &&
    boundedBuildAdmission?.evidence?.includes("classified_members:31779") &&
    boundedBuildAdmission?.evidence?.includes("blocked_governed_hold:355") &&
    boundedBuildAdmission?.evidence?.includes("blocked_recursive_provenance:50279") &&
    boundedBuildAdmission?.evidence?.includes("synthetic_inputs_only:true") &&
    boundedBuildAdmission?.evidence?.includes("bounded_sessions:279") &&
    boundedBuildAdmission?.evidence?.includes("completed_steps:0") &&
    boundedBuildAdmission?.evidence?.includes("execution_receipts:0") &&
    boundedBuildAdmission?.evidence?.includes("real_founder_approvals:0") &&
    boundedBuildAdmission?.evidence?.includes("real_technology_clearances:0") &&
    boundedBuildAdmission?.evidence?.includes("real_agent_grants:0") &&
    boundedBuildAdmission?.evidence?.includes("real_budget_grants:0") &&
    boundedBuildAdmission?.evidence?.includes("real_edge_packets:0") &&
    boundedBuildAdmission?.evidence?.includes("canonical_repository_writes:0") &&
    boundedBuildAdmission?.evidence?.includes("production_writes:0") &&
    boundedBuildAdmission?.evidence?.includes("merge_authority:0") &&
    boundedBuildAdmission?.evidence?.includes("deployment_authority:0") &&
    boundedBuildAdmission?.evidence?.includes("release_authority:0"),
  "Bounded-admission truth must cover the complete classified corpus while retaining zero real execution, repository, production and release authority.",
);

assert(
  boundedStepExecution?.evidence?.includes("bounded_sessions:279") &&
    boundedStepExecution?.evidence?.includes("classified_members:31779") &&
    boundedStepExecution?.evidence?.includes("bounded_step_receipts:1674") &&
    boundedStepExecution?.evidence?.includes("bounded_checkpoints:1953") &&
    boundedStepExecution?.evidence?.includes("blocked_governed_hold:355") &&
    boundedStepExecution?.evidence?.includes("blocked_recursive_provenance:50279") &&
    boundedStepExecution?.evidence?.includes("synthetic_inputs_only:true") &&
    boundedStepExecution?.evidence?.includes("real_founder_approvals:0") &&
    boundedStepExecution?.evidence?.includes("real_technology_clearances:0") &&
    boundedStepExecution?.evidence?.includes("real_agent_grants:0") &&
    boundedStepExecution?.evidence?.includes("real_budget_grants:0") &&
    boundedStepExecution?.evidence?.includes("real_edge_packets:0") &&
    boundedStepExecution?.evidence?.includes("real_code_mutations:0") &&
    boundedStepExecution?.evidence?.includes("canonical_repository_writes:0") &&
    boundedStepExecution?.evidence?.includes("production_writes:0") &&
    boundedStepExecution?.evidence?.includes("merge_authority:0") &&
    boundedStepExecution?.evidence?.includes("deployment_authority:0") &&
    boundedStepExecution?.evidence?.includes("release_authority:0") &&
    boundedStepExecution?.evidence?.includes("lifecycle_promotions:0"),
  "Bounded-step truth must record all synthetic receipts and checkpoints while retaining zero real mutation, production, release or lifecycle authority.",
);

assert(
  implementationReviewPackets?.evidence?.includes("implementation_review_packets:279") &&
    implementationReviewPackets?.evidence?.includes("classified_members:31779") &&
    implementationReviewPackets?.evidence?.includes("bounded_step_receipts:1674") &&
    implementationReviewPackets?.evidence?.includes("bounded_checkpoints:1953") &&
    implementationReviewPackets?.evidence?.includes("blocked_governed_hold:355") &&
    implementationReviewPackets?.evidence?.includes("blocked_recursive_provenance:50279") &&
    implementationReviewPackets?.evidence?.includes("synthetic_rehearsal_only:true") &&
    implementationReviewPackets?.evidence?.includes("trusted_repository_attestations:0") &&
    implementationReviewPackets?.evidence?.includes("real_founder_approvals:0") &&
    implementationReviewPackets?.evidence?.includes("real_technology_clearances:0") &&
    implementationReviewPackets?.evidence?.includes("real_agent_grants:0") &&
    implementationReviewPackets?.evidence?.includes("real_budget_grants:0") &&
    implementationReviewPackets?.evidence?.includes("real_edge_packets:0") &&
    implementationReviewPackets?.evidence?.includes("real_code_mutations:0") &&
    implementationReviewPackets?.evidence?.includes("canonical_repository_writes:0") &&
    implementationReviewPackets?.evidence?.includes("production_writes:0") &&
    implementationReviewPackets?.evidence?.includes("merge_authority:0") &&
    implementationReviewPackets?.evidence?.includes("deployment_authority:0") &&
    implementationReviewPackets?.evidence?.includes("release_authority:0") &&
    implementationReviewPackets?.evidence?.includes("lifecycle_promotions:0"),
  "Implementation-review truth must bind every synthetic review packet while retaining zero attestation, real mutation, production, release or lifecycle authority.",
);

const supersededReceipts = sovereignFactoryImplementationItems.find(
  (item) => item.id === "recovery-semantic-receipts-superseded",
);
assert(
  supersededReceipts?.state === "blocked" &&
    supersededReceipts.blocker?.includes("superseded") &&
    supersededReceipts.blocker?.includes("#364"),
  "Closed unmerged PR #359 must remain visibly blocked and point to its tested successor.",
);

const productionVerification = sovereignFactoryImplementationItems.find(
  (item) => item.id === "production-verification",
);
assert(
  productionVerification?.state === "blocked" &&
    productionVerification.blocker?.includes("PR #315") &&
    productionVerification.blocker?.includes("MERGED only") &&
    productionVerification.blocker?.includes("PRs #363-#374") &&
    productionVerification.blocker?.includes("VERCEL_TOKEN"),
  "Production truth must distinguish merged Factory code from deployment and retain the external credential blocker.",
);

const registryIds = sovereignFactoryImplementationItems.map((item) => item.id);
assert(
  new Set(registryIds).size === registryIds.length,
  "Implementation truth registry IDs must remain unique.",
);


assert(
  !authorizeAgentCapability(grant, { ...readRequest, agentId: "different_agent" }).allowed,
  "A capability grant must be bound to the exact agent identity.",
);
assert(
  !authorizeAgentCapability({ ...grant, spent: Number.NaN }, readRequest).allowed,
  "Non-finite grant accounting must fail closed.",
);
expectThrows(
  () =>
    createAgentBudgetGrant({
      id: "grant_invalid_time",
      agentId: "agent_1",
      intentId: "intent_safe",
      capabilities: [{ capability: "classify", scope: "recovery/corpus", access: "read" }],
      budgetLimit: 1,
      issuedAt: "not-a-time",
      expiresAt: "also-not-a-time",
    }),
  "Invalid grant timestamps must be rejected.",
);

assert(
  evaluateIntentFirewall({ ...safeIntentRequest, dataClasses: [] }, firewallPolicy).disposition === "deny",
  "Missing data classification must fail closed.",
);
assert(
  evaluateIntentFirewall(
    safeIntentRequest,
    { ...firewallPolicy, maximumAutomaticCost: Number.NaN },
  ).disposition === "deny",
  "Invalid firewall policy numbers must fail closed.",
);

expectThrows(
  () =>
    compileOutcomePlan(
      { id: "invalid_cost", userId: "founder_test", text: "verify", desiredOutcome: "verify" },
      [],
      Number.NaN,
      { ownerApprovalRisks: ["high"], requireApprovalForIrreversible: true, maximumAutomaticCost: 5 },
    ),
  "Non-finite outcome cost must be rejected.",
);
const cyclicPlan = compileOutcomePlan(
  { id: "cycle", userId: "founder_test", text: "verify", desiredOutcome: "verify" },
  [
    {
      id: "a",
      title: "A",
      kind: "workflow",
      capability: "classify",
      risk: "low",
      reversible: true,
      requiresOwnerApproval: false,
      dependsOn: ["b"],
    },
    {
      id: "b",
      title: "B",
      kind: "workflow",
      capability: "classify",
      risk: "low",
      reversible: true,
      requiresOwnerApproval: false,
      dependsOn: ["a"],
    },
  ],
  0,
  { ownerApprovalRisks: ["high"], requireApprovalForIrreversible: true, maximumAutomaticCost: 5 },
);
assert(
  cyclicPlan.state === "blocked" && cyclicPlan.blockers.includes("dependency_cycle_detected"),
  "Cyclic outcome dependencies must be blocked before execution.",
);

expectThrows(
  () => createDisconnectedExecutionPacket({ ...edgeTask, issuedAt: "invalid" }, edgePolicy),
  "Invalid edge timestamps must be rejected.",
);
assert(
  !verifyDisconnectedExecutionPacket(packet, "invalid", edgePolicy).valid,
  "Invalid edge verification time must fail closed.",
);
assert(
  !verifyDisconnectedExecutionPacket(
    packet,
    "2026-08-27T21:00:00.000Z",
    { ...edgePolicy, allowedCapabilities: [] },
  ).valid,
  "Edge verification must re-apply the capability policy.",
);

assert(
  evaluateReplacement(
    incumbent,
    { ...replacement, unitCost: Number.NaN },
    {
      minimumQuality: 85,
      minimumPrivacy: 65,
      minimumResilience: 65,
      maximumUnitCost: 6,
      ownerApprovalForExternalReplacement: true,
    },
  ).decision === "deny",
  "Non-finite replacement metrics must fail closed.",
);
assert(
  assessTechnologyLibraryEntry({
    ...completeTechnology,
    evidence: completeTechnology.evidence.map((evidence, index) =>
      index === 0 ? { ...evidence, reference: "" } : evidence
    ),
  }).readiness === "hold",
  "Blank technology evidence must not satisfy readiness.",
);

const invalidEvidenceItem = {
  ...codedItem,
  evidenceRecords: [{ kind: "code", reference: "", recordedAt: codedItem.updatedAt }],
};
assert(
  validateImplementationTruth(invalidEvidenceItem).includes("evidence_reference_missing:code"),
  "Implementation evidence must carry a non-empty reference.",
);
assert(
  !canAdvanceImplementationState("unknown_state", "unknown_state"),
  "Unknown runtime states must never be treated as a valid transition.",
);
expectThrows(
  () => advanceImplementationItem(codedItem, "coded", [], "2026-08-27T19:00:00.000Z"),
  "Implementation truth timestamps must be monotonic.",
);

const ownerPage = await readFile(join(process.cwd(), "app/owner/control/implementation/page.tsx"), "utf8");
assert(ownerPage.includes("requireFounderIdentity"), "Owner implementation page must require founder identity.");
assert(ownerPage.includes('currentLevel !== "aal2"'), "Owner implementation page must require AAL2 MFA.");
assert(ownerPage.includes('dynamic = "force-dynamic"'), "Owner implementation page must never be statically exposed.");
const ownerControlPage = await readFile(join(process.cwd(), "app/owner/control/page.tsx"), "utf8");
assert(
  ownerControlPage.includes('href="/owner/control/implementation"'),
  "Owner Control must link to the founder-only implementation truth surface.",
);

console.log("PANTAVION SOVEREIGN FACTORY CONTRACT TEST: PASSED");
console.log("- intent firewall fails closed and production/public actions stop at owner approval");
console.log("- agents are scope-, time- and budget-bounded");
console.log("- disconnected packets are deterministic, reversible and replay-protected");
console.log("- technology evidence never implies deployment authority");
console.log("- implementation truth cannot skip stages or claim false VERIFIED_LIVE");
console.log("- implementation status surface is founder-only with AAL2 MFA");
