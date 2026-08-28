import assert from "node:assert/strict";
import { evaluateAgentExecutionAuthority } from "../kernel/agent-immune-system.ts";
import { evaluateKernelZeroTrustAccess } from "../kernel/zero-trust.ts";

const now = Date.parse("2026-08-28T04:00:00.000Z");

const principal = {
  id: "kernel-agent-1",
  type: "kernel",
  authenticated: true,
  credentialExpiresAt: "2026-08-28T05:00:00.000Z",
  tenantId: "tenant-a",
  workloadIdentityVerified: true,
  grants: [
    {
      grantId: "grant-task-inspect",
      actions: ["task.inspect"],
      resourceIds: ["kernel.task"],
      environments: ["staging"],
    },
  ],
};

const resource = {
  id: "kernel.task",
  tenantId: "tenant-a",
  environment: "staging",
  sensitivity: "restricted",
};

const authority = {
  envelopeId: "authority-1",
  agentPrincipalId: principal.id,
  issuerPrincipalId: "governance-kernel",
  purpose: "inspect-task-state",
  validFrom: "2026-08-28T03:50:00.000Z",
  expiresAt: "2026-08-28T04:20:00.000Z",
  allowedActions: ["task.inspect"],
  allowedResourceIds: ["kernel.task"],
  allowedToolIds: ["task-reader"],
  allowedEnvironments: ["staging"],
  maxOperations: 10,
  maxWriteOperations: 2,
  maxExternalEffects: 2,
  maxFinancialMinorUnits: 0,
  requiresHumanApprovalFor: [],
  rollbackPlanRequiredFor: [],
  provenanceRequired: true,
};

const baseIntent = {
  requestId: "req-agent-1",
  principal,
  resource,
  authority,
  action: "task.inspect",
  toolId: "task-reader",
  purpose: "inspect-task-state",
  operationCount: 1,
  writeOperationCount: 0,
  externalEffectCount: 0,
  financialMinorUnits: 0,
  irreversible: false,
  provenanceVerified: true,
  humanApprovalPresent: false,
  rollbackPlanVerified: true,
  behaviourRiskScore: 10,
};

function zeroTrustFor(intent, overrides = {}) {
  return evaluateKernelZeroTrustAccess(
    {
      requestId: intent.requestId,
      principal: intent.principal,
      resource: intent.resource,
      action: intent.action,
      transportAuthenticated: true,
      jurisdictionAllowed: true,
      agePolicyAllowed: true,
      ...overrides,
    },
    now,
  );
}

const baseZeroTrust = zeroTrustFor(baseIntent);
const allowed = evaluateAgentExecutionAuthority(baseIntent, baseZeroTrust, now);
assert.equal(allowed.allowed, true);
assert.equal(allowed.zeroTrust.allowed, true);
assert.equal(allowed.containment, "none");
assert.equal(allowed.matchedAuthorityEnvelopeId, "authority-1");

const deniedZeroTrust = zeroTrustFor(baseIntent, { explicitlyDenied: true });
const monotonicZeroTrustDeny = evaluateAgentExecutionAuthority(baseIntent, deniedZeroTrust, now);
assert.equal(monotonicZeroTrustDeny.zeroTrust.allowed, false);
assert.equal(monotonicZeroTrustDeny.allowed, false);
assert.ok(monotonicZeroTrustDeny.reasons.includes("zero_trust_denied"));

const mismatchedDecision = evaluateAgentExecutionAuthority(
  baseIntent,
  { ...baseZeroTrust, requestId: "different-request" },
  now,
);
assert.equal(mismatchedDecision.allowed, false);
assert.ok(mismatchedDecision.reasons.includes("zero_trust_request_mismatch"));

const actionReplayIntent = {
  ...baseIntent,
  action: "task.publish",
  authority: { ...authority, allowedActions: ["task.inspect", "task.publish"] },
};
const actionReplay = evaluateAgentExecutionAuthority(actionReplayIntent, baseZeroTrust, now);
assert.equal(actionReplay.allowed, false);
assert.ok(actionReplay.reasons.includes("zero_trust_context_mismatch"));

const resourceReplayIntent = {
  ...baseIntent,
  resource: { ...resource, id: "kernel.other-task" },
  authority: { ...authority, allowedResourceIds: ["kernel.task", "kernel.other-task"] },
};
const resourceReplay = evaluateAgentExecutionAuthority(resourceReplayIntent, baseZeroTrust, now);
assert.equal(resourceReplay.allowed, false);
assert.ok(resourceReplay.reasons.includes("zero_trust_context_mismatch"));

const replayPrincipal = { ...principal, id: "kernel-agent-replay" };
const principalReplayIntent = {
  ...baseIntent,
  principal: replayPrincipal,
  authority: { ...authority, agentPrincipalId: replayPrincipal.id },
};
const principalReplay = evaluateAgentExecutionAuthority(principalReplayIntent, baseZeroTrust, now);
assert.equal(principalReplay.allowed, false);
assert.ok(principalReplay.reasons.includes("zero_trust_context_mismatch"));

const wrongSubject = evaluateAgentExecutionAuthority(
  { ...baseIntent, authority: { ...authority, agentPrincipalId: "kernel-agent-2" } },
  baseZeroTrust,
  now,
);
assert.equal(wrongSubject.allowed, false);
assert.ok(wrongSubject.reasons.includes("authority_subject_mismatch"));

const wrongPurpose = evaluateAgentExecutionAuthority(
  { ...baseIntent, purpose: "publish-content" },
  baseZeroTrust,
  now,
);
assert.equal(wrongPurpose.allowed, false);
assert.ok(wrongPurpose.reasons.includes("authority_purpose_mismatch"));

