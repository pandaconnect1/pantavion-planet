import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const infrastructureDomain: PantavionDomainRegistry = {
  id: "infrastructure",
  name: "Infrastructure",
  continents: pantavionContinents,
  purpose: "Water, energy, networks, public systems, protected infrastructure intelligence and field operations.",
  watchTargets: ["water", "energy", "transport", "field operations", "sensor networks", "asset management"],
  capabilityTargets: ["Pantavion Water", "infrastructure map engine", "field assistant", "source vault"],
  legalRules: pantavionBaseLegalRules,
  founderApprovalRequiredFor: ["infrastructure data exposure", "field access", "critical asset changes"],
};
