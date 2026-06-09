import { pantavionContinents, pantavionBaseLegalRules, type PantavionDomainRegistry } from "../evolution-types";

export const commerceDomain: PantavionDomainRegistry = {
  id: "commerce",
  name: "Commerce",
  continents: pantavionContinents,
  purpose: "Marketplace, services, payments, pricing, invoices, business systems and lawful monetization.",
  watchTargets: ["marketplaces", "payments", "subscriptions", "invoicing", "services", "classifieds"],
  capabilityTargets: ["Pantavion Marketplace", "services income", "pricing control", "merchant compliance"],
  legalRules: [...pantavionBaseLegalRules, "no_unlicensed_financial_claims"],
  founderApprovalRequiredFor: ["payments", "pricing", "merchant provider", "financial-risk features"],
};
