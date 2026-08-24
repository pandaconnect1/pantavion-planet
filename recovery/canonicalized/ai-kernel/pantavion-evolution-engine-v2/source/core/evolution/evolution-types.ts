export const pantavionContinents = [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
] as const;

export type PantavionContinent = typeof pantavionContinents[number];

export type PantavionDomainRegistry = {
  id: string;
  name: string;
  continents: readonly PantavionContinent[];
  purpose: string;
  watchTargets: readonly string[];
  capabilityTargets: readonly string[];
  legalRules: readonly string[];
  founderApprovalRequiredFor: readonly string[];
};

export const pantavionBaseLegalRules = [
  "lawful_public_research_only",
  "pantavion_owned_original_adaptation_only",
  "no_proprietary_copying",
  "no_unauthorized_access",
  "no_blind_production_mutation",
  "founder_control_for_critical_actions",
] as const;
