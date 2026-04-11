import type {
  KernelClassification,
  KernelModuleKey,
  KernelPlanStep,
  IntakeType,
  UserSegment,
  DeliveryMode
} from "./kernel-types";

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

function detectType(text: string): IntakeType {
  if (includesAny(text, ["voice", "φων", "call", "phone", "telephony", "stt", "tts", "translator"])) {
    return "voice-agent";
  }

  if (includesAny(text, ["tool", "tools", "catalog", "directory", "marketplace", "discover", "stack", "εργαλ"])) {
    return "tool-discovery";
  }

  if (includesAny(text, ["learn", "course", "education", "roadmap", "study", "skill", "μάθη", "εκπαίδευ"])) {
    return "learning-system";
  }

  if (includesAny(text, ["okr", "raci", "scorecard", "framework", "operating system", "execution", "process"])) {
    return "business-framework";
  }

  if (includesAny(text, ["income", "pricing", "revenue", "sales", "client", "freelance", "offer", "εισόδη", "πελάτ"])) {
    return "income-system";
  }

  if (includesAny(text, ["data", "ml", "machine learning", "python", "sql", "analytics", "deep learning"])) {
    return "data-ml-map";
  }

  if (includesAny(text, ["build", "app", "software", "platform", "code", "schema", "api", "deploy", "πρόγραμμα", "κώδικ"])) {
    return "software-builder";
  }

  return "general";
}

function moduleFromType(type: IntakeType): KernelModuleKey {
  switch (type) {
    case "voice-agent":
      return "Voice";
    case "tool-discovery":
      return "Tools Hub";
    case "learning-system":
    case "data-ml-map":
      return "PantaLearn";
    case "business-framework":
    case "income-system":
      return "Compass";
    case "software-builder":
      return "Create";
    default:
      return "Kernel";
  }
}

function segmentFromType(type: IntakeType): UserSegment {
  switch (type) {
    case "voice-agent":
      return "businesses";
    case "tool-discovery":
      return "professionals";
    case "learning-system":
      return "students";
    case "business-framework":
      return "teams";
    case "income-system":
      return "freelancers";
    case "data-ml-map":
      return "data-users";
    case "software-builder":
      return "developers";
    default:
      return "general-users";
  }
}

function deliveryFromType(type: IntakeType): DeliveryMode {
  switch (type) {
    case "voice-agent":
      return "workflow";
    case "tool-discovery":
      return "catalog";
    case "learning-system":
    case "data-ml-map":
      return "course";
    case "business-framework":
    case "income-system":
      return "workflow";
    case "software-builder":
      return "native-feature";
    default:
      return "native-feature";
  }
}

export function classifyInput(input: string): KernelClassification {
  const text = input.toLowerCase().trim();
  const detectedType = detectType(text);
  const targetModule = moduleFromType(detectedType);
  const userSegment = segmentFromType(detectedType);
  const deliveryMode = deliveryFromType(detectedType);

  const incomeRelated = includesAny(text, [
    "income", "pricing", "revenue", "sales", "client", "freelance", "offer", "εισόδη", "πελάτ"
  ]);

  const learningRelated = includesAny(text, [
    "learn", "course", "education", "roadmap", "study", "skill", "μάθη", "εκπαίδευ"
  ]);

  const toolDiscovery = includesAny(text, [
    "tool", "tools", "catalog", "directory", "marketplace", "discover", "stack", "εργαλ"
  ]);

  const businessFramework = includesAny(text, [
    "okr", "raci", "scorecard", "framework", "operating system", "execution", "process"
  ]);

  const cleanConclusion =
    `Το input ταξινομήθηκε ως ${detectedType}, πάει κυρίως στο module ${targetModule}, ` +
    `αφορά κυρίως το segment ${userSegment}, τζαι το σωστό πρώτο delivery mode είναι ${deliveryMode}.`;

  return {
    detectedType,
    targetModule,
    userSegment,
    incomeRelated,
    learningRelated,
    toolDiscovery,
    businessFramework,
    deliveryMode,
    cleanConclusion
  };
}

