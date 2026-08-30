import { compileOutcomePlan, type OutcomePlan, type OutcomePolicy, type OutcomeStep, type UserIntent } from "./intent-to-outcome-fabric.ts";
import { evaluateIntentFirewall, type IntentFirewallDecision, type IntentFirewallPolicy, type IntentFirewallRequest } from "./intent-firewall.ts";

export type SovereignKernelDisposition = "denied" | "awaiting_owner" | "ready_for_bounded_execution";

export interface SovereignKernelDecision {
  intentId: string;
  disposition: SovereignKernelDisposition;
  firewall: IntentFirewallDecision;
  plan: OutcomePlan;
  blockers: string[];
  mayMerge: false;
  mayDeployProduction: false;
  mayPublishToUsers: false;
}

export function compileSovereignKernelDecision(input: {
  intent: UserIntent;
  steps: OutcomeStep[];
  estimatedCost: number;
  outcomePolicy: OutcomePolicy;
  firewallRequest: IntentFirewallRequest;
  firewallPolicy: IntentFirewallPolicy;
}): SovereignKernelDecision {
  if (input.intent.id !== input.firewallRequest.intentId) {
    throw new Error("intent identity mismatch between fabric and firewall");
  }

  const firewall = evaluateIntentFirewall(input.firewallRequest, input.firewallPolicy);
  const plan = compileOutcomePlan(input.intent, input.steps, input.estimatedCost, input.outcomePolicy);
  const blockers = [...new Set([...plan.blockers, ...firewall.reasons.filter((reason) => reason !== "policy_satisfied")])];
  const disposition: SovereignKernelDisposition =
    firewall.disposition === "deny" || plan.state === "blocked"
      ? "denied"
      : firewall.disposition === "owner_approval" || plan.requiresOwnerApproval
        ? "awaiting_owner"
        : "ready_for_bounded_execution";

  return {
    intentId: input.intent.id,
    disposition,
    firewall,
    plan,
    blockers,
    mayMerge: false,
    mayDeployProduction: false,
    mayPublishToUsers: false,
  };
}
