import {
  createFounderEphemeralAgentLease,
  type FounderEphemeralAgentLease,
  type FounderIntentBudgetEnvelope,
  type FounderIntentEdgeHandoff,
  type FounderIntentRecord,
  type FounderTechnologyAssessment,
  verifyFounderEphemeralAgentLease,
  verifyFounderIntentEdgeHandoff,
  verifyFounderTechnologyAssessment,
} from "./pantavion-founder-intent-workbench";

export async function createVerifiedFounderEphemeralAgentLease(params: {
  record: FounderIntentRecord;
  budget: FounderIntentBudgetEnvelope;
  handoff: FounderIntentEdgeHandoff;
  technology: FounderTechnologyAssessment;
  agentId: string;
}): Promise<FounderEphemeralAgentLease> {
  const handoffValid = await verifyFounderIntentEdgeHandoff({
    record: params.record,
    assessment: {
      marker: "pantavion_founder_intent_firewall_assessment_v1",
      intentId: params.record.id,
      disposition: "owner_review_required",
      executionAllowed: false,
      reasons: ["explicit_execution_authority_missing"],
      assessedPayload: JSON.stringify({
        marker: "pantavion_founder_intent_firewall_assessment_v1",
        intentId: params.record.id,
        intentSha256: params.record.sha256,
        disposition: "owner_review_required",
        executionAllowed: false,
        reasons: ["explicit_execution_authority_missing"],
      }),
      sha256: "",
    },
    budget: params.budget,
    handoff: params.handoff,
  });
  if (!handoffValid) throw new Error("edge_handoff_integrity_failed");
  if (!await verifyFounderTechnologyAssessment(params.record, params.handoff, params.technology)) {
    throw new Error("technology_assessment_integrity_failed");
  }
  const lease = await createFounderEphemeralAgentLease({
    record: params.record,
    budget: params.budget,
    technology: params.technology,
    agentId: params.agentId,
  });
  if (!await verifyFounderEphemeralAgentLease(params.record, params.budget, params.technology, lease)) {
    throw new Error("ephemeral_agent_lease_integrity_failed");
  }
  return lease;
}

export async function verifyVerifiedFounderEphemeralAgentLease(params: {
  record: FounderIntentRecord;
  budget: FounderIntentBudgetEnvelope;
  handoff: FounderIntentEdgeHandoff;
  technology: FounderTechnologyAssessment;
  lease: FounderEphemeralAgentLease;
}) {
  if (!await verifyFounderIntentEdgeHandoff({
    record: params.record,
    assessment: {
      marker: "pantavion_founder_intent_firewall_assessment_v1",
      intentId: params.record.id,
      disposition: "owner_review_required",
      executionAllowed: false,
      reasons: ["explicit_execution_authority_missing"],
      assessedPayload: JSON.stringify({
        marker: "pantavion_founder_intent_firewall_assessment_v1",
        intentId: params.record.id,
        intentSha256: params.record.sha256,
        disposition: "owner_review_required",
        executionAllowed: false,
        reasons: ["explicit_execution_authority_missing"],
      }),
      sha256: "",
    },
    budget: params.budget,
    handoff: params.handoff,
  })) return false;
  if (!await verifyFounderTechnologyAssessment(params.record, params.handoff, params.technology)) return false;
  return verifyFounderEphemeralAgentLease(params.record, params.budget, params.technology, params.lease);
}
