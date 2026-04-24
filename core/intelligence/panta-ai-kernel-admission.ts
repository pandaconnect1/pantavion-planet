// core/intelligence/panta-ai-kernel-admission.ts

import {
  getPantaAICapabilityFamily,
  getPantaAICapabilityIndex,
  getPantaAIPublicCapabilityFamilies,
  type PantaAICapabilityAccess,
  type PantaAICapabilityArea,
  type PantaAICapabilityFamily,
  type PantaAICapabilityTruthMode,
  type PantaAILegalUseMode,
} from "./panta-ai-capability-index";

export type PantaAIAdmissionDisposition =
  | "public-ready"
  | "signed-in-ready"
  | "verified-required"
  | "restricted-review"
  | "admin-only";

export type PantaAIKernelLane =
  | "assistant"
  | "research"
  | "builder"
  | "creator"
  | "memory"
  | "automation"
  | "learning"
  | "business"
  | "data"
  | "security"
  | "voice"
  | "provider-awareness";

export type PantaAIExecutionMode =
  | "answer"
  | "analyze"
  | "build"
  | "create"
  | "route"
  | "automate"
  | "review";

export interface PantaAIKernelAdmissionDecision {
  disposition: PantaAIAdmissionDisposition;
  allowedOnPublicSurface: boolean;
  requiresSignIn: boolean;
  requiresVerification: boolean;
  requiresAdminReview: boolean;
  requiresRestrictedReview: boolean;
  reason: string;
}

export interface PantaAIKernelRoutingPlan {
  kernelLane: PantaAIKernelLane;
  executionMode: PantaAIExecutionMode;
  defaultRoute: string;
  intakeRoute: string;
  detailRoute: string;
  apiRoute: string;
  suggestedNextAction: string;
}

export interface PantaAIKernelAdmissionPacket {
  capabilityKey: string;
  title: string;
  publicName: string;
  area: PantaAICapabilityArea;
  access: PantaAICapabilityAccess;
  truthMode: PantaAICapabilityTruthMode;
  publicSurface: PantaAICapabilityFamily["publicSurface"];
  internalKernelFamilies: string[];
  legalUseModes: PantaAILegalUseMode[];
  referenceEcosystems: string[];
  admission: PantaAIKernelAdmissionDecision;
  routing: PantaAIKernelRoutingPlan;
  legalBoundaries: string[];
  safetyBoundaries: string[];
  userCanAsk: string[];
  pantavionDoes: string[];
  expectedResults: string[];
}

export interface PantaAIKernelAdmissionSummary {
  generatedAt: string;
  packetCount: number;
  publicReadyCount: number;
  signedInReadyCount: number;
  verifiedRequiredCount: number;
  restrictedReviewCount: number;
  adminOnlyCount: number;
  kernelLanes: PantaAIKernelLane[];
  executionModes: PantaAIExecutionMode[];
}

export function createPantaAIKernelAdmissionPacket(
  input: string | PantaAICapabilityFamily
): PantaAIKernelAdmissionPacket | null {
  const family =
    typeof input === "string" ? getPantaAICapabilityFamily(input) : input;

  if (!family) {
    return null;
  }

  const admission = decideAdmission(family);
  const routing = buildRoutingPlan(family);

  return {
    capabilityKey: family.key,
    title: family.title,
    publicName: family.publicName,
    area: family.area,
    access: family.access,
    truthMode: family.truthMode,
    publicSurface: family.publicSurface,
    internalKernelFamilies: [...family.internalKernelFamilies],
    legalUseModes: unique(family.referenceEcosystems.map((item) => item.legalUseMode)),
    referenceEcosystems: unique(family.referenceEcosystems.map((item) => item.name)),
    admission,
    routing,
    legalBoundaries: [...family.legalBoundaries],
    safetyBoundaries: [...family.safetyBoundaries],
    userCanAsk: [...family.userCanAsk],
    pantavionDoes: [...family.pantavionDoes],
    expectedResults: [...family.expectedResults],
  };
}

export function getPantaAIKernelAdmissionPackets(
  includeInternal = false
): PantaAIKernelAdmissionPacket[] {
  const source = includeInternal
    ? getPantaAICapabilityIndex()
    : getPantaAIPublicCapabilityFamilies();

  return source
    .map((family) => createPantaAIKernelAdmissionPacket(family))
    .filter((packet): packet is PantaAIKernelAdmissionPacket => Boolean(packet));
}

export function getPantaAIKernelAdmissionPacket(
  capabilityKey: string
): PantaAIKernelAdmissionPacket | null {
  return createPantaAIKernelAdmissionPacket(capabilityKey);
}

