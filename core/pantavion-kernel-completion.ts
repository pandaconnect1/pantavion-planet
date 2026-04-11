export type CompletionModality =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "mixed";

export type CompletionIntent =
  | "build_app"
  | "build_website"
  | "create_feature"
  | "create_workflow"
  | "create_catalog"
  | "create_course"
  | "research_market"
  | "analyze_competitor"
  | "upgrade_pantavion"
  | "unknown";

export type CompletionStatus =
  | "received"
  | "planned"
  | "executing"
  | "repairing"
  | "blocked"
  | "ready_for_publish"
  | "completed";

export type ExecutionUnitType =
  | "spec"
  | "architecture"
  | "data_model"
  | "ui"
  | "backend"
  | "registry"
  | "course"
  | "workflow"
  | "connector"
  | "verification"
  | "repair";

export interface CompletionRequest {
  text: string;
  modality?: CompletionModality;
  source?: "user" | "research" | "system";
}

export interface CompletionMission {
  id: string;
  title: string;
  intent: CompletionIntent;
  modality: CompletionModality;
  source: "user" | "research" | "system";
  summary: string;
  strategicMode: "build" | "research" | "upgrade" | "mixed";
}

export interface ExecutionUnit {
  id: string;
  type: ExecutionUnitType;
  title: string;
  dependsOn: string[];
  required: boolean;
  output: string;
  status: "pending";
}

export interface CompletionVerifier {
  checks: {
    specificationPresent: boolean;
    architecturePresent: boolean;
    executionPathPresent: boolean;
    publishGateDefined: boolean;
    gapsDetected: boolean;
  };
  missing: string[];
  verdict: "incomplete" | "repair_required" | "ready_for_publish";
}

export interface CompletionRepairAction {
  id: string;
  title: string;
  reason: string;
  status: "pending";
}

export interface CompletionResult {
  ok: true;
  mission: CompletionMission;
  status: CompletionStatus;
  taskGraph: ExecutionUnit[];
  missing: string[];
  repairs: CompletionRepairAction[];
  verifier: CompletionVerifier;
  finalDecision: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s\-_]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function detectIntent(text: string): CompletionIntent {
  if (text.includes("build app") || text.includes("app builder") || text.includes("create app")) return "build_app";
  if (text.includes("build website") || text.includes("website builder") || text.includes("create website")) return "build_website";
  if (text.includes("feature") || text.includes("module")) return "create_feature";
  if (text.includes("workflow") || text.includes("automation") || text.includes("pipeline")) return "create_workflow";
  if (text.includes("catalog") || text.includes("directory") || text.includes("marketplace")) return "create_catalog";
  if (text.includes("course") || text.includes("academy") || text.includes("training") || text.includes("learn")) return "create_course";
  if (text.includes("research") || text.includes("market") || text.includes("competitor")) return "research_market";
  if (text.includes("analyze competitor") || text.includes("compare tools")) return "analyze_competitor";
  if (text.includes("upgrade pantavion") || text.includes("improve pantavion") || text.includes("gap")) return "upgrade_pantavion";
  return "unknown";
}

function buildMission(input: CompletionRequest): CompletionMission {
  const normalized = normalize(input.text);
  const intent = detectIntent(normalized);

  let title = "Pantavion Completion Mission";
  let strategicMode: CompletionMission["strategicMode"] = "mixed";

  switch (intent) {
    case "build_app":
      title = "Build application from intent";
      strategicMode = "build";
      break;
    case "build_website":
      title = "Build website from intent";
      strategicMode = "build";
      break;
    case "create_feature":
      title = "Create governed Pantavion feature";
      strategicMode = "build";
      break;
    case "create_workflow":
      title = "Create execution workflow";
      strategicMode = "build";
      break;
    case "create_catalog":
      title = "Create catalog / registry surface";
      strategicMode = "build";
      break;
    case "create_course":
      title = "Create guided mastery course";
      strategicMode = "build";
      break;
    case "research_market":
      title = "Research market and extract capability signals";
      strategicMode = "research";
      break;
    case "analyze_competitor":
      title = "Analyze competitor and convert signal to Pantavion advantage";
      strategicMode = "research";
      break;
    case "upgrade_pantavion":
      title = "Upgrade Pantavion from detected gap";
      strategicMode = "upgrade";
      break;
    default:
      title = "Resolve request into governed completion path";
      strategicMode = "mixed";
  }

  return {
    id: makeId("mission"),
    title,
    intent,
    modality: input.modality ?? "text",
    source: input.source ?? "user",
    summary: input.text.trim(),
    strategicMode,
  };
}

