import {
  getReadyPantavionWorkPackages,
  type PantavionEcosystemWorkPackage,
} from "./ecosystem-work-packages";
import { evaluateAutonomousMutation } from "./protected-path-policy";
import {
  routePantavionAgentTask,
  type PantavionAgentTaskKind,
} from "../model-router/agent-task-router";

export type PantavionWorkPackagePlan = {
  readonly packageId: string;
  readonly title: string;
  readonly kernelFamily: string;
  readonly priority: number;
  readonly generatedAt: string;
  readonly taskKind: PantavionAgentTaskKind;
  readonly safeTargets: readonly string[];
  readonly gatedTargets: readonly string[];
  readonly executionPlan: readonly string[];
  readonly gates: readonly string[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function inferTaskKind(workPackage: PantavionEcosystemWorkPackage): PantavionAgentTaskKind {
  const text = `${workPackage.id} ${workPackage.title} ${workPackage.purpose}`.toLowerCase();

  if (text.includes("coding")) return "write_code";
  if (text.includes("translation") || text.includes("voice")) return "translate_live";
  if (text.includes("china") || text.includes("super-app")) return "china_superapp_module";
  if (text.includes("continent") || text.includes("regional")) return "seven_continent_localization";
  if (text.includes("protected") || text.includes("water") || text.includes("identity") || text.includes("sos")) {
    return "protected_domain_kernel";
  }
  if (text.includes("rag") || text.includes("memory") || text.includes("research")) return "research";
  if (text.includes("workflow")) return "workflow_automation";

  return "write_code";
}

export function createPantavionWorkPackagePlans(maxPackages = 9): readonly PantavionWorkPackagePlan[] {
  return getReadyPantavionWorkPackages().slice(0, maxPackages).map((workPackage) => {
    const taskKind = inferTaskKind(workPackage);
    const safeTargets: string[] = [];
    const gatedTargets: string[] = [];

    for (const target of workPackage.targetFiles) {
      const decision = evaluateAutonomousMutation({
        filePath: target,
        operation: "create",
        reason: workPackage.purpose,
        requestedBy: "kernel",
      });

      if (decision.canWriteDirectly) {
        safeTargets.push(target);
      } else {
        gatedTargets.push(target);
      }
    }

    const route = routePantavionAgentTask({
      goal: workPackage.purpose,
      kind: taskKind,
      sensitivity: gatedTargets.length > 0 ? "protected" : "internal",
    });

    return {
      packageId: workPackage.id,
      title: workPackage.title,
      kernelFamily: workPackage.kernelFamily,
      priority: workPackage.priority,
      generatedAt: nowIso(),
      taskKind,
      safeTargets,
      gatedTargets,
      executionPlan: [
        "read_work_package",
        "route_agent_task",
        "split_safe_targets_from_gated_targets",
        "generate_scoped_modules",
        "run_audit_typecheck_build",
        "open_pr_or_wait_for_founder_gate"
      ],
      gates: Array.from(new Set([
        ...route.gates,
        ...workPackage.executionRules,
        "no_fake_feature",
        "no_brand_copying",
        "kernel_execution_contract_required"
      ])),
    };
  });
}

export const pantavion_work_package_generator_marker_v1 =
  "pantavion_work_package_generator_c5_v1";
