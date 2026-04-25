import { primeKernelLaw } from "./prime-kernel-law";
import { pantavionMasterArchitectureBaseline } from "./master-architecture-baseline";
import { productFamilyTaxonomy } from "./product-family-taxonomy";
import { routeStatusRegistry } from "./route-status-registry";
import { productionReadinessGates } from "./production-readiness-gates";
import { deepAuditLedger } from "./deep-audit-ledger";
import { globalJurisdictionMatrix } from "./global-jurisdiction-matrix";
import { noDeadSurfacePolicy } from "./no-dead-surface-policy";
import { securityControlLedger } from "./security-control-ledger";
import { translationSafetyLedger } from "./translation-safety-ledger";
import { importWorldConsentMatrix } from "./import-world-consent-matrix";
import { realBackendClaimsRegistry } from "./real-backend-claims-registry";
import { aiSovereigntyRoadmap } from "./ai-sovereignty-roadmap";
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
  productFamilyTaxonomy,
  routeStatusRegistry,
  productionReadinessGates,
  deepAuditLedger,
  globalJurisdictionMatrix,
  noDeadSurfacePolicy,
  securityControlLedger,
  translationSafetyLedger,
  importWorldConsentMatrix,
  realBackendClaimsRegistry,
  aiSovereigntyRoadmap,
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
  status: "deep-audit-gate-v1-lock",
  nextRequiredAction:
    "Deep Audit Gate v1 is locked. Continue with Stripe Readiness Gate, No Dead Buttons Real Navigation Audit, Legal Center Expansion and Core v2 Execution Engine."
} as const;
