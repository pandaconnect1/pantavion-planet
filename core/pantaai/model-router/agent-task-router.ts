import {
  selectPantavionModelProvider,
  type PantavionModelLane,
  type PantavionSensitivity,
} from "./provider-capability-matrix";
import {
  selectCodingProvider,
  type PantavionCodingTask,
} from "../autonomous-code/coding-provider-matrix";

export type PantavionAgentTaskKind =
  | "answer"
  | "research"
  | "write_code"
  | "repair_build"
  | "translate_live"
  | "create_media"
  | "create_presentation"
  | "workflow_automation"
  | "china_superapp_module"
  | "seven_continent_localization"
  | "protected_domain_kernel";

export type PantavionAgentTaskRequest = {
  goal: string;
  kind: PantavionAgentTaskKind;
  sensitivity?: PantavionSensitivity;
  targetPath?: string;
};

export type PantavionAgentTaskRoute = {
  ok: true;
  goal: string;
  taskKind: PantavionAgentTaskKind;
  modelLane: PantavionModelLane;
  modelSelection: ReturnType<typeof selectPantavionModelProvider>;
  codingProvider?: ReturnType<typeof selectCodingProvider>;
  kernelFamily: string;
  executionPlan: string[];
  gates: string[];
};

function inferLane(kind: PantavionAgentTaskKind): PantavionModelLane {
  switch (kind) {
    case "research":
      return "research";
    case "write_code":
    case "repair_build":
      return "coding";
    case "translate_live":
      return "translation";
    case "protected_domain_kernel":
      return "advanced_reasoning";
    case "china_superapp_module":
    case "seven_continent_localization":
      return "long_context";
    default:
      return "advanced_reasoning";
  }
}

function inferCodingTask(kind: PantavionAgentTaskKind): PantavionCodingTask | undefined {
  switch (kind) {
    case "write_code":
      return "new_feature";
    case "repair_build":
      return "build_repair";
    case "protected_domain_kernel":
      return "refactor";
    case "china_superapp_module":
    case "seven_continent_localization":
      return "new_feature";
    default:
      return undefined;
  }
}

function kernelFamily(kind: PantavionAgentTaskKind): string {
  switch (kind) {
    case "research":
      return "PantaResearch and PantaRAG Kernel";
    case "write_code":
    case "repair_build":
      return "PandaDev Autonomous Coding Kernel";
    case "translate_live":
      return "PantaVoice Live Translation Kernel";
    case "create_media":
      return "PantaCreate Media Kernel";
    case "create_presentation":
      return "PantaDeck Presentation Kernel";
    case "workflow_automation":
      return "PantaFlow Workflow Automation Kernel";
    case "china_superapp_module":
      return "PantaLife China-style Super-App Kernel";
    case "seven_continent_localization":
      return "Seven-Continent Ecosystem Kernel";
    case "protected_domain_kernel":
      return "Protected Domain Child Kernel";
    default:
      return "PantaAI Intelligence Kernel";
  }
}

export function routePantavionAgentTask(
  request: PantavionAgentTaskRequest,
): PantavionAgentTaskRoute {
  const sensitivity = request.sensitivity ?? "internal";
  const modelLane = inferLane(request.kind);
  const codingTask = inferCodingTask(request.kind);

  const modelSelection = selectPantavionModelProvider({
    task: request.goal,
    requestedLane: modelLane,
    sensitivity,
    requiresCoding: Boolean(codingTask),
    requiresResearch: request.kind === "research",
    requiresTranslation: request.kind === "translate_live",
    requiresLongContext:
      request.kind === "china_superapp_module" ||
      request.kind === "seven_continent_localization" ||
      request.kind === "protected_domain_kernel",
  });

  const codingProvider = codingTask ? selectCodingProvider(codingTask) : undefined;

  const gates = [
    ...modelSelection.requiredGates,
    ...(codingProvider ? codingProvider.safetyGates : []),
    "no_fake_feature_gate",
    "legal_abstraction_gate",
  ];

  if (sensitivity === "protected" || request.kind === "protected_domain_kernel") {
    gates.push("protected_child_kernel_gate", "founder_gate_for_direct_mutation");
  }

  return {
    ok: true,
    goal: request.goal,
    taskKind: request.kind,
    modelLane,
    modelSelection,
    codingProvider,
    kernelFamily: kernelFamily(request.kind),
    executionPlan: [
      "normalize_intent",
      "select_kernel_family",
      "select_model_or_agent",
      "check_protected_domains",
      "create_scoped_plan",
      "write_or_draft_code_if_allowed",
      "run_audit_typecheck_build",
      "open_pr_or_create_repair_job",
      "record_memory",
    ],
    gates,
  };
}

export const pantavion_agent_task_router_marker_v1 =
  "pantavion_agent_task_router_c3_v1";
