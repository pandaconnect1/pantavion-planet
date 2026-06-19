export type PantavionGeneratedWorkOrderKind =
  | "realness_repair"
  | "provider_integration"
  | "protected_scope_review"
  | "route_completion"
  | "api_completion"
  | "kernel_contract_completion"
  | "capability_mapping_review";

export type PantavionGeneratedWorkOrderPriority =
  | "p0_critical"
  | "p1_high"
  | "p2_medium"
  | "p3_low";

export type PantavionGeneratedWorkOrder = {
  workOrderId: string;
  title: string;
  kind: PantavionGeneratedWorkOrderKind;
  priority: PantavionGeneratedWorkOrderPriority;
  sourcePath: string;
  route?: string;
  risk: "low" | "medium" | "high" | "critical";
  mappedCapabilityIds: string[];
  signals: string[];
  founderApprovalRequired: boolean;
  productionChangeAllowedWithoutFounder: boolean;
  requiredActions: string[];
  acceptanceCriteria: string[];
  safetyNotes: string[];
};
