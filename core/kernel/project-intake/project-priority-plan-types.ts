export type PantavionWorkOrderLane =
  | "founder_gate"
  | "protected_scope"
  | "provider_decision"
  | "api_completion"
  | "route_realness"
  | "safe_autonomous_candidate"
  | "capability_classification"
  | "kernel_contract";

export type PantavionPrioritizedWorkOrder = {
  rank: number;
  lane: PantavionWorkOrderLane;
  workOrderId: string;
  title: string;
  priority: string;
  kind: string;
  risk: string;
  route?: string;
  mappedCapabilityIds: string[];
  founderApprovalRequired: boolean;
  recommendedMode:
    | "founder_review_only"
    | "kernel_supervised_draft"
    | "isolated_autonomous_draft"
    | "manual_protected_review";
  reason: string;
};

export type PantavionWorkOrderPriorityPlan = {
  generatedAt: string;
  sourceGeneratedAt: string;
  totalWorkOrders: number;
  founderGate: number;
  protectedScope: number;
  providerDecision: number;
  safeAutonomousCandidates: number;
  routeRealness: number;
  apiCompletion: number;
  kernelContracts: number;
  topFounderReview: PantavionPrioritizedWorkOrder[];
  topSafeAutonomous: PantavionPrioritizedWorkOrder[];
  topProviderDecisions: PantavionPrioritizedWorkOrder[];
  topRouteRealness: PantavionPrioritizedWorkOrder[];
};
