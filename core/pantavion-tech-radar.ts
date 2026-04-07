import { pantavionSignalSeeds } from "@/core/pantavion-signal-seeds";

export type RadarSignalClass =
  | "native-feature"
  | "connector-opportunity"
  | "learning-track"
  | "business-system"
  | "voice-system"
  | "software-builder"
  | "market-watch";

export type RadarItem = {
  id: string;
  title: string;
  signalClass: RadarSignalClass;
  domain: string;
  summary: string;
  moduleTargets: string[];
  nativeCandidates: string[];
  connectorCandidates: string[];
  monetizationPaths: string[];
  urgency: "critical" | "high" | "medium";
  globalRelevance: number;
};

function resolveSignalClass(domain: string, category: string): RadarSignalClass {
  const lower = `${domain} ${category}`.toLowerCase();

  if (lower.includes("voice")) return "voice-system";
  if (lower.includes("software") || lower.includes("app-building")) return "software-builder";
  if (lower.includes("learning") || lower.includes("guided-mastery") || lower.includes("certification")) {
    return "learning-track";
  }
  if (lower.includes("management") || lower.includes("framework") || lower.includes("income")) {
    return "business-system";
  }
  if (lower.includes("tools")) return "connector-opportunity";

  return "market-watch";
}

export const pantavionTechRadar: RadarItem[] = pantavionSignalSeeds.map((seed) => {
  const signalClass = resolveSignalClass(seed.domain, seed.category);

  let globalRelevance = 70;

  if (seed.geographyScope === "global") globalRelevance += 10;
  if (seed.languageScope === "multilingual") globalRelevance += 10;
  if (seed.priority === "critical") globalRelevance += 10;
  if (signalClass === "voice-system" || signalClass === "software-builder") globalRelevance += 5;

  return {
    id: seed.id,
    title: seed.title,
    signalClass,
    domain: seed.domain,
    summary: seed.summary,
    moduleTargets: seed.moduleTargets,
    nativeCandidates: seed.nativeCandidates,
    connectorCandidates: seed.connectorCandidates,
    monetizationPaths: seed.monetizationPaths,
    urgency: seed.priority,
    globalRelevance: Math.min(globalRelevance, 100)
  };
});

export function getRadarByUrgency(urgency: "critical" | "high" | "medium") {
  return pantavionTechRadar.filter((item) => item.urgency === urgency);
}

export function getRadarByDomain(domain: string) {
  return pantavionTechRadar.filter((item) => item.domain === domain);
}
