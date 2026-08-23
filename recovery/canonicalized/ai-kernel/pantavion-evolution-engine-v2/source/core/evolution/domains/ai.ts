import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const aiDomain: PantavionDomainRegistry = {
  id: "ai",
  name: "AI",
  continents: pantavionContinents,
  purpose: "Model routing, agents, orchestration, reasoning, multimodal execution and safe automation.",
  watchTargets: ["models", "agents", "multimodal", "automation", "evaluation", "memory"],
  capabilityTargets: ["PantaAI Center", "agent workforce", "provider router", "knowledge graph"],
  legalRules: pantavionBaseLegalRules,
  founderApprovalRequiredFor: ["autonomous production execution", "sensitive user decisions", "provider cost changes"],
};
