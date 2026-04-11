import type { CapabilityProfile } from "./types";

export const DEFAULT_CAPABILITIES: CapabilityProfile[] = [
  {
    id: "assist.reasoning.general",
    family: "assistants_reasoning",
    name: "General Reasoning Assistant",
    description: "General reasoning, drafting, planning, and synthesis.",
    inputModalities: ["text", "doc", "pdf", "screenshot", "mixed"],
    outputModalities: ["text", "doc"],
    allowedScopes: ["session", "thread", "workspace", "project"],
    trustZoneFloor: "uncertain",
    orchestrationEligible: true,
    metadata: {},
  },
  {
    id: "research.knowledge.synthesis",
    family: "research_knowledge",
    name: "Research and Knowledge Synthesis",
    description: "Verification-sensitive research, synthesis, and contextual explanation.",
    inputModalities: ["text", "pdf", "doc", "screenshot"],
    outputModalities: ["text", "doc"],
    allowedScopes: ["thread", "workspace", "project"],
    trustZoneFloor: "likely",
    orchestrationEligible: true,
    metadata: {},
  },
  {
    id: "coding.app.kernel",
    family: "coding_app_building",
    name: "Kernel Coding Workspace",
    description: "Full-file code generation, refactors, and architecture implementation.",
    inputModalities: ["text", "doc", "screenshot"],
    outputModalities: ["text", "doc"],
    allowedScopes: ["workspace", "project", "thread"],
    trustZoneFloor: "uncertain",
    orchestrationEligible: true,
    metadata: {},
  },
  {
    id: "productivity.memory.continuity",
    family: "productivity_memory",
    name: "Continuity and Memory Workspace",
    description: "Thread continuity, memory shaping, and long-running project context.",
    inputModalities: ["text", "doc", "mixed"],
    outputModalities: ["text", "doc"],
    allowedScopes: ["thread", "workspace", "project", "user"],
    trustZoneFloor: "uncertain",
    orchestrationEligible: true,
    metadata: {},
  },
  {
    id: "automation.integrations.workflow",
    family: "automation_integrations",
    name: "Workflow Automation",
    description: "Task orchestration, routing, and workflow design.",
    inputModalities: ["text", "doc"],
    outputModalities: ["text", "doc"],
    allowedScopes: ["workspace", "project"],
    trustZoneFloor: "uncertain",
    orchestrationEligible: true,
    metadata: {},
  },
  {
    id: "learning.mastery.path",
    family: "learning_mastery",
    name: "Guided Mastery Path",
    description: "Roadmaps, skill ladders, and guided mastery structures.",
    inputModalities: ["text", "pdf", "doc", "image"],
    outputModalities: ["text", "doc", "image"],
    allowedScopes: ["thread", "workspace", "project", "user"],
    trustZoneFloor: "uncertain",
    orchestrationEligible: true,
    metadata: {},
  },
  {
    id: "reference.cheatsheet.quickcards",
    family: "reference_cheatsheets",
    name: "Reference and Cheat Sheets",
    description: "Quick reference cards, shortcut maps, and structured concept packs.",
    inputModalities: ["text", "image", "screenshot", "pdf"],
    outputModalities: ["text", "doc", "image"],
    allowedScopes: ["thread", "workspace", "project"],
    trustZoneFloor: "uncertain",
    orchestrationEligible: true,
    metadata: {},
  },
  {
    id: "signal.intelligence.market",
    family: "signal_intelligence",
    name: "Signal Intelligence",
    description: "Ingest trends, hype, weak signals, and market/tech changes under trust controls.",
    inputModalities: ["text", "screenshot", "image", "doc", "mixed"],
    outputModalities: ["text", "doc"],
    allowedScopes: ["workspace", "project", "system"],
    trustZoneFloor: "uncertain",
    orchestrationEligible: true,
    metadata: {},
  },
  {
    id: "security.governance.policy",
    family: "security_governance",
    name: "Security and Governance",
    description: "Policy checks, privacy checks, safety boundaries, and execution gating.",
    inputModalities: ["text", "doc"],
    outputModalities: ["text", "doc"],
    allowedScopes: ["session", "thread", "workspace", "project", "admin"],
    trustZoneFloor: "likely",
    orchestrationEligible: true,
    metadata: {},
  },
];

const KEYWORD_MAP: Array<{ id: string; words: string[] }> = [
  {
    id: "coding.app.kernel",
    words: ["code", "kernel", "typescript", "ts", "route", "api", "build", "vs code", "terminal"],
  },
  {
    id: "automation.integrations.workflow",
    words: ["workflow", "orchestr", "automation", "routing", "run", "execute"],
  },
  {
    id: "signal.intelligence.market",
    words: ["signal", "trend", "news", "tools", "comparison", "hype"],
  },
  {
    id: "learning.mastery.path",
    words: ["learn", "mastery", "roadmap", "course", "study", "sql", "data"],
  },
  {
    id: "reference.cheatsheet.quickcards",
    words: ["shortcut", "cheatsheet", "reference", "card", "diagram"],
  },
  {
    id: "research.knowledge.synthesis",
    words: ["research", "verify", "citation", "source", "proof"],
  },
];

export const getCapabilityById = (id: string): CapabilityProfile | undefined =>
  DEFAULT_CAPABILITIES.find((capability) => capability.id === id);

export const recommendCapabilitiesForText = (text: string): string[] => {
  const lower = text.toLowerCase();
  const hits = KEYWORD_MAP
    .filter((entry) => entry.words.some((word) => lower.includes(word)))
    .map((entry) => entry.id);

  if (hits.length === 0) {
    return ["assist.reasoning.general", "productivity.memory.continuity"];
  }

  return Array.from(new Set(["assist.reasoning.general", ...hits]));
};
