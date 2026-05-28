export type PantavionKernelHeartbeatMode =
  | "online"
  | "weak-signal"
  | "offline-local"
  | "satellite-supported"
  | "emergency-network"
  | "degraded"
  | "unknown";

export type PantavionKernelHeartbeatStatus =
  | "alive"
  | "degraded"
  | "blocked";

export type PantavionKernelRuntimeEnvironment =
  | "local-dev"
  | "cloud"
  | "edge"
  | "unknown";

export type PantavionResearchContinent =
  | "africa"
  | "antarctica"
  | "asia"
  | "europe"
  | "north-america"
  | "oceania"
  | "south-america";

export type PantavionBenchmarkFamily =
  | "ai-agents"
  | "app-ecosystems"
  | "developer-platforms"
  | "social-communication"
  | "maps-location"
  | "payments-commerce"
  | "work-productivity"
  | "education-knowledge"
  | "health-safety"
  | "media-entertainment"
  | "infrastructure-cloud"
  | "offline-emergency"
  | "security-trust-governance"
  | "device-operating-systems";

export interface PantavionKernelHeartbeatInput {
  source?: "api" | "runtime" | "audit" | "unknown";
  mode?: PantavionKernelHeartbeatMode;
  checkedAt?: string;
  runtime?: {
    host?: string | null;
    vercel?: boolean;
    region?: string | null;
    deploymentEnv?: string | null;
    nodeEnv?: string | null;
    reserveKernelCount?: number;
  };
}

export interface PantavionKernelHeartbeatReport {
  ok: boolean;
  marker: "pantavion_kernel_heartbeat_v3";
  kernel: {
    name: "Pantavion Guardian Kernel";
    status: PantavionKernelHeartbeatStatus;
    mode: PantavionKernelHeartbeatMode;
    source: string;
    checkedAt: string;
    founderPcRequired: false;
    userBlocking: false;
    loadProfile: "lightweight";
    runtimeEnvironment: PantavionKernelRuntimeEnvironment;
    host: string;
    region: string;
  };
  topology: {
    centralKernel: {
      enabled: true;
      role: "primary-orchestrator";
      duty: "observe-compare-diagnose-propose-guard";
    };
    reserveKernels: {
      configuredCount: number;
      minimumRequiredForProduction: 2;
      status: "configuration-required" | "ready";
      duty: "failover-recovery-continuity";
    };
    failover: {
      enabledByContract: true;
      automaticUnsafeMutationAllowed: false;
      founderApprovalRequiredForRisk: true;
      transferIfPrimaryFails: "prepared-contract";
      productionDistributedRuntimeRequired: true;
    };
  };
  signalAwareness: {
    founderPcOfflineDoesNotStopPlatform: true;
    cloudRuntimeRequired: true;
    userDeviceOfflineMode: "local-survival";
    weakSignalQueue: "prepared-contract";
    satelliteSupportedChannel: "provider-and-device-required";
    falseSatelliteGuarantee: false;
    recoverySync: "prepared-contract";
    supportedModes: PantavionKernelHeartbeatMode[];
  };
  sosReadiness: {
    offlineIdentityPackRequired: true;
    localQrNfcDisplayRequired: true;
    sirenFlashHapticRequired: true;
    emergencyCircleRequired: true;
    automaticAuthorityDispatchWithoutContract: false;
    certifiedProviderRequiredForSatelliteSos: true;
    localEventQueueRequired: true;
  };
  memoryPolicy: {
    strategy: "tiered-retrieval";
    hotMemory: "minimal-current-context";
    warmMemory: "recent-kernel-project-state";
    coldMemory: "audits-logs-history";
    deepArchive: "large-private-sources-and-evidence";
    fullSourceLoadInBrowserAllowed: false;
    unlimitedRawRamLoadAllowed: false;
    lightweightFastRetrievalRequired: true;
    summarizeCompressIndexRequired: true;
  };
  globalResearchAtlas: {
    enabledByDoctrine: true;
    sixContinentCoverageRequired: true;
    continents: PantavionResearchContinent[];
    priorityRegions: string[];
    benchmarkFamilies: PantavionBenchmarkFamily[];
    sourceClasses: string[];
    legalAssimilationRule: {
      copyBrandUiCodeClaimsAllowed: false;
      pantavionOwnedAdaptationRequired: true;
      trademarkRespectRequired: true;
      licensingReviewRequired: true;
      privacyAndSafetyReviewRequired: true;
      founderApprovalRequiredForRisk: true;
    };
    rankingGoal: {
      target: "top-three-user-preference";
      method: "better-integrated-lawful-authentic-pantavion-owned-systems";
      fakeClaimsAllowed: false;
    };
    liveResearchRuntime: {
      continuousResearchRequired: true;
      liveWebResearchRequiresProvider: true;
      offlineResearchUsesCachedAtlas: true;
      updateQueueRequired: true;
      humanFounderApprovalForHighRiskAdoption: true;
    };
  };
  technologyAbsorption: {
    enabledByDoctrine: true;
    automaticUnsafeAdoptionAllowed: false;
    sources: [
      "market-tools",
      "research-centers",
      "universities",
      "open-standards",
      "providers",
      "six-continent-local-needs",
      "global-platform-benchmarks"
    ];
    process: [
      "discover",
      "classify",
      "legal-risk-check",
      "performance-check",
      "privacy-safety-check",
      "founder-approval-if-risk",
      "build-or-integrate",
      "audit",
      "deploy"
    ];
  };
  boundaries: {
    mutatesProduction: false;
    mutatesUsers: false;
    mutatesAccessRecords: false;
    mutatesWaterMaster: false;
    exposesRawDwg: false;
    founderApprovalRequiredForRisk: true;
  };
  checks: {
    heartbeatRuntime: "ok";
    emergencyGuardianGate: "registered";
    typescriptGate: "available";
    buildGate: "available";
    multiCoreContract: "registered";
    signalAwarenessContract: "registered";
    memoryPolicyContract: "registered";
    globalResearchAtlasContract: "registered";
    legalAssimilationContract: "registered";
  };
  nextRequiredKernelLayers: string[];
}

