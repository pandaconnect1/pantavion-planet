import assert from "node:assert/strict";
import { evaluateAgentExecutionAuthority } from "../kernel/agent-immune-system.ts";

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
  transportAuthenticated: true,
  jurisdictionAllowed: true,
  agePolicyAllowed: true,
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

const allowed = evaluateAgentExecutionAuthority(baseIntent, now);
assert.equal(allowed.allowed, true);
assert.equal(allowed.zeroTrust.allowed, true);
assert.equal(allowed.containment, "none");
assert.equal(allowed.matchedAuthorityEnvelopeId, "authority-1");

const monotonicZeroTrustDeny = evaluateAgentExecutionAuthority(
  { ...baseIntent, explicitlyDenied: true },
  now,
);
assert.equal(monotonicZeroTrustDeny.zeroTrust.allowed, false);
assert.equal(monotonicZeroTrustDeny.allowed, false);
assert.ok(monotonicZeroTrustDeny.reasons.includes("zero_trust_denied"));

const wrongSubject = evaluateAgentExecutionAuthority(
  { ...baseIntent, authority: { ...authority, agentPrincipalId: "kernel-agent-2" } },
  now,
);
assert.equal(wrongSubject.allowed, false);
assert.ok(wrongSubject.reasons.includes("authority_subject_mismatch"));

const wrongPurpose = evaluateAgentExecutionAuthority(
  { ...baseIntent, purpose: "publish-content" },
  now,
);
assert.equal(wrongPurpose.allowed, false);
assert.ok(wrongPurpose.reasons.includes("authority_purpose_mismatch"));

const expired = evaluateAgentExecutionAuthority(
  { ...baseIntent, authority: { ...authority, expiresAt: "2026-08-28T03:59:59.000Z" } },
  now,
);
assert.equal(expired.allowed, false);
assert.ok(expired.reasons.includes("authority_expired_or_invalid"));

const wrongTool = evaluateAgentExecutionAuthority(
  { ...baseIntent, toolId: "external-browser" },
  now,
);
assert.equal(wrongTool.allowed, false);
assert.ok(wrongTool.reasons.includes("authority_tool_denied"));

const operationEscape = evaluateAgentExecutionAuthority(
  { ...baseIntent, operationCount: 11 },
  now,
);
assert.equal(operationEscape.allowed, false);
assert.ok(operationEscape.reasons.includes("operation_budget_exhausted"));

const exactLimit = evaluateAgentExecutionAuthority(
  { ...baseIntent, operationCount: 10, writeOperationCount: 2, externalEffectCount: 0 },
  now,
);
assert.equal(exactLimit.allowed, true);

const missingProvenance = evaluateAgentExecutionAuthority(
  { ...baseIntent, provenanceVerified: false },
  now,
);
assert.equal(missingProvenance.allowed, false);
assert.ok(missingProvenance.reasons.includes("provenance_not_verified"));

const irreversibleWithoutApproval = evaluateAgentExecutionAuthority(
  { ...baseIntent, irreversible: true },
  now,
);
assert.equal(irreversibleWithoutApproval.allowed, false);
assert.equal(irreversibleWithoutApproval.requiresHumanApproval, true);
assert.equal(irreversibleWithoutApproval.containment, "require_human_approval");
assert.ok(irreversibleWithoutApproval.reasons.includes("human_approval_required"));

const irreversibleWithApproval = evaluateAgentExecutionAuthority(
  { ...baseIntent, irreversible: true, humanApprovalPresent: true },
  now,
);
assert.equal(irreversibleWithApproval.allowed, true);
assert.equal(irreversibleWithApproval.requiresHumanApproval, true);

const elevatedRisk = evaluateAgentExecutionAuthority(
  { ...baseIntent, behaviourRiskScore: 55, humanApprovalPresent: true },
  now,
);
assert.equal(elevatedRisk.allowed, false);
assert.equal(elevatedRisk.containment, "reduce_privileges");
assert.ok(elevatedRisk.reasons.includes("behaviour_risk_elevated"));

const highRisk = evaluateAgentExecutionAuthority(
  { ...baseIntent, behaviourRiskScore: 75, humanApprovalPresent: true },
  now,
);
assert.equal(highRisk.allowed, false);
assert.equal(highRisk.containment, "quarantine");
assert.ok(highRisk.reasons.includes("behaviour_risk_high"));

const criticalRisk = evaluateAgentExecutionAuthority(
  {
    ...baseIntent,
    behaviourRiskScore: 90,
    humanApprovalPresent: true,
    externalEffectCount: 1,
    rollbackPlanVerified: true,
  },
  now,
);
assert.equal(criticalRisk.allowed, false);
assert.equal(criticalRisk.rollbackPlanRequired, true);
assert.equal(criticalRisk.containment, "rollback_and_quarantine");
assert.ok(criticalRisk.reasons.includes("behaviour_risk_critical"));

const missingRollbackPlan = evaluateAgentExecutionAuthority(
  { ...baseIntent, externalEffectCount: 1, rollbackPlanVerified: false },
  now,
);
assert.equal(missingRollbackPlan.allowed, false);
assert.equal(missingRollbackPlan.rollbackPlanRequired, true);
assert.ok(missingRollbackPlan.reasons.includes("rollback_plan_not_verified"));

const financialEscape = evaluateAgentExecutionAuthority(
  { ...baseIntent, financialMinorUnits: 1 },
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
const ownerAsAgent = evaluateAgentExecutionAuthority(
  {
    ...baseIntent,
    principal: ownerPrincipal,
    authority: { ...authority, agentPrincipalId: "owner-1" },
  },
  now,
);
assert.equal(ownerAsAgent.zeroTrust.allowed, true);
assert.equal(ownerAsAgent.allowed, false);
assert.ok(ownerAsAgent.reasons.includes("agent_workload_principal_required"));

console.log("Pantavion Agent Immune System contract: PASS");
console.log(JSON.stringify({
  zeroTrustMonotonic: true,
  timeBoundedAuthority: true,
  purposeBoundAuthority: true,
  toolAndResourceBoundAuthority: true,
  budgetBoundAuthority: true,
  provenanceRequired: true,
  irreversibleNeedsHumanApproval: true,
  behaviouralContainment: ["reduce_privileges", "quarantine", "rollback_and_quarantine"],
}, null, 2));
