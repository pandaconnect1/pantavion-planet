import {
  createPantavionWorkPackagePlans,
  type PantavionWorkPackagePlan,
} from "../autonomous-code/ecosystem-work-package-generator";

export type PantavionExecutorAdapterKind =
  | "model_provider"
  | "coding_agent"
  | "rag_memory"
  | "workflow"
  | "china_superapp"
  | "continent_runtime"
  | "creator_work"
  | "translation_voice"
  | "protected_domain";

export type PantavionExecutorAdapterStatus =
  | "planned"
  | "scaffold_ready"
  | "provider_required"
  | "connector_required"
  | "legal_gate_required"
  | "founder_gate_required";

export type PantavionExecutorAdapterPlan = {
  readonly id: string;
  readonly sourcePackageId: string;
  readonly kind: PantavionExecutorAdapterKind;
  readonly status: PantavionExecutorAdapterStatus;
  readonly title: string;
  readonly kernelFamily: string;
  readonly safeTargets: readonly string[];
  readonly gatedTargets: readonly string[];
  readonly executionContract: readonly string[];
  readonly gates: readonly string[];
};

function inferAdapterKind(plan: PantavionWorkPackagePlan): PantavionExecutorAdapterKind {
  const text = `${plan.packageId} ${plan.title} ${plan.kernelFamily}`.toLowerCase();

  if (text.includes("model")) return "model_provider";
  if (text.includes("coding") || text.includes("pandadev")) return "coding_agent";
  if (text.includes("rag") || text.includes("memory")) return "rag_memory";
  if (text.includes("workflow")) return "workflow";
  if (text.includes("china") || text.includes("super")) return "china_superapp";
  if (text.includes("continent") || text.includes("regional")) return "continent_runtime";
  if (text.includes("create") || text.includes("work")) return "creator_work";
  if (text.includes("voice") || text.includes("translation")) return "translation_voice";
  if (text.includes("protected") || text.includes("water") || text.includes("identity") || text.includes("sos")) {
    return "protected_domain";
  }

  return "coding_agent";
}

function inferStatus(plan: PantavionWorkPackagePlan): PantavionExecutorAdapterStatus {
  if (plan.gatedTargets.length > 0) return "founder_gate_required";

  const text = `${plan.packageId} ${plan.title}`.toLowerCase();

  if (text.includes("payment") || text.includes("dating")) return "legal_gate_required";
  if (text.includes("provider")) return "provider_required";
  if (text.includes("workflow")) return "connector_required";

  return "scaffold_ready";
}

export function createPantavionExecutorAdapterPlans(
  maxPackages = 9,
): readonly PantavionExecutorAdapterPlan[] {
  return createPantavionWorkPackagePlans(maxPackages).map((plan) => {
    const kind = inferAdapterKind(plan);

    return {
      id: `executor-${plan.packageId}`,
      sourcePackageId: plan.packageId,
      kind,
      status: inferStatus(plan),
      title: `${plan.title} executor adapter`,
      kernelFamily: plan.kernelFamily,
      safeTargets: plan.safeTargets,
      gatedTargets: plan.gatedTargets,
      executionContract: [
        "receive_kernel_intent",
        "validate_execution_status",
        "apply_legal_abstraction_gate",
        "select_internal_or_provider_executor",
        "produce_scoped_result",
        "record_audit_event",
      ],
      gates: Array.from(
        new Set([
          ...plan.gates,
          "executor_adapter_contract_required",
          "no_static_only_capability",
          "no_external_brand_copying",
        ]),
      ),
    };
  });
}

export const pantavion_executor_adapter_planner_marker_v1 =
  "pantavion_executor_adapter_planner_c6_v1";
