import {
  PANTAVION_COMMON_SERVICE_IDS,
  type PantavionCommonServiceId
} from "@/core/kernel/common/pantavion-common-services";
import {
  PANTAVION_UNIVERSAL_LIFE_CAPABILITIES,
  type PantavionUniversalLifeCapability
} from "@/core/product/pantavion-universal-life-capabilities";
import type {
  PantavionAutonomyLevel,
  PantavionBenchmarkRegion,
  PantavionKernelHealthScore,
  PantavionKernelManifest,
  PantavionKernelMode,
  PantavionKernelPermissions,
  PantavionKernelRealnessGate,
  PantavionKernelRisk,
  PantavionKernelScope,
  PantavionKernelWorkOrder,
  PantavionMasterKernelSystemReport,
  PantavionMissingCapabilityRequest
} from "./autonomous-kernel-types";

const criticalCapabilityIds = new Set([
  "water-infrastructure",
  "sos",
  "sos-interpreter",
  "support-care",
  "health",
  "economy-banks",
  "politics",
  "dates-connections",
  "ai-sovereignty",
  "panta-ai"
]);

const protectedPaths = [
  ".env",
  ".env.local",
  "next.config.mjs",
  "data/water-network-private",
  "data/private",
  "data/founder",
  "core/security",
  "core/identity",
  "core/auth",
  "core/kernel/master",
  "app/api/admin",
  "app/api/auth"
];

const benchmarkRegions: PantavionBenchmarkRegion[] = [
  "global",
  "china",
  "usa",
  "europe",
  "japan",
  "korea",
  "russia",
  "india",
  "southeast_asia",
  "africa",
  "latin_america",
  "oceania"
];

