export type PantavionAutonomousDispatchDecision =
  | "allow_isolated_autonomous_draft"
  | "require_kernel_supervised_draft"
  | "block_founder_review"
  | "block_protected_scope"
  | "require_provider_decision"
  | "require_capability_classification";

export type PantavionAutonomousDispatchItem = {
  dispatchId: string;
  workOrderId: string;
  title: string;
  lane: string;
  priority: string;
  kind: string;
  risk: string;
  route?: string;
  mappedCapabilityIds: string[];
  founderApprovalRequired: boolean;
  recommendedMode: string;
  decision: PantavionAutonomousDispatchDecision;
  allowedToDraftCode: boolean;
  allowedToRunTests: boolean;
  allowedToPrepareCommit: boolean;
  allowedToDeployProduction: false;
  requiredHumanAction: string;
  kernelReason: string;
};

export type PantavionAutonomousDispatchReport = {
  generatedAt: string;
  sourceGeneratedAt: string;
  totalItems: number;
  autonomousDraftAllowed: number;
  kernelSupervisedRequired: number;
  founderBlocked: number;
  protectedBlocked: number;
  providerDecisionRequired: number;
  classificationRequired: number;
  dispatchItems: PantavionAutonomousDispatchItem[];
};