function buildTaskGraph(mission: CompletionMission): ExecutionUnit[] {
  const base: ExecutionUnit[] = [
    {
      id: "spec",
      type: "spec",
      title: "Create complete specification",
      dependsOn: [],
      required: true,
      output: "specification.md",
      status: "pending",
    },
    {
      id: "architecture",
      type: "architecture",
      title: "Create architecture design",
      dependsOn: ["spec"],
      required: true,
      output: "architecture.json",
      status: "pending",
    },
    {
      id: "verification",
      type: "verification",
      title: "Run completion verification",
      dependsOn: [],
      required: true,
      output: "verification-report.json",
      status: "pending",
    },
  ];

  switch (mission.intent) {
    case "build_app":
    case "build_website":
      return [
        ...base,
        {
          id: "data_model",
          type: "data_model",
          title: "Define data model",
          dependsOn: ["spec", "architecture"],
          required: true,
          output: "data-model.json",
          status: "pending",
        },
        {
          id: "ui",
          type: "ui",
          title: "Create UI surface",
          dependsOn: ["spec", "architecture"],
          required: true,
          output: "ui.tsx",
          status: "pending",
        },
        {
          id: "backend",
          type: "backend",
          title: "Create backend logic",
          dependsOn: ["spec", "architecture", "data_model"],
          required: true,
          output: "backend.ts",
          status: "pending",
        },
      ];

    case "create_feature":
      return [
        ...base,
        {
          id: "ui",
          type: "ui",
          title: "Create feature UI",
          dependsOn: ["spec", "architecture"],
          required: true,
          output: "feature-ui.tsx",
          status: "pending",
        },
        {
          id: "backend",
          type: "backend",
          title: "Create feature backend",
          dependsOn: ["spec", "architecture"],
          required: true,
          output: "feature-backend.ts",
          status: "pending",
        },
      ];

    case "create_workflow":
      return [
        ...base,
        {
          id: "workflow",
          type: "workflow",
          title: "Create workflow stages and transitions",
          dependsOn: ["spec", "architecture"],
          required: true,
          output: "workflow.json",
          status: "pending",
        },
      ];

    case "create_catalog":
      return [
        ...base,
        {
          id: "registry",
          type: "registry",
          title: "Create registry schema and metadata model",
          dependsOn: ["spec", "architecture"],
          required: true,
          output: "registry-schema.json",
          status: "pending",
        },
        {
          id: "ui",
          type: "ui",
          title: "Create catalog surface",
          dependsOn: ["spec", "architecture", "registry"],
          required: true,
          output: "catalog-ui.tsx",
          status: "pending",
        },
      ];

    case "create_course":
      return [
        ...base,
        {
          id: "course",
          type: "course",
          title: "Create course structure and lessons",
          dependsOn: ["spec", "architecture"],
          required: true,
          output: "course-outline.json",
          status: "pending",
        },
      ];

    case "research_market":
    case "analyze_competitor":
      return [
        ...base,
        {
          id: "registry",
          type: "registry",
          title: "Convert findings into registry signals",
          dependsOn: ["spec"],
          required: true,
          output: "research-signals.json",
          status: "pending",
        },
        {
          id: "workflow",
          type: "workflow",
          title: "Create follow-up action workflow",
          dependsOn: ["spec", "registry"],
          required: true,
          output: "follow-up-workflow.json",
          status: "pending",
        },
      ];

    case "upgrade_pantavion":
      return [
        ...base,
        {
          id: "architecture_upgrade",
          type: "architecture",
          title: "Design upgrade path",
          dependsOn: ["spec"],
          required: true,
          output: "upgrade-architecture.json",
          status: "pending",
        },
        {
          id: "repair_upgrade",
          type: "repair",
          title: "Create repair and rollout path",
          dependsOn: ["architecture_upgrade"],
          required: true,
          output: "repair-plan.json",
          status: "pending",
        },
      ];

    default:
      return base;
  }
}

function verifyTaskGraph(taskGraph: ExecutionUnit[]): CompletionVerifier {
  const types = taskGraph.map((x) => x.type);

  const checks = {
    specificationPresent: types.includes("spec"),
    architecturePresent: types.includes("architecture"),
    executionPathPresent: taskGraph.length > 2,
    publishGateDefined: true,
    gapsDetected: false,
  };

  const missing: string[] = [];
  if (!checks.specificationPresent) missing.push("Missing specification unit.");
  if (!checks.architecturePresent) missing.push("Missing architecture unit.");
  if (!checks.executionPathPresent) missing.push("Missing execution path.");

  let verdict: CompletionVerifier["verdict"] = "ready_for_publish";
  if (missing.length > 0) verdict = "repair_required";
  if (taskGraph.length <= 2) verdict = "incomplete";

  return {
    checks,
    missing,
    verdict,
  };
}

function buildRepairs(verifier: CompletionVerifier): CompletionRepairAction[] {
  return verifier.missing.map((item) => ({
    id: makeId("repair"),
    title: "Repair missing completion part",
    reason: item,
    status: "pending",
  }));
}

function decideStatus(verifier: CompletionVerifier): CompletionStatus {
  if (verifier.verdict === "ready_for_publish") return "ready_for_publish";
  if (verifier.verdict === "repair_required") return "repairing";
  return "planned";
}

function finalDecision(
  mission: CompletionMission,
  verifier: CompletionVerifier,
  repairs: CompletionRepairAction[],
): string {
  if (verifier.verdict === "ready_for_publish") {
    return `Mission "${mission.title}" is structurally complete and ready for execution/publish gate.`;
  }

  if (repairs.length > 0) {
    return `Mission "${mission.title}" is not complete yet. Repair loop must run before publish.`;
  }

  return `Mission "${mission.title}" is planned but still incomplete.`;
}

export function runPantavionKernelCompletion(input: CompletionRequest): CompletionResult {
  const mission = buildMission(input);
  const taskGraph = buildTaskGraph(mission);
  const verifier = verifyTaskGraph(taskGraph);
  const repairs = buildRepairs(verifier);
  const status = decideStatus(verifier);

  return {
    ok: true,
    mission,
    status,
    taskGraph,
    missing: verifier.missing,
    repairs,
    verifier,
    finalDecision: finalDecision(mission, verifier, repairs),
  };
}
