import { pantavionSignalSeeds, type PantavionSignalSeed } from "./pantavion-signal-seeds";

export type PantavionInputClassification = {
  input: string;
  detectedType:
    | "tool-hub"
    | "ai-marketplace"
    | "voice-agent"
    | "income-system"
    | "business-framework"
    | "software-builder"
    | "learning-system"
    | "data-ml-map"
    | "research-signal"
    | "general";
  targetModule:
    | "Tools Hub"
    | "Voice"
    | "Compass"
    | "People"
    | "Mind"
    | "Create"
    | "PantaLearn"
    | "Kernel"
    | "Business Layer"
    | "Research Layer";
  userSegment:
    | "general-users"
    | "students"
    | "professionals"
    | "freelancers"
    | "founders"
    | "businesses"
    | "teams"
    | "developers"
    | "creators"
    | "data-users";
  incomeRelated: boolean;
  learningRelated: boolean;
  toolDiscovery: boolean;
  businessFramework: boolean;
  deliveryType:
    | "native-feature"
    | "connector"
    | "catalog"
    | "course"
    | "workflow";
  matchedSeedIds: string[];
  matchedThemes: string[];
  cleanConclusion: string;
};

function normalize(input: string) {
  return input.toLowerCase().trim();
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

function detectType(text: string): PantavionInputClassification["detectedType"] {
  if (includesAny(text, ["voice", "call", "phone", "telephony", "φων", "κλήσ", "τηλεφων"])) return "voice-agent";
  if (includesAny(text, ["tool", "tools", "marketplace", "catalog", "directory", "discover", "ανακάλυ", "εργαλεί"])) return "tool-hub";
  if (includesAny(text, ["income", "client", "freelance", "offer", "pricing", "εισόδη", "πελάτ", "freelancer"])) return "income-system";
  if (includesAny(text, ["okr", "raci", "scorecard", "framework", "operating system", "execution", "διοίκ", "framework"])) return "business-framework";
  if (includesAny(text, ["build app", "software", "code", "platform", "builder", "schema", "deploy", "πρόγραμμα", "app", "κώδικ"])) return "software-builder";
  if (includesAny(text, ["learn", "course", "education", "certification", "mastery", "roadmap", "μάθη", "εκπαίδευ", "course"])) return "learning-system";
  if (includesAny(text, ["data", "ml", "machine learning", "python", "sql", "ai engineer", "analytics"])) return "data-ml-map";
  if (includesAny(text, ["research", "trend", "radar", "signal", "technology", "discovery", "έρευν", "τεχνολογ"])) return "research-signal";
  if (includesAny(text, ["ai marketplace", "ai hub"])) return "ai-marketplace";
  return "general";
}

function targetModuleFromType(type: PantavionInputClassification["detectedType"]): PantavionInputClassification["targetModule"] {
  switch (type) {
    case "voice-agent":
      return "Voice";
    case "tool-hub":
    case "ai-marketplace":
      return "Tools Hub";
    case "income-system":
    case "business-framework":
      return "Compass";
    case "software-builder":
      return "Create";
    case "learning-system":
    case "data-ml-map":
      return "PantaLearn";
    case "research-signal":
      return "Research Layer";
    default:
      return "Kernel";
  }
}

function userSegmentFromType(type: PantavionInputClassification["detectedType"]): PantavionInputClassification["userSegment"] {
  switch (type) {
    case "voice-agent":
      return "businesses";
    case "tool-hub":
    case "ai-marketplace":
      return "professionals";
    case "income-system":
      return "freelancers";
    case "business-framework":
      return "teams";
    case "software-builder":
      return "developers";
    case "learning-system":
      return "students";
    case "data-ml-map":
      return "data-users";
    case "research-signal":
      return "founders";
    default:
      return "general-users";
  }
}

function deliveryTypeFromType(type: PantavionInputClassification["detectedType"]): PantavionInputClassification["deliveryType"] {
  switch (type) {
    case "voice-agent":
      return "workflow";
    case "tool-hub":
    case "ai-marketplace":
      return "catalog";
    case "income-system":
      return "workflow";
    case "business-framework":
      return "workflow";
    case "software-builder":
      return "native-feature";
    case "learning-system":
    case "data-ml-map":
      return "course";
    case "research-signal":
      return "connector";
    default:
      return "native-feature";
  }
}

function scoreSeed(seed: PantavionSignalSeed, text: string) {
  let score = 0;

  const hay = [
    seed.title,
    seed.domain,
    seed.category,
    seed.summary,
    ...seed.userNeeds,
    ...seed.monetizationPaths,
    ...seed.moduleTargets,
    ...seed.nativeCandidates,
    ...seed.connectorCandidates,
    ...seed.userSegments
  ]
    .join(" ")
    .toLowerCase();

  const words = text.split(/\s+/).filter(Boolean);

  for (const word of words) {
    if (word.length < 3) continue;
    if (hay.includes(word)) score += 1;
  }

  if (text.includes(seed.domain)) score += 3;
  if (text.includes(seed.category)) score += 4;

  return score;
}

function buildConclusion(
  type: PantavionInputClassification["detectedType"],
  module: PantavionInputClassification["targetModule"],
  segment: PantavionInputClassification["userSegment"],
  deliveryType: PantavionInputClassification["deliveryType"],
  flags: {
    incomeRelated: boolean;
    learningRelated: boolean;
    toolDiscovery: boolean;
    businessFramework: boolean;
  }
) {
  const descriptors: string[] = [];

  if (flags.incomeRelated) descriptors.push("income-related");
  if (flags.learningRelated) descriptors.push("learning-related");
  if (flags.toolDiscovery) descriptors.push("tool-discovery");
  if (flags.businessFramework) descriptors.push("business-framework");

  const mode = descriptors.length > 0 ? descriptors.join(", ") : "general-kernel";

  return `Το input ταξινομήθηκε ως ${type}, πάει κυρίως στο module ${module}, αφορά κυρίως το segment ${segment}, έχει χαρακτήρα ${mode}, και το σωστό πρώτο delivery mode είναι ${deliveryType}.`;
}

export function classifyPantavionInput(input: string): PantavionInputClassification {
  const text = normalize(input);
  const detectedType = detectType(text);
  const targetModule = targetModuleFromType(detectedType);
  const userSegment = userSegmentFromType(detectedType);

  const incomeRelated = includesAny(text, [
    "income", "client", "pricing", "sales", "revenue", "freelance", "εισόδη", "πελάτ", "πωλήσ", "χρήμα"
  ]);

  const learningRelated = includesAny(text, [
    "learn", "course", "education", "roadmap", "training", "study", "μάθη", "εκπαίδευ", "course", "skill"
  ]);

  const toolDiscovery = includesAny(text, [
    "tool", "tools", "directory", "catalog", "marketplace", "discover", "εργαλεί", "catalog", "stack"
  ]);

  const businessFramework = includesAny(text, [
    "framework", "okr", "raci", "scorecard", "operating system", "execution", "process", "framework", "διοίκ"
  ]);

  const deliveryType = deliveryTypeFromType(detectedType);

  const ranked = pantavionSignalSeeds
    .map((seed) => ({ seed, score: scoreSeed(seed, text) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const matchedSeedIds = ranked.map((item) => item.seed.id);
  const matchedThemes = ranked.map((item) => item.seed.title);

  const cleanConclusion = buildConclusion(
    detectedType,
    targetModule,
    userSegment,
    deliveryType,
    {
      incomeRelated,
      learningRelated,
      toolDiscovery,
      businessFramework
    }
  );

  return {
    input,
    detectedType,
    targetModule,
    userSegment,
    incomeRelated,
    learningRelated,
    toolDiscovery,
    businessFramework,
    deliveryType,
    matchedSeedIds,
    matchedThemes,
    cleanConclusion
  };
}
