import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { evaluateReplacement } from "../core/sovereign/technology-factory.ts";
import { compileOutcomePlan } from "../core/sovereign/intent-to-outcome-fabric.ts";
import { createEphemeralAgent, canAgentUseCapability } from "../core/sovereign/ephemeral-agent-swarm.ts";
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
  advanceImplementationItem,
  canAdvanceImplementationState,
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
const packet = createDisconnectedExecutionPacket(edgeTask, {
  allowedCapabilities: ["classify"],
  maximumPayloadBytes: 1024,
});
assert(
  verifyDisconnectedExecutionPacket(packet, "2026-08-27T21:00:00.000Z").valid,
  "Untampered offline packet must verify.",
);
assert(
  !verifyDisconnectedExecutionPacket(packet, "2026-08-27T21:00:00.000Z", new Set([packet.payloadDigest])).valid,
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

const ephemeralAgent = createEphemeralAgent({
  id: "ephemeral_1",
  parentIntentId: "intent_safe",
  role: "verifier",
  capabilities: [{ capability: "classify", scope: "recovery/corpus", expiresAt: "2026-08-28T20:00:00.000Z" }],
  budget: 3,
  createdAt: "2026-08-27T20:00:00.000Z",
  expiresAt: "2026-08-28T20:00:00.000Z",
});
assert(
  canAgentUseCapability(ephemeralAgent, "classify", "recovery/corpus", new Date("2026-08-27T21:00:00.000Z")),
  "Ephemeral agent must use only its bounded live scope.",
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

const ownerPage = await readFile(join(process.cwd(), "app/owner/control/implementation/page.tsx"), "utf8");
assert(ownerPage.includes("requireFounderIdentity"), "Owner implementation page must require founder identity.");
assert(ownerPage.includes('currentLevel !== "aal2"'), "Owner implementation page must require AAL2 MFA.");
assert(ownerPage.includes('dynamic = "force-dynamic"'), "Owner implementation page must never be statically exposed.");

console.log("PANTAVION SOVEREIGN FACTORY CONTRACT TEST: PASSED");
console.log("- intent firewall fails closed and production/public actions stop at owner approval");
console.log("- agents are scope-, time- and budget-bounded");
console.log("- disconnected packets are deterministic, reversible and replay-protected");
console.log("- technology evidence never implies deployment authority");
console.log("- implementation truth cannot skip stages or claim false VERIFIED_LIVE");
console.log("- implementation status surface is founder-only with AAL2 MFA");
