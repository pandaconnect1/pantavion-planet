import { pantavionTechRadar, type RadarItem } from "@/core/pantavion-tech-radar";

export type EvolutionDecision =
  | "build-native"
  | "build-connector"
  | "route-to-learning"
  | "watch"
  | "reject";

export type EvolutionPlan = {
  id: string;
  title: string;
  decision: EvolutionDecision;
  rationale: string[];
  firstActions: string[];
  targetModules: string[];
  confidence: number;
};

function decide(item: RadarItem): EvolutionDecision {
  if (item.signalClass === "voice-system") return "build-native";
  if (item.signalClass === "software-builder") return "build-native";
  if (item.signalClass === "connector-opportunity") return "build-connector";
  if (item.signalClass === "learning-track") return "route-to-learning";
  if (item.urgency === "critical" && item.nativeCandidates.length > 0) return "build-native";
  if (item.connectorCandidates.length > 0) return "build-connector";
  return "watch";
}

function firstActionsFor(item: RadarItem, decision: EvolutionDecision): string[] {
  switch (decision) {
    case "build-native":
      return [
        "Create module brief",
        "Create architecture notes",
        "Generate first file tree",
        "Define state and memory contracts"
      ];
    case "build-connector":
      return [
        "Map provider surface",
        "Define adapter contract",
        "Create connector registry entry",
        "Prepare governed integration path"
      ];
    case "route-to-learning":
      return [
        "Create learning track record",
        "Map prerequisites",
        "Generate guided mastery path",
        "Attach to PantaLearn and Mind"
      ];
    case "watch":
      return [
        "Keep in radar",
        "Monitor demand",
        "Re-evaluate against Pantavion gaps"
      ];
    default:
      return ["Reject and archive"];
  }
}

function rationaleFor(item: RadarItem, decision: EvolutionDecision): string[] {
  return [
    `signal class resolved to ${item.signalClass}`,
    `urgency resolved to ${item.urgency}`,
    `global relevance score is ${item.globalRelevance}`,
    `decision selected: ${decision}`
  ];
}

function confidenceFor(item: RadarItem, decision: EvolutionDecision): number {
  let score = 0.62;

  if (item.urgency === "critical") score += 0.12;
  if (item.globalRelevance >= 90) score += 0.08;
  if (decision === "build-native") score += 0.08;
  if (decision === "build-connector") score += 0.05;

  return Math.min(score, 0.96);
}

export const pantavionEvolutionPlans: EvolutionPlan[] = pantavionTechRadar.map((item) => {
  const decision = decide(item);

  return {
    id: item.id,
    title: item.title,
    decision,
    rationale: rationaleFor(item, decision),
    firstActions: firstActionsFor(item, decision),
    targetModules: item.moduleTargets,
    confidence: confidenceFor(item, decision)
  };
});

export function getEvolutionPriorityQueue() {
  const order: Record<EvolutionDecision, number> = {
    "build-native": 1,
    "build-connector": 2,
    "route-to-learning": 3,
    "watch": 4,
    "reject": 5
  };

  return [...pantavionEvolutionPlans].sort((a, b) => {
    const byDecision = order[a.decision] - order[b.decision];
    if (byDecision !== 0) return byDecision;
    return b.confidence - a.confidence;
  });
}
