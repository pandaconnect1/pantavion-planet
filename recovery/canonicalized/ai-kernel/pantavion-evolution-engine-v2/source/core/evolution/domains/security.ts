import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const securityDomain: PantavionDomainRegistry = {
  id: "security",
  name: "Security",
  continents: pantavionContinents,
  purpose: "Identity, access control, threat detection, audit, recovery, privacy and infrastructure protection.",
  watchTargets: ["identity", "permissions", "audit", "encryption", "secrets", "threat detection", "recovery"],
  capabilityTargets: ["founder approval gate", "access control", "guardian audits", "rollback safety"],
  legalRules: pantavionBaseLegalRules,
  founderApprovalRequiredFor: ["access changes", "security policy changes", "admin privilege changes"],
};