export function createPlan(input: string, classification: KernelClassification): KernelPlanStep[] {
  const steps: KernelPlanStep[] = [
    {
      id: id("step"),
      title: "Classify request",
      module: "Kernel",
      status: "planned",
      reason: "Every request must be classified before execution."
    },
    {
      id: id("step"),
      title: "Store request in canonical memory",
      module: "Kernel",
      status: "planned",
      reason: "Kernel must preserve continuity."
    }
  ];

  switch (classification.detectedType) {
    case "software-builder":
      steps.push(
        {
          id: id("step"),
          title: "Define target architecture",
          module: "Create",
          status: "planned",
          reason: "Complex software needs explicit architecture.",
          targetFile: "docs/generated-architecture.md"
        },
        {
          id: id("step"),
          title: "Define API and data boundaries",
          module: "Create",
          status: "planned",
          reason: "Software systems need stable interfaces.",
          targetFile: "docs/generated-api-plan.md"
        },
        {
          id: id("step"),
          title: "Prepare app build workflow",
          module: "Create",
          status: "planned",
          reason: "Builder mode must be executable.",
          targetFile: "docs/generated-build-workflow.md"
        }
      );
      break;

    case "voice-agent":
      steps.push(
        {
          id: id("step"),
          title: "Define voice flow",
          module: "Voice",
          status: "planned",
          reason: "Voice systems need turn-by-turn flow.",
          targetFile: "docs/generated-voice-flow.md"
        },
        {
          id: id("step"),
          title: "Define intake, detect, translate, respond stages",
          module: "Voice",
          status: "planned",
          reason: "Voice requires structured runtime stages.",
          targetFile: "docs/generated-voice-runtime.md"
        }
      );
      break;

    case "tool-discovery":
      steps.push(
        {
          id: id("step"),
          title: "Define catalog categories",
          module: "Tools Hub",
          status: "planned",
          reason: "Discovery systems need structured categories.",
          targetFile: "docs/generated-tools-catalog.md"
        },
        {
          id: id("step"),
          title: "Define ranking and fit logic",
          module: "Tools Hub",
          status: "planned",
          reason: "Tool discovery must rank usefulness cleanly.",
          targetFile: "docs/generated-tools-ranking.md"
        }
      );
      break;

    case "learning-system":
    case "data-ml-map":
      steps.push(
        {
          id: id("step"),
          title: "Define guided mastery path",
          module: "PantaLearn",
          status: "planned",
          reason: "Learning needs ordered progression.",
          targetFile: "docs/generated-learning-path.md"
        },
        {
          id: id("step"),
          title: "Define milestones and outcomes",
          module: "PantaLearn",
          status: "planned",
          reason: "Learning must map to real progress.",
          targetFile: "docs/generated-learning-outcomes.md"
        }
      );
      break;

    case "business-framework":
    case "income-system":
      steps.push(
        {
          id: id("step"),
          title: "Define execution workflow",
          module: "Compass",
          status: "planned",
          reason: "Business systems need operational structure.",
          targetFile: "docs/generated-business-workflow.md"
        },
        {
          id: id("step"),
          title: "Define monetization and accountability logic",
          module: "Compass",
          status: "planned",
          reason: "Income/business flows need measurable outcomes.",
          targetFile: "docs/generated-business-logic.md"
        }
      );
      break;

    default:
      steps.push(
        {
          id: id("step"),
          title: "Escalate to kernel review",
          module: "Kernel",
          status: "planned",
          reason: "General requests need central routing.",
          targetFile: "docs/generated-kernel-review.md"
        }
      );
      break;
  }

  steps.push({
    id: id("step"),
    title: "Return governed execution summary",
    module: "Kernel",
    status: "planned",
    reason: "Kernel must always close with a clean decision."
  });

  return steps;
}