export function getPantaAIKernelAdmissionSummary(): PantaAIKernelAdmissionSummary {
  const packets = getPantaAIKernelAdmissionPackets(true);

  return {
    generatedAt: new Date().toISOString(),
    packetCount: packets.length,
    publicReadyCount: packets.filter((item) => item.admission.disposition === "public-ready").length,
    signedInReadyCount: packets.filter((item) => item.admission.disposition === "signed-in-ready").length,
    verifiedRequiredCount: packets.filter((item) => item.admission.disposition === "verified-required").length,
    restrictedReviewCount: packets.filter((item) => item.admission.disposition === "restricted-review").length,
    adminOnlyCount: packets.filter((item) => item.admission.disposition === "admin-only").length,
    kernelLanes: unique(packets.map((item) => item.routing.kernelLane)).sort(),
    executionModes: unique(packets.map((item) => item.routing.executionMode)).sort(),
  };
}

function decideAdmission(
  family: PantaAICapabilityFamily
): PantaAIKernelAdmissionDecision {
  if (family.access === "admin-only") {
    return {
      disposition: "admin-only",
      allowedOnPublicSurface: false,
      requiresSignIn: true,
      requiresVerification: true,
      requiresAdminReview: true,
      requiresRestrictedReview: true,
      reason:
        "This capability is provider-aware or governance-sensitive and stays inside the Prime Kernel / admin layer.",
    };
  }

  if (family.access === "restricted") {
    return {
      disposition: "restricted-review",
      allowedOnPublicSurface: family.publicSurface !== "internal-only",
      requiresSignIn: true,
      requiresVerification: true,
      requiresAdminReview: true,
      requiresRestrictedReview: true,
      reason:
        "This capability can be explained publicly but execution requires restricted, defensive or reviewed routing.",
    };
  }

  if (family.access === "verified") {
    return {
      disposition: "verified-required",
      allowedOnPublicSurface: true,
      requiresSignIn: true,
      requiresVerification: true,
      requiresAdminReview: false,
      requiresRestrictedReview: false,
      reason:
        "This capability can be used after identity, account or permission verification.",
    };
  }

  if (family.access === "signed-in") {
    return {
      disposition: "signed-in-ready",
      allowedOnPublicSurface: true,
      requiresSignIn: true,
      requiresVerification: false,
      requiresAdminReview: false,
      requiresRestrictedReview: false,
      reason:
        "This capability is visible publicly but works best after sign-in so Pantavion can preserve context and continuity.",
    };
  }

  return {
    disposition: "public-ready",
    allowedOnPublicSurface: true,
    requiresSignIn: false,
    requiresVerification: false,
    requiresAdminReview: false,
    requiresRestrictedReview: false,
    reason:
      "This capability can be shown publicly as a clear Pantavion surface with safe intake boundaries.",
  };
}

function buildRoutingPlan(family: PantaAICapabilityFamily): PantaAIKernelRoutingPlan {
  const kernelLane = laneForArea(family.area);
  const executionMode = executionModeForFamily(family);
  const detailRoute = `/intelligence/capabilities/${family.key}`;

  return {
    kernelLane,
    executionMode,
    defaultRoute: family.defaultRoute,
    intakeRoute: `/intelligence/routing?capability=${encodeURIComponent(family.key)}`,
    detailRoute,
    apiRoute: `/api/intelligence/capabilities?capability=${encodeURIComponent(family.key)}`,
    suggestedNextAction: suggestedActionFor(family, kernelLane, executionMode),
  };
}

function laneForArea(area: PantaAICapabilityArea): PantaAIKernelLane {
  switch (area) {
    case "conversation":
      return "assistant";
    case "research":
    case "browser-search":
      return "research";
    case "coding":
    case "app-building":
      return "builder";
    case "design":
    case "image":
    case "video":
    case "audio":
    case "writing":
    case "presentation":
      return "creator";
    case "notes-memory":
      return "memory";
    case "automation":
      return "automation";
    case "learning":
      return "learning";
    case "business":
    case "finance":
      return "business";
    case "data":
      return "data";
    case "security-defense":
      return "security";
    case "voice-translation":
      return "voice";
    case "identity-governance":
      return "provider-awareness";
    case "health-knowledge":
    case "productivity":
      return "assistant";
    default:
      return "assistant";
  }
}

function executionModeForFamily(
  family: PantaAICapabilityFamily
): PantaAIExecutionMode {
  if (family.access === "restricted" || family.access === "admin-only") {
    return "review";
  }

  switch (family.area) {
    case "research":
    case "data":
    case "browser-search":
    case "finance":
    case "health-knowledge":
      return "analyze";
    case "coding":
    case "app-building":
      return "build";
    case "design":
    case "image":
    case "video":
    case "audio":
    case "writing":
    case "presentation":
      return "create";
    case "automation":
      return "automate";
    case "voice-translation":
      return "route";
    default:
      return "answer";
  }
}

function suggestedActionFor(
  family: PantaAICapabilityFamily,
  lane: PantaAIKernelLane,
  mode: PantaAIExecutionMode
): string {
  if (family.access === "admin-only") {
    return "Keep this capability inside internal provider-awareness and governance routing.";
  }

  if (family.access === "restricted") {
    return "Show the user what it can do, but route execution through restricted review and audit.";
  }

  return `Open ${family.publicName} through the ${lane} lane and start a ${mode} intake.`;
}

function unique<T extends string>(items: T[]): T[] {
  return Array.from(new Set(items));
}
