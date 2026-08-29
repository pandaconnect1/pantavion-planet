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
  createBoundedExecutionSession,
  recordBoundedStepCompletion,
  verifyBoundedExecutionSession,
} from "../core/sovereign/bounded-execution-runtime.ts";
import { compileSovereignKernelDecision } from "../core/sovereign/sovereign-capability-kernel.ts";
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
const boundedDecision = compileSovereignKernelDecision({
  intent: {
    id: "intent_safe",
    userId: "founder_test",
    text: "Classify the preserved corpus",
    desiredOutcome: "Evidence-backed canonical classification",
    jurisdiction: "CY",
    maxCost: 3,
  },
  steps: [boundedStep],
  estimatedCost: 1,
  outcomePolicy: {
    ownerApprovalRisks: ["high", "critical"],
    requireApprovalForIrreversible: true,
    maximumAutomaticCost: 3,
  },
  firewallRequest: safeIntentRequest,
  firewallPolicy,
});
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
const dependencyDecision = compileSovereignKernelDecision({
  intent: {
    id: "intent_safe",
    userId: "founder_test",
    text: "Classify then verify",
    desiredOutcome: "Ordered bounded execution",
    jurisdiction: "CY",
    maxCost: 3,
  },
  steps: [
    boundedStep,
    {
      ...boundedStep,
      id: "bounded_verify",
      title: "Verify classification",
      dependsOn: [boundedStep.id],
    },
  ],
  estimatedCost: 2,
  outcomePolicy: {
    ownerApprovalRisks: ["high", "critical"],
    requireApprovalForIrreversible: true,
    maximumAutomaticCost: 3,
  },
  firewallRequest: safeIntentRequest,
  firewallPolicy,
});
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
const protectedDecision = compileSovereignKernelDecision({
  intent: {
    id: "intent_safe",
    userId: "founder_test",
    text: "Write production",
    desiredOutcome: "Protected action",
    jurisdiction: "CY",
    maxCost: 3,
  },
  steps: [boundedStep],
  estimatedCost: 1,
  outcomePolicy: {
    ownerApprovalRisks: ["high", "critical"],
    requireApprovalForIrreversible: true,
    maximumAutomaticCost: 3,
  },
  firewallRequest: { ...safeIntentRequest, writesProduction: true },
  firewallPolicy,
});
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

for (const id of [
  "canonical-conversation-intake",
  "universal-artifact-intake",
  "universal-raw-artifact-upload",
]) {
  const item = sovereignFactoryImplementationItems.find((candidate) => candidate.id === id);
  assert(item?.state === "merged", `${id} must be recorded as MERGED only.`);
  assert(validateImplementationTruth(item).length === 0, `${id} must carry code, test and merge evidence.`);
  assert(
    !["deployed", "verified_live"].includes(item.state),
    `${id} must not infer deployment or VERIFIED_LIVE from merge evidence.`,
  );
}


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