const expired = evaluateAgentExecutionAuthority(
  { ...baseIntent, authority: { ...authority, expiresAt: "2026-08-28T03:59:59.000Z" } },
  baseZeroTrust,
  now,
);
assert.equal(expired.allowed, false);
assert.ok(expired.reasons.includes("authority_expired_or_invalid"));

const wrongTool = evaluateAgentExecutionAuthority(
  { ...baseIntent, toolId: "external-browser" },
  baseZeroTrust,
  now,
);
assert.equal(wrongTool.allowed, false);
assert.ok(wrongTool.reasons.includes("authority_tool_denied"));

const operationEscape = evaluateAgentExecutionAuthority(
  { ...baseIntent, operationCount: 11 },
  baseZeroTrust,
  now,
);
assert.equal(operationEscape.allowed, false);
assert.ok(operationEscape.reasons.includes("operation_budget_exhausted"));

const exactLimit = evaluateAgentExecutionAuthority(
  { ...baseIntent, operationCount: 10, writeOperationCount: 2, externalEffectCount: 0 },
  baseZeroTrust,
  now,
);
assert.equal(exactLimit.allowed, true);

const missingProvenance = evaluateAgentExecutionAuthority(
  { ...baseIntent, provenanceVerified: false },
  baseZeroTrust,
  now,
);
assert.equal(missingProvenance.allowed, false);
assert.ok(missingProvenance.reasons.includes("provenance_not_verified"));

const irreversibleWithoutApproval = evaluateAgentExecutionAuthority(
  { ...baseIntent, irreversible: true },
  baseZeroTrust,
  now,
);
assert.equal(irreversibleWithoutApproval.allowed, false);
assert.equal(irreversibleWithoutApproval.requiresHumanApproval, true);
assert.equal(irreversibleWithoutApproval.containment, "require_human_approval");
assert.ok(irreversibleWithoutApproval.reasons.includes("human_approval_required"));

const irreversibleWithApproval = evaluateAgentExecutionAuthority(
  { ...baseIntent, irreversible: true, humanApprovalPresent: true },
  baseZeroTrust,
  now,
);
assert.equal(irreversibleWithApproval.allowed, true);
assert.equal(irreversibleWithApproval.requiresHumanApproval, true);

const elevatedRisk = evaluateAgentExecutionAuthority(
  { ...baseIntent, behaviourRiskScore: 55, humanApprovalPresent: true },
  baseZeroTrust,
  now,
);
assert.equal(elevatedRisk.allowed, false);
assert.equal(elevatedRisk.containment, "reduce_privileges");
assert.ok(elevatedRisk.reasons.includes("behaviour_risk_elevated"));

const highRisk = evaluateAgentExecutionAuthority(
  { ...baseIntent, behaviourRiskScore: 75, humanApprovalPresent: true },
  baseZeroTrust,
  now,
);
assert.equal(highRisk.allowed, false);
assert.equal(highRisk.containment, "quarantine");
assert.ok(highRisk.reasons.includes("behaviour_risk_high"));

const criticalIntent = {
  ...baseIntent,
  behaviourRiskScore: 90,
  humanApprovalPresent: true,
  externalEffectCount: 1,
  rollbackPlanVerified: true,
};
const criticalRisk = evaluateAgentExecutionAuthority(criticalIntent, baseZeroTrust, now);
assert.equal(criticalRisk.allowed, false);
assert.equal(criticalRisk.rollbackPlanRequired, true);
assert.equal(criticalRisk.containment, "rollback_and_quarantine");
assert.ok(criticalRisk.reasons.includes("behaviour_risk_critical"));

const missingRollbackPlan = evaluateAgentExecutionAuthority(
  { ...baseIntent, externalEffectCount: 1, rollbackPlanVerified: false },
  baseZeroTrust,
  now,
);
assert.equal(missingRollbackPlan.allowed, false);
assert.equal(missingRollbackPlan.rollbackPlanRequired, true);
assert.ok(missingRollbackPlan.reasons.includes("rollback_plan_not_verified"));

const financialEscape = evaluateAgentExecutionAuthority(
  { ...baseIntent, financialMinorUnits: 1 },
  baseZeroTrust,
  now,
);
assert.equal(financialEscape.allowed, false);
assert.ok(financialEscape.reasons.includes("financial_budget_exceeded"));

const ownerPrincipal = {
  ...principal,
  id: "owner-1",
  type: "owner",
  workloadIdentityVerified: undefined,
  grants: [{ ...principal.grants[0] }],
};
const ownerIntent = {
  ...baseIntent,
  principal: ownerPrincipal,
  authority: { ...authority, agentPrincipalId: "owner-1" },
};
const ownerZeroTrust = zeroTrustFor(ownerIntent);
const ownerAsAgent = evaluateAgentExecutionAuthority(ownerIntent, ownerZeroTrust, now);
assert.equal(ownerAsAgent.zeroTrust.allowed, true);
assert.equal(ownerAsAgent.allowed, false);
assert.ok(ownerAsAgent.reasons.includes("agent_workload_principal_required"));

console.log("Pantavion Agent Immune System contract: PASS");
console.log(JSON.stringify({
  zeroTrustMonotonic: true,
  zeroTrustRequestBound: true,
  zeroTrustContextReplayBlocked: true,
  timeBoundedAuthority: true,
  purposeBoundAuthority: true,
  toolAndResourceBoundAuthority: true,
  budgetBoundAuthority: true,
  provenanceRequired: true,
  irreversibleNeedsHumanApproval: true,
  behaviouralContainment: ["reduce_privileges", "quarantine", "rollback_and_quarantine"],
}, null, 2));
