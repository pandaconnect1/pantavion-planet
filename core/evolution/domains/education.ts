import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const educationDomain: PantavionDomainRegistry = {
  id: "education",
  name: "Education",
  continents: pantavionContinents,
  purpose: "Learning systems, academy, training, certifications, knowledge paths and learning-to-income.",
  watchTargets: ["courses", "public learning resources", "certifications", "training systems", "skills"],
  capabilityTargets: ["Pantavion Academy", "learning-to-income", "professional training"],
  legalRules: pantavionBaseLegalRules,
  founderApprovalRequiredFor: ["certification claims", "paid education products", "minors policy changes"],
};
