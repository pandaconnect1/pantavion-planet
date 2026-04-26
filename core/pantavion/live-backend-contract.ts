export const PANTAVION_LIVE_BACKEND_CONTRACT_VERSION = "1.0.0";

export type LiveReadiness =
  | "live_foundation"
  | "backend_connected"
  | "blocked_until_database"
  | "blocked_until_auth"
  | "blocked_until_legal_review";

export type LiveRouteContract = {
  id: string;
  path: string;
  method: "GET" | "POST";
  readiness: LiveReadiness;
  description: string;
  thirdPartyDependency: "none" | "optional" | "blocked";
};

export type KernelCapability = {
  id: string;
  name: string;
  ownedByPantavion: boolean;
  status:
    | "internal_foundation"
    | "internal_execution"
    | "needs_database"
    | "needs_auth"
    | "needs_legal_review";
  notes: string;
};

export type PantaiExecutionRequest = {
  input?: string;
  mode?: "plan" | "execute";
  userId?: string;
};

export type PantaiExecutionResult = {
  ok: boolean;
  engine: "pantavion-local-kernel";
  provider: "pantavion-owned";
  intent: string;
  plan: string[];
  execution: string[];
  warnings: string[];
  nextRequiredInfrastructure: string[];
};

export const liveRoutes: LiveRouteContract[] = [
  {
    id: "health",
    path: "/api/health",
    method: "GET",
    readiness: "backend_connected",
    description: "Basic live backend health check.",
    thirdPartyDependency: "none",
  },
  {
    id: "kernel-status",
    path: "/api/kernel/status",
    method: "GET",
    readiness: "backend_connected",
    description: "Pantavion Kernel status and sovereignty check.",
    thirdPartyDependency: "none",
  },
  {
    id: "pantai-execute",
    path: "/api/pantai/execute",
    method: "POST",
    readiness: "backend_connected",
    description: "Local Pantavion execution endpoint without OpenAI, Claude, Gemini, or external AI provider.",
    thirdPartyDependency: "none",
  },
  {
    id: "admission",
    path: "/api/admission",
    method: "POST",
    readiness: "blocked_until_auth",
    description: "Future account/admission gate. Currently guarded until real auth and database exist.",
    thirdPartyDependency: "none",
  },
  {
    id: "sos-dispatch",
    path: "/api/sos/dispatch",
    method: "POST",
    readiness: "blocked_until_auth",
    description: "Future SOS dispatch endpoint. Guarded until auth, emergency contacts, consent, and audit storage exist.",
    thirdPartyDependency: "none",
  },
  {
    id: "contacts-import",
    path: "/api/contacts/import",
    method: "POST",
    readiness: "blocked_until_auth",
    description: "Future legal contact import endpoint. Guarded until consent, auth, and storage exist.",
    thirdPartyDependency: "none",
  },
  {
    id: "messages-send",
    path: "/api/messages/send",
    method: "POST",
    readiness: "blocked_until_auth",
    description: "Future Pantavion-owned messaging endpoint. Guarded until auth, user identity, abuse prevention, and storage exist.",
    thirdPartyDependency: "none",
  },
];

export const kernelCapabilities: KernelCapability[] = [
  {
    id: "intent-parser",
    name: "Intent Parser",
    ownedByPantavion: true,
    status: "internal_execution",
    notes: "Local deterministic intent parsing is active. Future AI model training can replace or augment this layer.",
  },
  {
    id: "plan-generator",
    name: "Plan Generator",
    ownedByPantavion: true,
    status: "internal_execution",
    notes: "Local plan generation is active for baseline execution flows.",
  },
  {
    id: "capability-router",
    name: "Capability Router",
    ownedByPantavion: true,
    status: "internal_foundation",
    notes: "Routes user goals to Pantavion-owned capability families.",
  },
  {
    id: "memory-core",
    name: "Memory Core",
    ownedByPantavion: true,
    status: "needs_database",
    notes: "Requires database before persistent memory claims.",
  },
  {
    id: "identity-core",
    name: "Identity Core",
    ownedByPantavion: true,
    status: "needs_auth",
    notes: "Requires real auth/account system before live user claims.",
  },
  {
    id: "sos-core",
    name: "SOS Core",
    ownedByPantavion: true,
    status: "needs_auth",
    notes: "Requires emergency contacts, consent, audit trail, and storage before live dispatch claims.",
  },
];

export function getLiveBackendContract() {
  const live = liveRoutes.filter((route) => route.readiness === "backend_connected");
  const blocked = liveRoutes.filter((route) => route.readiness !== "backend_connected");

  return {
    version: PANTAVION_LIVE_BACKEND_CONTRACT_VERSION,
    project: "Pantavion",
    principle: "Pantavion Kernel first. Third-party AI providers are not visible to users and are not strategic dependencies.",
    liveRoutes,
    kernelCapabilities,
    summary: {
      totalRoutes: liveRoutes.length,
      backendConnectedRoutes: live.length,
      guardedRoutes: blocked.length,
      thirdPartyAiVisibleToUser: false,
      ownedKernelExecution: true,
      databaseRequiredNext: true,
      authRequiredNext: true,
    },
  };
}

export function buildKernelStatus() {
  return {
    ok: true,
    kernel: "Pantavion Kernel",
    version: PANTAVION_LIVE_BACKEND_CONTRACT_VERSION,
    sovereignty: {
      userVisibleAiBrand: "PantaAI / Pantavion Kernel",
      openAiVisible: false,
      claudeVisible: false,
      geminiVisible: false,
      thirdPartyProviders: "not used in this local live-core patch",
    },
    capabilities: kernelCapabilities,
    nextCriticalGates: [
      "real database",
      "real auth/account",
      "persistent memory",
      "contact consent ledger",
      "SOS audit storage",
      "abuse/rate-limit enforcement",
    ],
  };
}
