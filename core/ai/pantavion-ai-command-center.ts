export type PantaAiAssistantAudience = "public" | "user" | "internal" | "sos" | "business" | "creator";
export type PantaAiRiskLane = "general" | "safety" | "medical-boundary" | "legal-boundary" | "financial-boundary";

export interface PantaAiAssistantDefinition {
  key: string;
  name: string;
  audience: PantaAiAssistantAudience;
  mission: string;
  route: string;
  riskLane: PantaAiRiskLane;
  visibleToPublic: boolean;
}

export const PANTAVION_AI_COMMAND_CENTER_LOCK = {
  marker: "PANTAVION_AI_COMMAND_CENTER_V1",
  publicRoute: "/panta-ai",
  doctrine:
    "Pantavion AI is one organized capability center: public AI for the world, personal AI for each user, internal Guardian/Kernel AI for platform integrity, SOS AI for safety language, and work/income AI for execution.",
  noFakeButtons: true,
  providerRequiredForLiveAnswers: true,
} as const;

export const PANTAVION_AI_ASSISTANTS = {
  publicGuide: {
    key: "publicGuide",
    name: "PantaAI Public Guide",
    audience: "public",
    mission: "Answer public questions about Pantavion, world communication, translation, safety, culture, work, and learning.",
    route: "/panta-ai",
    riskLane: "general",
    visibleToPublic: true,
  },
  personalUserAssistant: {
    key: "personalUserAssistant",
    name: "Personal PantaAI",
    audience: "user",
    mission: "Help each user organize messages, translations, travel, work, learning, contacts, reminders, and daily life after consent and account setup.",
    route: "/panta-ai",
    riskLane: "general",
    visibleToPublic: true,
  },
  internalGuardian: {
    key: "internalGuardian",
    name: "Pantavion Guardian Kernel",
    audience: "internal",
    mission: "Observe requirements, compare repo state, detect gaps, propose safe patches, run audits, and protect the platform from fake/static features.",
    route: "/panta-ai",
    riskLane: "safety",
    visibleToPublic: false,
  },
  sosLanguageGuardian: {
    key: "sosLanguageGuardian",
    name: "SOS Language Guardian",
    audience: "sos",
    mission: "Create short emergency-safe translations, elder-safe instructions, and trusted-contact wording without claiming authority dispatch.",
    route: "/sos",
    riskLane: "medical-boundary",
    visibleToPublic: true,
  },
  workIncomeAssistant: {
    key: "workIncomeAssistant",
    name: "Work and Income Assistant",
    audience: "business",
    mission: "Help users structure services, jobs, marketplace listings, learning-to-income paths, and safe business workflows.",
    route: "/panta-ai",
    riskLane: "financial-boundary",
    visibleToPublic: true,
  },
  creatorMediaAssistant: {
    key: "creatorMediaAssistant",
    name: "Creator and Media Assistant",
    audience: "creator",
    mission: "Help users create posts, multilingual content, captions, scripts, media ideas, and accessibility subtitles.",
    route: "/panta-ai",
    riskLane: "general",
    visibleToPublic: true,
  },
} as const satisfies Record<string, PantaAiAssistantDefinition>;

export type PantaAiAssistantKey = keyof typeof PANTAVION_AI_ASSISTANTS;

export function buildPantaAiSystemInstruction(assistantKey: string): string {
  const assistant =
    PANTAVION_AI_ASSISTANTS[assistantKey as PantaAiAssistantKey] ??
    PANTAVION_AI_ASSISTANTS.publicGuide;

  return [
    `You are ${assistant.name}.`,
    `Mission: ${assistant.mission}`,
    "You are part of Pantavion, a planetary unification platform.",
    "Be practical, precise, multilingual, safety-aware, and execution-first.",
    "Never claim medical, legal, financial, emergency, satellite, police, ambulance, or government authority unless the platform has a verified provider/institutional integration.",
    "When safety is involved, use clear escalation language and trusted-contact boundaries.",
  ].join("\n");
}

export function listVisiblePantaAiAssistants() {
  return Object.values(PANTAVION_AI_ASSISTANTS).filter((assistant) => assistant.visibleToPublic);
}