function safeSlug(value: string) {
  return value
    .replace(/^\//, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function riskFor(capability: PantavionUniversalLifeCapability): PantavionKernelRisk {
  if (criticalCapabilityIds.has(capability.id)) return "critical";
  if (capability.status === "legal_provider_required") return "critical";
  if (capability.status === "beta") return "high";
  if (capability.status === "foundation") return "medium";
  return "low";
}

function modeFor(capability: PantavionUniversalLifeCapability): PantavionKernelMode {
  if (criticalCapabilityIds.has(capability.id)) return "founder_approval_required";
  if (capability.status === "legal_provider_required") return "founder_approval_required";
  if (capability.status === "planned") return "draft_only";
  return "isolated_autonomous";
}

function autonomyFor(capability: PantavionUniversalLifeCapability): PantavionAutonomyLevel {
  if (criticalCapabilityIds.has(capability.id)) return 3;
  if (capability.status === "legal_provider_required") return 2;
  if (capability.status === "planned") return 2;
  if (capability.status === "foundation") return 4;
  if (capability.status === "beta") return 4;
  return 5;
}

function scopeFor(capability: PantavionUniversalLifeCapability): PantavionKernelScope {
  const routeSlug = safeSlug(capability.route || capability.id);
  const capabilitySlug = safeSlug(capability.id);

  const allowedPaths = [
    `app/${routeSlug}`,
    `components/${capabilitySlug}`,
    `core/${capabilitySlug}`,
    `tests/${capabilitySlug}`,
    `docs/capabilities/${capabilitySlug}`
  ];

  if (capability.id === "water-infrastructure") {
    allowedPaths.splice(
      0,
      allowedPaths.length,
      "app/professional/infrastructure/water",
      "components/professional/infrastructure/water",
      "core/infrastructure/water",
      "docs/capabilities/water-infrastructure"
    );
  }

  if (capability.id === "sos" || capability.id === "support-care" || capability.id === "sos-interpreter") {
    allowedPaths.splice(
      0,
      allowedPaths.length,
      "app/sos",
      "app/sos-interpreter",
      "components/sos",
      "core/sos",
      "docs/capabilities/sos"
    );
  }

  return {
    allowedPaths,
    readOnlySharedPaths: [
      "core/product",
      "core/kernel/common",
      "core/kernel/autonomous-build"
    ],
    forbiddenPaths: protectedPaths,
    criticalPaths: criticalCapabilityIds.has(capability.id) ? allowedPaths : []
  };
}

function permissionsFor(
  capability: PantavionUniversalLifeCapability,
  mode: PantavionKernelMode,
  risk: PantavionKernelRisk
): PantavionKernelPermissions {
  const critical = risk === "critical";

  return {
    canDiscover: true,
    canPlan: true,
    canDraftCode: true,
    canWriteOwnScope: mode === "isolated_autonomous" || mode === "founder_approval_required",
    canRunTests: true,
    canDiagnoseErrors: true,
    canRepairOwnScope: mode === "isolated_autonomous" || mode === "founder_approval_required",
    canPrepareCommit: mode === "isolated_autonomous" && !critical,
    canPushWithoutFounder: mode === "isolated_autonomous" && !critical,
    canDeployWithoutFounder: false,
    requiresFounderApprovalForProduction:
      critical ||
      mode !== "isolated_autonomous" ||
      capability.status === "legal_provider_required"
  };
}

function realnessGateFor(capability: PantavionUniversalLifeCapability): PantavionKernelRealnessGate {
  const hasRoute = Boolean(capability.route);

  return {
    hasRealRoute: hasRoute,
    hasRealComponent: hasRoute,
    hasStateModel: false,
    hasDataModel: false,
    hasApiWhenNeeded: false,
    hasProviderWhenNeeded: capability.status !== "legal_provider_required",
    hasPermissionModel: false,
    hasLoadingState: false,
    hasEmptyState: false,
    hasErrorState: false,
    hasTests: false,
    passesBuild: false,
    passesTypeScript: false,
    hasNoFakeButtons: true
  };
}

function healthFor(capability: PantavionUniversalLifeCapability): PantavionKernelHealthScore {
  const base = capability.route ? 35 : 20;
  const safetyPenalty = capability.status === "legal_provider_required" ? 10 : 0;

  return {
    total: Math.max(0, base - safetyPenalty),
    build: 0,
    typeScript: 0,
    route: capability.route ? 50 : 0,
    ui: capability.route ? 35 : 10,
    data: 0,
    provider: capability.status === "legal_provider_required" ? 0 : 20,
    legal: capability.status === "legal_provider_required" ? 0 : 25,
    security: 20,
    seo: 10,
    userValue: 30,
    globalBenchmark: 10
  };
}

function requiredInfrastructureFor(capability: PantavionUniversalLifeCapability) {
  const text = capability.realImplementationRequired.toLowerCase();
  const items = [
    "kernel manifest",
    "isolated scope",
    "shared language access",
    "identity and permission model",
    "safety and legal profile",
    "realness gate",
    "health score",
    "founder report",
    "build and TypeScript checks",
    "rollback plan"
  ];

  if (text.includes("provider")) items.push("provider integration plan");
  if (text.includes("storage")) items.push("storage and retention policy");
  if (text.includes("moderation")) items.push("moderation and abuse model");
  if (text.includes("payment")) items.push("payment and compliance boundary");
  if (text.includes("legal")) items.push("legal adaptation review");

  return items;
}

export function createPantavionKernelManifest(
  capability: PantavionUniversalLifeCapability
): PantavionKernelManifest {
  const risk = riskFor(capability);
  const mode = modeFor(capability);

  return {
    kernelId: `${capability.id}-kernel`,
    title: `${capability.title} Kernel`,
    kernelClass: "section",
    capabilityId: capability.id,
    capabilityTitle: capability.title,
    domain: capability.domain,
    sourceCapabilityStatus: capability.status,
    lifecycle: capability.status === "legal_provider_required" ? "planned" : capability.status,
    mode,
    autonomyLevel: autonomyFor(capability),
    risk,
    sharedServices: PANTAVION_COMMON_SERVICE_IDS as PantavionCommonServiceId[],
    scope: scopeFor(capability),
    dependencies: [],
    permissions: permissionsFor(capability, mode, risk),
    realnessGate: realnessGateFor(capability),
    healthScore: healthFor(capability),
    benchmarkRegions,
    legalAdaptationRules: [
      "Do not copy protected brand, code, UI, claims, ranking, logo or proprietary flow.",
      "Adapt only lawful functional patterns into Pantavion-owned architecture.",
      "Sensitive areas require founder and legal review before production."
    ],
    gapFillingTargets: [
      "Global multilingual operation.",
      "Kernel isolation.",
      "Founder-visible governance.",
      "Real implementation instead of static surfaces.",
      "Cross-region compatibility and safety."
    ],
    requiredInfrastructure: requiredInfrastructureFor(capability),
    requiredChecks: [
      "no fake buttons",
      "no dead route presented as live",
      "no protected path write",
      "npm run build",
      "npx tsc --noEmit",
      "route check when route exists",
      "Vercel deployment check",
      "founder report"
    ],
    founderReport: {
      summary: `${capability.title} must become a real Pantavion kernel under Master Kernel governance.`,
      whatExists: capability.route ? [`Route declared: ${capability.route}`] : [],
      whatIsMissing: [capability.realImplementationRequired],
      staticSurfaces: capability.status === "planned" ? [capability.title] : [],
      liveSurfaces: capability.status === "live" || capability.status === "beta" ? [capability.title] : [],
      errors: [],
      risks: capability.safetyNote ? [capability.safetyNote] : [],
      proposedRepairs: [
        "Create real route if missing.",
        "Add data/state/API/provider only when required.",
        "Promote only through realness gate."
      ],
      approvalRequired: risk === "critical"
    }
  };
}

export const PANTAVION_AUTONOMOUS_KERNEL_MANIFESTS =
  PANTAVION_UNIVERSAL_LIFE_CAPABILITIES.map(createPantavionKernelManifest);

export const PANTAVION_KERNEL_WORK_ORDERS: PantavionKernelWorkOrder[] =
  PANTAVION_UNIVERSAL_LIFE_CAPABILITIES.map((capability) => {
    const manifest = createPantavionKernelManifest(capability);

    return {
      workOrderId: `work-order-${capability.id}`,
      kernelManifest: manifest,
      capability,
      action: capability.route ? "repair" : "plan",
      buildInstructions: [
        "Inspect existing files and routes.",
        "Detect static, missing, fake or incomplete surfaces.",
        "Draft isolated implementation only inside allowed scope.",
        "Use shared common services instead of local duplicate systems.",
        "Report to Master Kernel and Founder."
      ],
      acceptanceCriteria: manifest.requiredChecks,
      founderVisible: true
    };
  });

export function createMissingCapabilityRequest(
  userNeed: string,
  proposedCapabilityTitle: string
): PantavionMissingCapabilityRequest {
  const safeTitle = safeSlug(proposedCapabilityTitle || userNeed || "missing-capability");

  return {
    requestId: `missing-${safeTitle}`,
    userNeed,
    requestedBy: "user",
    matchedExistingCapabilityIds: [],
    proposedCapabilityTitle,
    proposedKernelId: `${safeTitle}-kernel`,
    requiredSharedServices: PANTAVION_COMMON_SERVICE_IDS as PantavionCommonServiceId[],
    requiredProviders: [],
    legalSafetyNotes: [
      "Must pass safety, legal, provider and realness gates before becoming live."
    ],
    founderReviewRequired: true
  };
}

export function getPantavionMasterKernelSystemReport(): PantavionMasterKernelSystemReport {
  return {
    totalKernels: PANTAVION_AUTONOMOUS_KERNEL_MANIFESTS.length,
    isolatedAutonomous: PANTAVION_AUTONOMOUS_KERNEL_MANIFESTS.filter(
      (manifest) => manifest.mode === "isolated_autonomous"
    ).length,
    founderApprovalRequired: PANTAVION_AUTONOMOUS_KERNEL_MANIFESTS.filter(
      (manifest) => manifest.permissions.requiresFounderApprovalForProduction
    ).length,
    critical: PANTAVION_AUTONOMOUS_KERNEL_MANIFESTS.filter(
      (manifest) => manifest.risk === "critical"
    ).length,
    plannedOrCandidate: PANTAVION_AUTONOMOUS_KERNEL_MANIFESTS.filter(
      (manifest) => manifest.lifecycle === "planned" || manifest.lifecycle === "candidate"
    ).length,
    betaOrLive: PANTAVION_AUTONOMOUS_KERNEL_MANIFESTS.filter(
      (manifest) => manifest.lifecycle === "beta" || manifest.lifecycle === "live"
    ).length,
    commonServices: PANTAVION_COMMON_SERVICE_IDS.length
  };
}
