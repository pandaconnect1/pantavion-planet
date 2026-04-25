import { primeKernelLaw } from "./prime-kernel-law";
import { pantavionMasterArchitectureBaseline } from "./master-architecture-baseline";
import { pantavionAccessModel } from "./pantavion-access-model";
import { pantavionCompetitiveIntelligenceLayer } from "./competitive-intelligence-layer";
import { pantavionAiFeatureRegister } from "./ai-feature-register";
import { pantavionSosInterpreter } from "./sos-interpreter";
import { masterEcosystemDoctrine } from "./master-ecosystem-doctrine";
import { capabilityRegistry } from "./capability-registry";
import { routeRegistry } from "./route-registry";
import { riskRegistry } from "./risk-registry";
import { importWorldLegalMatrix } from "./import-world-legal-matrix";
import { translationConfidenceModel } from "./translation-confidence-model";
import { marketplaceTaxonomy } from "./marketplace-taxonomy";
import { mediaRadioRightsPolicy } from "./media-radio-rights-policy";
import { adultRestrictedPolicy } from "./adult-restricted-policy";
import { eliteSecureChannelsPolicy } from "./elite-secure-channels-policy";
import { noDeadButtonPolicy } from "./no-dead-button-policy";
import { releaseGatesBeforeStripe } from "./release-gates-before-stripe";
import { customDomainChecklist } from "./custom-domain-checklist";
import { productionSeoMetadata } from "./production-seo-metadata";
import { abuseReportingFlows } from "./abuse-reporting-flows";
import { minorsProtectionArchitecture } from "./minors-protection-architecture";
import { securityHackerApiChecklist } from "./security-hacker-api-checklist";

export const kernelGapRegistry = [
  primeKernelLaw,
  pantavionMasterArchitectureBaseline,
  pantavionAccessModel,
  pantavionCompetitiveIntelligenceLayer,
  pantavionAiFeatureRegister,
  pantavionSosInterpreter,
  masterEcosystemDoctrine,
  capabilityRegistry,
  routeRegistry,
  riskRegistry,
  importWorldLegalMatrix,
  translationConfidenceModel,
  marketplaceTaxonomy,
  mediaRadioRightsPolicy,
  adultRestrictedPolicy,
  eliteSecureChannelsPolicy,
  noDeadButtonPolicy,
  releaseGatesBeforeStripe,
  customDomainChecklist,
  productionSeoMetadata,
  abuseReportingFlows,
  minorsProtectionArchitecture,
  securityHackerApiChecklist
] as const;

export const kernelGapSummary = {
  total: kernelGapRegistry.length,
  status: "master-architecture-ai-sos-foundation-lock",
  nextRequiredAction:
    "Master Architecture, AI Feature Register and SOS+Interpreter are locked. Continue with visual unification, legal expansion, Stripe-safe products, no-dead-button audit and custom domain readiness."
} as const;
