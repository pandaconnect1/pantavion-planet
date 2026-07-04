export type PantavionCapabilityRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionCapabilityStatus =
  | "live_internal"
  | "live_foundation"
  | "requires_provider_adapter"
  | "requires_database"
  | "requires_auth"
  | "requires_policy_gate"
  | "requires_founder_approval"
  | "blocked";

export type PantavionCapabilityRecord = {
  id: string;
  title: string;
  domain:
    | "kernel"
    | "chat"
    | "pulse"
    | "contacts"
    | "people"
    | "files"
    | "voice"
    | "search"
    | "billing"
    | "sos"
    | "dwg"
    | "ops";
  status: PantavionCapabilityStatus;
  riskZone: PantavionCapabilityRiskZone;
  visibleToUser: boolean;
  productionReady: boolean;
  requiredBeforeScale: string[];
  routeTargets: string[];
};

export const PANTAVION_CAPABILITY_REGISTRY_ID =
  "pantavion_capability_registry_v1";

export const PANTAVION_CAPABILITIES: PantavionCapabilityRecord[] = [
  {
    id: "execution_kernel",
    title: "Execution Kernel",
    domain: "kernel",
    status: "live_internal",
    riskZone: "Z2",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["provider adapters", "project memory", "audit dashboard"],
    routeTargets: ["/api/pantavion/execute"]
  },
  {
    id: "live_chat",
    title: "Live Chat Foundation",
    domain: "chat",
    status: "live_foundation",
    riskZone: "Z2",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["auth", "database", "retention policy", "privacy controls"],
    routeTargets: ["/pantavion/chat", "/api/pantavion/chat"]
  },
  {
    id: "pulse_feed",
    title: "Pulse Feed Foundation",
    domain: "pulse",
    status: "live_foundation",
    riskZone: "Z2",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["database", "profiles", "moderation", "report/block"],
    routeTargets: ["/pantavion/pulse", "/api/pantavion/pulse"]
  },
  {
    id: "contacts_import",
    title: "Contacts Import Foundation",
    domain: "contacts",
    status: "requires_database",
    riskZone: "Z3",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["auth", "consent", "encrypted storage", "delete/export"],
    routeTargets: ["/pantavion/contacts", "/api/pantavion/contacts"]
  },
  {
    id: "people_graph",
    title: "People / Social Graph",
    domain: "people",
    status: "requires_auth",
    riskZone: "Z3",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["profiles", "privacy", "follow/connect", "block/report", "moderation"],
    routeTargets: ["/pantavion/people"]
  },
  {
    id: "billing_vip",
    title: "Billing / VIP",
    domain: "billing",
    status: "requires_founder_approval",
    riskZone: "Z3",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["Stripe/provider config", "tax/legal", "entitlements", "receipts"],
    routeTargets: ["/api/pantavion/billing/status", "/api/pantavion/vip/status"]
  },
  {
    id: "sos_rescue",
    title: "SOS / Rescue",
    domain: "sos",
    status: "requires_policy_gate",
    riskZone: "Z3",
    visibleToUser: true,
    productionReady: false,
    requiredBeforeScale: ["consent", "emergency circle", "jurisdiction policy", "audit", "disclaimers"],
    routeTargets: ["/api/pantavion/sos/status"]
  },
  {
    id: "dwg_source_truth",
    title: "DWG Source Truth",
    domain: "dwg",
    status: "requires_founder_approval",
    riskZone: "Z3",
    visibleToUser: false,
    productionReady: false,
    requiredBeforeScale: ["licensed adapter", "private vault", "read-only viewer", "no source transformation"],
    routeTargets: ["/professional/infrastructure/water/b", "/professional/infrastructure/water/c"]
  }
];

export function getPantavionCapabilityRegistry() {
  return {
    ok: true,
    id: PANTAVION_CAPABILITY_REGISTRY_ID,
    generatedBy: "pantavion_safe_patch_writer",
    status: "live_capability_registry_foundation",
    capabilities: PANTAVION_CAPABILITIES,
    truthRule:
      "Pantavion exposes truthful capability status. visible does not mean production-complete."
  };
}

export function summarizePantavionCapabilities() {
  return {
    total: PANTAVION_CAPABILITIES.length,
    visible: PANTAVION_CAPABILITIES.filter((item) => item.visibleToUser).length,
    productionReady: PANTAVION_CAPABILITIES.filter((item) => item.productionReady).length,
    approvalRequired: PANTAVION_CAPABILITIES.filter(
      (item) => item.riskZone === "Z3" || item.riskZone === "Z4"
    ).length,
    liveFoundations: PANTAVION_CAPABILITIES.filter(
      (item) => item.status === "live_foundation" || item.status === "live_internal"
    ).length
  };
}

