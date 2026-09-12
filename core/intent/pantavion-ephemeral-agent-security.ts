import {
  createFounderEphemeralAgentLease,
  type FounderEphemeralAgentLease,
  type FounderIntentBudgetEnvelope,
  type FounderIntentEdgeHandoff,
  type FounderIntentFirewallAssessment,
  type FounderIntentRecord,
  type FounderTechnologyAssessment,
  verifyFounderEphemeralAgentLease,
  verifyFounderIntentEdgeHandoff,
  verifyFounderIntentFirewallAssessment,
  verifyFounderTechnologyAssessment,
} from "./pantavion-founder-intent-workbench";

async function verifyChain(params: {
  record: FounderIntentRecord;
  firewall: FounderIntentFirewallAssessment;
  budget: FounderIntentBudgetEnvelope;
  handoff: FounderIntentEdgeHandoff;
  technology: FounderTechnologyAssessment;
}) {
  return await verifyFounderIntentFirewallAssessment(params.record, params.firewall)
    && await verifyFounderIntentEdgeHandoff({ record: params.record, assessment: params.firewall, budget: params.budget, handoff: params.handoff })
    && await verifyFounderTechnologyAssessment(params.record, params.handoff, params.technology);
}

export async function createVerifiedFounderEphemeralAgentLease(params: {
  record: FounderIntentRecord;
  firewall: FounderIntentFirewallAssessment;
  budget: FounderIntentBudgetEnvelope;
  handoff: FounderIntentEdgeHandoff;
  technology: FounderTechnologyAssessment;
  agentId: string;
}): Promise<FounderEphemeralAgentLease> {
  if (!await verifyChain(params)) throw new Error("intent_chain_integrity_failed");
  const lease = await createFounderEphemeralAgentLease({ record: params.record, budget: params.budget, technology: params.technology, agentId: params.agentId });
  if (!await verifyFounderEphemeralAgentLease(params.record, params.budget, params.technology, lease)) throw new Error("ephemeral_agent_lease_integrity_failed");
  return lease;
}

export async function verifyVerifiedFounderEphemeralAgentLease(params: {
  record: FounderIntentRecord;
  firewall: FounderIntentFirewallAssessment;
  budget: FounderIntentBudgetEnvelope;
  handoff: FounderIntentEdgeHandoff;
  technology: FounderTechnologyAssessment;
  lease: FounderEphemeralAgentLease;
}) {
  return await verifyChain(params) && await verifyFounderEphemeralAgentLease(params.record, params.budget, params.technology, params.lease);
}
