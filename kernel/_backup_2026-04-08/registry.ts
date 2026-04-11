import type { ClassificationResult } from "./classifier";

export interface RegistryMapping {
  domain: string;
  workspace: string;
  category: string;
  module: string;
  core: string;
  capabilityFamilies: string[];
  policyZone: string;
  entityFamily: string;
}

const DOMAIN_REGISTRY: Record<string, Omit<RegistryMapping, "domain">> = {
  creator: {
    workspace: "creator",
    category: "creative-systems",
    module: "Create",
    core: "creative-intelligence",
    capabilityFamilies: ["compare", "group", "suggest", "generate", "execute"],
    policyZone: "creative-safe",
    entityFamily: "creative-asset"
  },
  developer: {
    workspace: "execution",
    category: "engineering-systems",
    module: "Build",
    core: "engineering-intelligence",
    capabilityFamilies: ["classify", "map", "plan", "generate", "execute"],
    policyZone: "code-reviewed",
    entityFamily: "technical-asset"
  },
  research: {
    workspace: "research",
    category: "discovery-systems",
    module: "Mind",
    core: "research-intelligence",
    capabilityFamilies: ["retrieve", "compare", "group", "summarize", "suggest"],
    policyZone: "research-safe",
    entityFamily: "knowledge-asset"
  },
  data: {
    workspace: "knowledge",
    category: "data-systems",
    module: "Mind",
    core: "data-intelligence",
    capabilityFamilies: ["classify", "group", "compare", "execute", "summarize"],
    policyZone: "data-governed",
    entityFamily: "data-asset"
  },
  business: {
    workspace: "business",
    category: "business-systems",
    module: "Compass",
    core: "business-intelligence",
    capabilityFamilies: ["compare", "prioritize", "plan", "suggest", "execute"],
    policyZone: "business-safe",
    entityFamily: "business-asset"
  },
  voice: {
    workspace: "voice",
    category: "voice-systems",
    module: "Voice",
    core: "audio-runtime",
    capabilityFamilies: ["classify", "route", "translate", "summarize", "execute"],
    policyZone: "voice-sensitive",
    entityFamily: "audio-asset"
  },
  security: {
    workspace: "execution",
    category: "security-systems",
    module: "Shield",
    core: "security-intelligence",
    capabilityFamilies: ["review", "risk-check", "prioritize", "block", "audit"],
    policyZone: "security-governed",
    entityFamily: "security-asset"
  },
  knowledge: {
    workspace: "knowledge",
    category: "knowledge-systems",
    module: "Mind",
    core: "knowledge-graph",
    capabilityFamilies: ["retrieve", "map", "summarize", "compare", "store"],
    policyZone: "knowledge-governed",
    entityFamily: "knowledge-asset"
  },
  general: {
    workspace: "research",
    category: "general-systems",
    module: "Core",
    core: "general-intelligence",
    capabilityFamilies: ["classify", "map", "suggest", "store"],
    policyZone: "general-safe",
    entityFamily: "generic-asset"
  }
};

const TYPE_OVERRIDES: Partial<Record<ClassificationResult["type"], Partial<RegistryMapping>>> = {
  AI_TOOLS: {
    workspace: "research",
    category: "ai-tools",
    module: "Mind",
    core: "tool-intelligence",
    entityFamily: "tool-record"
  },
  LANGUAGE_MAP: {
    workspace: "mastery",
    category: "languages",
    module: "PantaLearn",
    core: "learning-intelligence",
    entityFamily: "learning-record"
  },
  ARCHITECTURE: {
    workspace: "execution",
    category: "architecture",
    module: "Core",
    core: "kernel-intelligence",
    entityFamily: "architecture-record"
  },
  WORKSPACE_STACK: {
    workspace: "research",
    category: "workspace-stacks",
    module: "Create",
    core: "workspace-intelligence",
    entityFamily: "workspace-record"
  },
  DATA_SCIENCE: {
    workspace: "knowledge",
    category: "data-science",
    module: "Mind",
    core: "data-intelligence",
    entityFamily: "data-record"
  },
  PROMPTING: {
    workspace: "mastery",
    category: "prompting",
    module: "PantaLearn",
    core: "prompt-intelligence",
    entityFamily: "prompt-record"
  },
  RAG_CAG: {
    workspace: "knowledge",
    category: "retrieval-runtime",
    module: "Mind",
    core: "knowledge-runtime",
    entityFamily: "retrieval-record"
  },
  MARKETING_STACK: {
    workspace: "business",
    category: "marketing-stack",
    module: "Compass",
    core: "growth-intelligence",
    entityFamily: "marketing-record"
  },
  VOICE_SYSTEM: {
    workspace: "voice",
    category: "audio-runtime",
    module: "Voice",
    core: "voice-runtime",
    entityFamily: "voice-record"
  },
  SECURITY_PATTERN: {
    workspace: "execution",
    category: "security-patterns",
    module: "Shield",
    core: "security-intelligence",
    entityFamily: "security-record"
  }
};

export interface RegistryResolution {
  mapping: RegistryMapping;
  reasons: string[];
  collections: string[];
}

export function resolveRegistryMapping(classification: ClassificationResult): RegistryResolution {
  const base = DOMAIN_REGISTRY[classification.domain] || DOMAIN_REGISTRY.general;
  const override = TYPE_OVERRIDES[classification.type] || {};

  const mapping: RegistryMapping = {
    domain: classification.domain,
    workspace: override.workspace || base.workspace,
    category: override.category || base.category,
    module: override.module || base.module,
    core: override.core || base.core,
    capabilityFamilies: override.capabilityFamilies || base.capabilityFamilies,
    policyZone: override.policyZone || base.policyZone,
    entityFamily: override.entityFamily || base.entityFamily
  };

  const reasons = [
    `domain ${classification.domain} mapped to workspace ${mapping.workspace}`,
    `type ${classification.type} mapped to category ${mapping.category}`,
    `module resolved as ${mapping.module}`,
    `policy zone resolved as ${mapping.policyZone}`
  ];

  const collections = [
    `workspace:${mapping.workspace}`,
    `category:${mapping.category}`,
    `module:${mapping.module}`,
    `core:${mapping.core}`,
    `policy:${mapping.policyZone}`,
    `entity:${mapping.entityFamily}`
  ];

  return { mapping, reasons, collections };
}
