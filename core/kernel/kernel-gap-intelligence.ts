export type PantavionGapIntelligenceStatus =
  | "observing"
  | "classifying"
  | "repair-required"
  | "advantage-ready";

export type PantavionGapSource =
  | "pantavion-internal"
  | "user-need"
  | "market-benchmark"
  | "research-center"
  | "provider"
  | "six-continent-signal";

export type PantavionAdvantageFamily =
  | "kernel"
  | "ai-agents"
  | "social-communication"
  | "maps-dwg-infrastructure"
  | "sos-offline-safety"
  | "work-services-income"
  | "education-knowledge"
  | "health-wellness-safety"
  | "media-entertainment"
  | "payments-commerce"
  | "developer-builder-platform"
  | "security-trust-governance"
  | "performance-memory";

export interface PantavionGapIntelligenceReport {
  ok: boolean;
  marker: "pantavion_gap_intelligence_v1";
  status: PantavionGapIntelligenceStatus;
  generatedAt: string;
  doctrine: {
    competitorAdvantagesBecomeBaseline: true;
    competitorGapsBecomePantavionOpportunities: true;
    pantavionGapsMustCloseContinuously: true;
    fakeCompletionAllowed: false;
    lawfulAssimilationOnly: true;
    pantavionOwnedSystemsRequired: true;
  };
  operatingLoop: [
    "observe",
    "compare",
    "detect-gap",
    "classify-risk",
    "design-pantavion-owned-solution",
    "legal-safety-check",
    "performance-check",
    "founder-approval-if-risk",
    "build",
    "audit",
    "deploy",
    "monitor"
  ];
  coverage: {
    sourceClasses: PantavionGapSource[];
    advantageFamilies: PantavionAdvantageFamily[];
    sixContinentCoverageRequired: true;
    userNeedCoverageRequired: true;
    unknownNeedBecomesCapabilityRequest: true;
  };
  gapPolicy: {
    noDeadButtons: true;
    noStaticClaims: true;
    noUnverifiedDwgClaims: true;
    noRawPrivateSourceExposure: true;
    noUnsafeAutomaticMutation: true;
    everyVisibleCapabilityNeedsRouteApiOrDisabledState: true;
  };
  performancePolicy: {
    lightweightByDefault: true;
    heavyResearchRunsInQueue: true;
    browserReceivesSummariesNotRawArchives: true;
    memoryUsesTieredRetrieval: true;
    largeSourcesStayInPrivateVault: true;
  };
  nextBuildTargets: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createPantavionGapIntelligenceReport(): PantavionGapIntelligenceReport {
  return {
    ok: true,
    marker: "pantavion_gap_intelligence_v1",
    status: "observing",
    generatedAt: nowIso(),
    doctrine: {
      competitorAdvantagesBecomeBaseline: true,
      competitorGapsBecomePantavionOpportunities: true,
      pantavionGapsMustCloseContinuously: true,
      fakeCompletionAllowed: false,
      lawfulAssimilationOnly: true,
      pantavionOwnedSystemsRequired: true,
    },
    operatingLoop: [
      "observe",
      "compare",
      "detect-gap",
      "classify-risk",
      "design-pantavion-owned-solution",
      "legal-safety-check",
      "performance-check",
      "founder-approval-if-risk",
      "build",
      "audit",
      "deploy",
      "monitor",
    ],
    coverage: {
      sourceClasses: [
        "pantavion-internal",
        "user-need",
        "market-benchmark",
        "research-center",
        "provider",
        "six-continent-signal",
      ],
      advantageFamilies: [
        "kernel",
        "ai-agents",
        "social-communication",
        "maps-dwg-infrastructure",
        "sos-offline-safety",
        "work-services-income",
        "education-knowledge",
        "health-wellness-safety",
        "media-entertainment",
        "payments-commerce",
        "developer-builder-platform",
        "security-trust-governance",
        "performance-memory",
      ],
      sixContinentCoverageRequired: true,
      userNeedCoverageRequired: true,
      unknownNeedBecomesCapabilityRequest: true,
    },
    gapPolicy: {
      noDeadButtons: true,
      noStaticClaims: true,
      noUnverifiedDwgClaims: true,
      noRawPrivateSourceExposure: true,
      noUnsafeAutomaticMutation: true,
      everyVisibleCapabilityNeedsRouteApiOrDisabledState: true,
    },
    performancePolicy: {
      lightweightByDefault: true,
      heavyResearchRunsInQueue: true,
      browserReceivesSummariesNotRawArchives: true,
      memoryUsesTieredRetrieval: true,
      largeSourcesStayInPrivateVault: true,
    },
    nextBuildTargets: [
      "live-kernel-panel",
      "water-health-kernel",
      "dwg-source-proof",
      "gap-detection-audit",
      "research-atlas-scheduler",
      "innovation-queue",
      "repair-queue",
      "performance-guard",
    ],
  };
}
