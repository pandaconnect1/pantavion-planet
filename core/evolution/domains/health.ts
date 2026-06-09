import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const healthDomain: PantavionDomainRegistry = {
  id: "health",
  name: "Health",
  continents: pantavionContinents,
  purpose: "Wellness knowledge, safety triage boundaries, emergency language, care support and health-risk moderation.",
  watchTargets: ["wellness", "public health", "emergency phrases", "medical safety", "risk classification"],
  capabilityTargets: ["SOS elder mode", "health content safety", "care assistant boundaries"],
  legalRules: [...pantavionBaseLegalRules, "no_medical_diagnosis_claims"],
  founderApprovalRequiredFor: ["health claims", "medical-risk workflows", "vulnerable user policy"],
};
