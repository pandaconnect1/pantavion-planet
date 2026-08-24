import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const cloudDomain: PantavionDomainRegistry = {
  id: "cloud",
  name: "Cloud",
  continents: pantavionContinents,
  purpose: "Runtime, deployment, queues, workers, storage, edge execution and observability.",
  watchTargets: ["Vercel", "Cloudflare", "AWS", "Azure", "GCP", "workers", "queues", "storage"],
  capabilityTargets: ["cloud agent", "runtime scheduler", "deployment verification", "cost control"],
  legalRules: pantavionBaseLegalRules,
  founderApprovalRequiredFor: ["deploy", "secrets", "billing", "provider migration"],
};
