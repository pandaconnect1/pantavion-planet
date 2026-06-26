import crypto from "node:crypto";
import { runEvolutionScan } from "./evolution-scan";
import { appendKernelAudit } from "./kernel-audit";

export async function generateEvolutionProposal(input?: {
  actor?: string;
}) {
  const actor = input?.actor ?? "kernel";
  const scan = await runEvolutionScan();

  const proposal = {
    proposalId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    actor,
    mode: "proposal_only_no_file_mutation",
    approvalPolicy: {
      Z1_AUTO_SAFE: "may be automated after green checks",
      Z2_PREVIEW_REQUIRED: "requires preview and green checks",
      Z3_FOUNDER_APPROVAL_REQUIRED: "requires founder approval",
      Z4_BLOCKED_MANUAL_ONLY: "blocked unless manually approved and executed",
    },
    findings: scan.findings,
    recommendedActions: scan.recommendedActions,
  };

  await appendKernelAudit({
    id: crypto.randomUUID(),
    type: "kernel.evolution.proposal",
    actor,
    createdAt: new Date().toISOString(),
    payload: {
      proposalId: proposal.proposalId,
      findingCount: proposal.findings.length,
      recommendedActions: proposal.recommendedActions,
    },
  });

  return proposal;
}
