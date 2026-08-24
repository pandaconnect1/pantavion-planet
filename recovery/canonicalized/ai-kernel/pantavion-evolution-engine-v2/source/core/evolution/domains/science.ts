import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const scienceDomain: PantavionDomainRegistry = {
  id: "science",
  name: "Science",
  continents: pantavionContinents,
  purpose: "Research, source atlas, scientific knowledge, public data, citations and reliability ranking.",
  watchTargets: ["research papers", "public datasets", "libraries", "source reliability", "open science"],
  capabilityTargets: ["PantaResearch Library", "source reliability tiers", "citation engine"],
  legalRules: pantavionBaseLegalRules,
  founderApprovalRequiredFor: ["research claims", "licensed data ingestion", "scientific authority claims"],
};