const RESEARCH_CONTINENTS: PantavionResearchContinent[] = [
  "africa",
  "antarctica",
  "asia",
  "europe",
  "north-america",
  "oceania",
  "south-america",
];

const BENCHMARK_FAMILIES: PantavionBenchmarkFamily[] = [
  "ai-agents",
  "app-ecosystems",
  "developer-platforms",
  "social-communication",
  "maps-location",
  "payments-commerce",
  "work-productivity",
  "education-knowledge",
  "health-safety",
  "media-entertainment",
  "infrastructure-cloud",
  "offline-emergency",
  "security-trust-governance",
  "device-operating-systems",
];

function nowIso(): string {
  return new Date().toISOString();
}

function resolveRuntimeEnvironment(input: PantavionKernelHeartbeatInput): PantavionKernelRuntimeEnvironment {
  if (input.runtime?.vercel) return "cloud";
  if (input.runtime?.nodeEnv === "development") return "local-dev";
  return "unknown";
}

function resolveReserveStatus(count: number): "configuration-required" | "ready" {
  return count >= 2 ? "ready" : "configuration-required";
}

export function createPantavionKernelHeartbeat(
  input: PantavionKernelHeartbeatInput = {},
): PantavionKernelHeartbeatReport {
  const checkedAt = input.checkedAt ?? nowIso();
  const reserveKernelCount = input.runtime?.reserveKernelCount ?? 0;
  const runtimeEnvironment = resolveRuntimeEnvironment(input);

  return {
    ok: true,
    marker: "pantavion_kernel_heartbeat_v3",
    kernel: {
      name: "Pantavion Guardian Kernel",
      status: "alive",
      mode: input.mode ?? "online",
      source: input.source ?? "unknown",
      checkedAt,
      founderPcRequired: false,
      userBlocking: false,
      loadProfile: "lightweight",
      runtimeEnvironment,
      host: input.runtime?.host ?? "unknown",
      region: input.runtime?.region ?? "unknown",
    },
    topology: {
      centralKernel: {
        enabled: true,
        role: "primary-orchestrator",
        duty: "observe-compare-diagnose-propose-guard",
      },
      reserveKernels: {
        configuredCount: reserveKernelCount,
        minimumRequiredForProduction: 2,
        status: resolveReserveStatus(reserveKernelCount),
        duty: "failover-recovery-continuity",
      },
      failover: {
        enabledByContract: true,
        automaticUnsafeMutationAllowed: false,
        founderApprovalRequiredForRisk: true,
        transferIfPrimaryFails: "prepared-contract",
        productionDistributedRuntimeRequired: true,
      },
    },
    signalAwareness: {
      founderPcOfflineDoesNotStopPlatform: true,
      cloudRuntimeRequired: true,
      userDeviceOfflineMode: "local-survival",
      weakSignalQueue: "prepared-contract",
      satelliteSupportedChannel: "provider-and-device-required",
      falseSatelliteGuarantee: false,
      recoverySync: "prepared-contract",
      supportedModes: [
        "online",
        "weak-signal",
        "offline-local",
        "satellite-supported",
        "emergency-network",
        "degraded",
        "unknown",
      ],
    },
    sosReadiness: {
      offlineIdentityPackRequired: true,
      localQrNfcDisplayRequired: true,
      sirenFlashHapticRequired: true,
      emergencyCircleRequired: true,
      automaticAuthorityDispatchWithoutContract: false,
      certifiedProviderRequiredForSatelliteSos: true,
      localEventQueueRequired: true,
    },
    memoryPolicy: {
      strategy: "tiered-retrieval",
      hotMemory: "minimal-current-context",
      warmMemory: "recent-kernel-project-state",
      coldMemory: "audits-logs-history",
      deepArchive: "large-private-sources-and-evidence",
      fullSourceLoadInBrowserAllowed: false,
      unlimitedRawRamLoadAllowed: false,
      lightweightFastRetrievalRequired: true,
      summarizeCompressIndexRequired: true,
    },
    globalResearchAtlas: {
      enabledByDoctrine: true,
      sixContinentCoverageRequired: true,
      continents: RESEARCH_CONTINENTS,
      priorityRegions: [
        "United States",
        "Canada",
        "European Union",
        "United Kingdom",
        "China",
        "Japan",
        "South Korea",
        "India",
        "Africa regional markets",
        "Middle East",
        "Latin America",
        "Oceania",
      ],
      benchmarkFamilies: BENCHMARK_FAMILIES,
      sourceClasses: [
        "official-developer-platforms",
        "official-policy-and-legal-documents",
        "research-centers",
        "universities",
        "open-standards",
        "public-regulators",
        "provider-docs",
        "market-category-signals",
      ],
      legalAssimilationRule: {
        copyBrandUiCodeClaimsAllowed: false,
        pantavionOwnedAdaptationRequired: true,
        trademarkRespectRequired: true,
        licensingReviewRequired: true,
        privacyAndSafetyReviewRequired: true,
        founderApprovalRequiredForRisk: true,
      },
      rankingGoal: {
        target: "top-three-user-preference",
        method: "better-integrated-lawful-authentic-pantavion-owned-systems",
        fakeClaimsAllowed: false,
      },
      liveResearchRuntime: {
        continuousResearchRequired: true,
        liveWebResearchRequiresProvider: true,
        offlineResearchUsesCachedAtlas: true,
        updateQueueRequired: true,
        humanFounderApprovalForHighRiskAdoption: true,
      },
    },
    technologyAbsorption: {
      enabledByDoctrine: true,
      automaticUnsafeAdoptionAllowed: false,
      sources: [
        "market-tools",
        "research-centers",
        "universities",
        "open-standards",
        "providers",
        "six-continent-local-needs",
        "global-platform-benchmarks",
      ],
      process: [
        "discover",
        "classify",
        "legal-risk-check",
        "performance-check",
        "privacy-safety-check",
        "founder-approval-if-risk",
        "build-or-integrate",
        "audit",
        "deploy",
      ],
    },
    boundaries: {
      mutatesProduction: false,
      mutatesUsers: false,
      mutatesAccessRecords: false,
      mutatesWaterMaster: false,
      exposesRawDwg: false,
      founderApprovalRequiredForRisk: true,
    },
    checks: {
      heartbeatRuntime: "ok",
      emergencyGuardianGate: "registered",
      typescriptGate: "available",
      buildGate: "available",
      multiCoreContract: "registered",
      signalAwarenessContract: "registered",
      memoryPolicyContract: "registered",
      globalResearchAtlasContract: "registered",
      legalAssimilationContract: "registered",
    },
    nextRequiredKernelLayers: [
      "live-kernel-panel",
      "water-health-kernel",
      "dwg-source-bridge",
      "offline-state-foundation",
      "repair-planner",
      "upgrade-innovation-planner",
      "persistent-audit-storage",
      "distributed-reserve-kernel-runtime",
      "provider-redundancy",
      "global-research-scheduler",
      "legal-assimilation-review-engine",
    ],
  };
}
