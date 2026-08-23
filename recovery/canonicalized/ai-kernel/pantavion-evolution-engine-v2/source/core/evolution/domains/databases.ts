import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const databasesDomain: PantavionDomainRegistry = {
  id: "databases",
  name: "Databases",
  continents: pantavionContinents,
  purpose: "Persistent memory, relational data, graph intelligence, spatial data, vector search and analytics.",
  watchTargets: ["PostgreSQL", "Neo4j", "vector databases", "spatial databases", "search", "analytics"],
  capabilityTargets: ["memory store", "identity store", "source vault index", "spatial infrastructure data"],
  legalRules: pantavionBaseLegalRules,
  founderApprovalRequiredFor: ["schema migration", "data deletion", "private data access"],
};
