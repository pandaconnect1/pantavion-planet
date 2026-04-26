export type PantavionLiveStatus =
  | "operational"
  | "foundation"
  | "blocked"
  | "legal_review"
  | "security_review";

export type PantavionStorageMode =
  | "blocked_no_persistent_storage"
  | "ephemeral_development_only"
  | "managed_database_required"
  | "self_hosted_database_ready_future";

export type PantavionLiveCapability = {
  id: string;
  name: string;
  surface: string;
  status: PantavionLiveStatus;
  publicClaim: string;
  allowedClaim: string;
  blockedClaim: string;
  requires: string[];
  nextAction: string;
};

export function getPantavionStorageMode(): PantavionStorageMode {
  const configured = process.env.PANTAVION_STORAGE_MODE;

  if (configured === "managed_database_required") return "managed_database_required";
  if (configured === "self_hosted_database_ready_future") return "self_hosted_database_ready_future";
  if (configured === "ephemeral_development_only") return "ephemeral_development_only";

  if (process.env.NODE_ENV !== "production") return "ephemeral_development_only";

  return "blocked_no_persistent_storage";
}

export function hasPersistentStorage(): boolean {
  const mode = getPantavionStorageMode();

  return (
    mode === "managed_database_required" ||
    mode === "self_hosted_database_ready_future"
  );
}

export const pantavionLiveBackendCapabilities: PantavionLiveCapability[] = [
  {
    id: "health_api",
    name: "Pantavion Health API",
    surface: "/api/health",
    status: "operational",
    publicClaim: "Live operational health endpoint.",
    allowedClaim: "Pantavion has a real backend health/status endpoint.",
    blockedClaim: "This does not prove the whole ecosystem is complete.",
    requires: [],
    nextAction: "Keep as live uptime signal.",
  },
  {
    id: "kernel_status_api",
    name: "Kernel Status API",
    surface: "/api/kernel/status",
    status: "operational",
    publicClaim: "Live kernel status endpoint.",
    allowedClaim: "Pantavion exposes truthful module states.",
    blockedClaim: "Do not claim all modules are fully production-operational.",
    requires: [],
    nextAction: "Connect to admin dashboard later.",
  },
  {
    id: "pantai_local_execute",
    name: "PantaAI Local Execution Endpoint",
    surface: "/api/pantai/execute",
    status: "operational",
    publicClaim: "Internal deterministic Pantavion execution kernel v1.",
    allowedClaim:
      "Pantavion can parse intent, generate a plan, map capabilities, and return execution steps without exposing third-party AI brands.",
    blockedClaim: "Do not claim frontier own LLM training yet.",
    requires: ["memory store", "tool execution sandbox", "future own model training"],
    nextAction: "Add persistence, memory, adapters, and tool execution.",
  },
  {
    id: "admission_api",
    name: "Admission / Waitlist API",
    surface: "/api/admission",
    status: "blocked",
    publicClaim:
      "Production-safe admission endpoint exists but persistent storage is required before public collection.",
    allowedClaim:
      "Pantavion validates admission data and blocks fake-live storage in production.",
    blockedClaim: "Do not claim production user storage until database is connected.",
    requires: ["persistent database", "consent record", "retention policy"],
    nextAction: "Connect PostgreSQL or self-hosted database adapter.",
  },
  {
    id: "contacts_import_api",
    name: "Consent-Based Contact Import API",
    surface: "/api/contacts/import",
    status: "blocked",
    publicClaim: "Consent-gated contact import endpoint exists.",
    allowedClaim:
      "Pantavion accepts only user-provided contacts with explicit consent.",
    blockedClaim:
      "Never scrape WhatsApp, Viber, Telegram, email, SMS, or third-party accounts.",
    requires: ["persistent database", "OAuth/export matrix", "regional consent rules"],
    nextAction: "Add import matrix and trusted connector adapters.",
  },
  {
    id: "sos_dispatch_api",
    name: "SOS Dispatch API",
    surface: "/api/sos/dispatch",
    status: "foundation",
    publicClaim: "Emergency packet validation endpoint exists.",
    allowedClaim:
      "Pantavion can validate SOS packet structure and classify dispatch readiness.",
    blockedClaim:
      "Do not claim authority dispatch, SMS dispatch, or rescue dispatch until lawful responder/authority/provider agreements exist.",
    requires: ["trusted contacts", "delivery transport", "audit logs", "authority opt-in"],
    nextAction: "Add trusted-contact dispatch and audit storage.",
  },
  {
    id: "messages_api",
    name: "Internal Messaging API",
    surface: "/api/messages/send",
    status: "blocked",
    publicClaim:
      "Messaging endpoint exists but production messaging requires identity and storage.",
    allowedClaim:
      "Pantavion has the controlled entry point for own messaging.",
    blockedClaim:
      "Do not claim WhatsApp/Viber-equivalent messaging until identity, storage, delivery, encryption, and abuse controls exist.",
    requires: ["auth", "user profiles", "message store", "delivery receipts", "abuse controls"],
    nextAction: "Build Pantavion identity and message store.",
  },
];

export function getPantavionLiveSummary() {
  const storageMode = getPantavionStorageMode();

  return {
    product: "Pantavion",
    version: "live-core-spine-v1",
    generatedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    storageMode,
    persistentStorage: hasPersistentStorage(),
    doctrine:
      "No fake-live claims. Every surface must be operational, foundation, blocked, legal_review, or security_review.",
    rule:
      "Pantavion-owned systems first. Third-party providers, when unavoidable, are temporary hidden adapters, never the public identity.",
    capabilities: pantavionLiveBackendCapabilities,
  };
}

export function blockedBecauseNoPersistentStorage(moduleName: string) {
  return {
    ok: false,
    module: moduleName,
    status: "blocked_no_persistent_storage",
    message:
      "Production persistence is not configured. Pantavion refuses fake-live storage claims.",
    storageMode: getPantavionStorageMode(),
    required:
      "Connect managed PostgreSQL now or self-hosted PostgreSQL/Neo4j later. Until then production writes stay blocked.",
  };
}
