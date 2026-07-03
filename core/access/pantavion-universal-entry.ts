export type PantavionEntryMode =
  | "write"
  | "talk"
  | "search"
  | "social"
  | "messaging"
  | "dating"
  | "payments"
  | "vip"
  | "saved_chat"
  | "tools"
  | "unknown";

export type PantavionCapabilityStatus =
  | "live_foundation"
  | "internal_runtime"
  | "requires_provider_adapter"
  | "requires_founder_approval"
  | "requires_policy_gate"
  | "blocked";

export type PantavionEntryCapability = {
  id: string;
  label: string;
  category: string;
  status: PantavionCapabilityStatus;
  userCanRequestNow: boolean;
  requiresLogin: boolean;
  requiresProviderAdapter: boolean;
  requiresFounderApproval: boolean;
  notes: string[];
};

export type PantavionUniversalEntryAssessmentInput = {
  text?: string;
  mode?: string;
  saveChat?: boolean;
  actor?: string;
  language?: string;
};

export type PantavionUniversalEntryAssessment = {
  ok: true;
  requestId: string;
  mode: PantavionEntryMode;
  normalizedText: string;
  saveRequested: boolean;
  entryStatus: "accepted_into_gateway";
  immediateResponse: string;
  suggestedCategory: string;
  suggestedSubcategory: string;
  canAnswerNow: boolean;
  requiresProviderAdapter: boolean;
  requiresFounderApproval: boolean;
  requiresPolicyGate: boolean;
  safeNextActions: string[];
  blockedActions: string[];
  matchingCapabilities: PantavionEntryCapability[];
  auditTags: string[];
  assessedAt: string;
};

export const PANTAVION_UNIVERSAL_ENTRY_ID = "pantavion_universal_entry_gateway_v1";

export const PANTAVION_ENTRY_CAPABILITIES: PantavionEntryCapability[] = [
  {
    id: "ai_chat_text_gateway",
    label: "AI Chat / Write / Ask",
    category: "ai_chat",
    status: "live_foundation",
    userCanRequestNow: true,
    requiresLogin: false,
    requiresProviderAdapter: true,
    requiresFounderApproval: false,
    notes: [
      "Accepts user text now.",
      "Provider/model routing is separate and must be audited."
    ]
  },
  {
    id: "voice_talk_gateway",
    label: "Talk / Voice",
    category: "voice",
    status: "requires_provider_adapter",
    userCanRequestNow: true,
    requiresLogin: false,
    requiresProviderAdapter: true,
    requiresFounderApproval: false,
    notes: [
      "Voice UI can be exposed, but realtime speech requires a verified provider adapter.",
      "Minors and sensitive contexts require policy gates."
    ]
  },
  {
    id: "search_research_gateway",
    label: "Search / Research",
    category: "search",
    status: "requires_provider_adapter",
    userCanRequestNow: true,
    requiresLogin: false,
    requiresProviderAdapter: true,
    requiresFounderApproval: false,
    notes: [
      "Search requests become research work orders until live search adapters are connected.",
      "Current internet/news sources must be cited when used."
    ]
  },
  {
    id: "social_network_gateway",
    label: "Social / Feed / People",
    category: "social",
    status: "requires_policy_gate",
    userCanRequestNow: true,
    requiresLogin: true,
    requiresProviderAdapter: true,
    requiresFounderApproval: true,
    notes: [
      "Social features require identity, privacy, moderation, reporting, and abuse controls.",
      "No scraping, no impersonation, no unauthorized import from other platforms."
    ]
  },
  {
    id: "messaging_gateway",
    label: "Messaging / Telegram-like / Chat",
    category: "messaging",
    status: "requires_policy_gate",
    userCanRequestNow: true,
    requiresLogin: true,
    requiresProviderAdapter: true,
    requiresFounderApproval: true,
    notes: [
      "Messaging requires account identity, abuse prevention, block/report controls, and storage policy.",
      "Private messaging and E2EE scopes must be separated."
    ]
  },
  {
    id: "dating_gateway",
    label: "Dating / Matching / Adult-safe Boundaries",
    category: "dating",
    status: "requires_policy_gate",
    userCanRequestNow: true,
    requiresLogin: true,
    requiresProviderAdapter: false,
    requiresFounderApproval: true,
    notes: [
      "Dating requires age verification, consent, safety tools, report/block, jurisdiction checks.",
      "No copying protected platform data. Only lawful Pantavion-owned flows or official integrations."
    ]
  },
  {
    id: "payments_stripe_gateway",
    label: "Payments / Stripe / VIP",
    category: "payments",
    status: "requires_founder_approval",
    userCanRequestNow: true,
    requiresLogin: true,
    requiresProviderAdapter: true,
    requiresFounderApproval: true,
    notes: [
      "Payments require Stripe/provider configuration, tax/legal checks, billing audit, and production approval.",
      "No production billing without founder approval."
    ]
  },
  {
    id: "vip_gateway",
    label: "VIP / Premium Intelligence",
    category: "vip",
    status: "live_foundation",
    userCanRequestNow: true,
    requiresLogin: true,
    requiresProviderAdapter: true,
    requiresFounderApproval: true,
    notes: [
      "VIP requests are accepted now as capability work orders.",
      "Real VIP needs plans, entitlement checks, priority routing, memory boundaries, and billing."
    ]
  },
  {
    id: "saved_chat_gateway",
    label: "Save Chat / Memory Request",
    category: "memory",
    status: "internal_runtime",
    userCanRequestNow: true,
    requiresLogin: false,
    requiresProviderAdapter: false,
    requiresFounderApproval: false,
    notes: [
      "Local/internal save request can be captured.",
      "Production memory requires auth, consent, privacy class, deletion, export, and audit."
    ]
  },
  {
    id: "auto_category_gateway",
    label: "Automatic Category / Subcategory Opening",
    category: "navigation",
    status: "live_foundation",
    userCanRequestNow: true,
    requiresLogin: false,
    requiresProviderAdapter: false,
    requiresFounderApproval: false,
    notes: [
      "Unknown user requests are converted into dynamic category work orders.",
      "Every new category must receive route, state, audit, and policy status."
    ]
  }
];

function normalize(value: unknown): string {
  return String(value || "").trim();
}

function normalizeLower(value: unknown): string {
  return normalize(value).toLowerCase();
}

function inferMode(rawMode: unknown, text: string): PantavionEntryMode {
  const mode = normalizeLower(rawMode);
  const value = `${mode} ${text.toLowerCase()}`;

  if (value.includes("voice") || value.includes("talk") || value.includes("μιλ") || value.includes("φων")) return "talk";
  if (value.includes("search") || value.includes("ψαχν") || value.includes("αναζητ") || value.includes("research")) return "search";
  if (value.includes("facebook") || value.includes("instagram") || value.includes("twitter") || value.includes("x ") || value.includes("social")) return "social";
  if (value.includes("telegram") || value.includes("snap") || value.includes("chat")) return "messaging";
  if (value.includes("grindr") || value.includes("tinder") || value.includes("gaydar") || value.includes("dating")) return "dating";
  if (value.includes("stripe") || value.includes("payment") || value.includes("billing") || value.includes("πληρω")) return "payments";
  if (value.includes("vip") || value.includes("premium")) return "vip";
  if (value.includes("save") || value.includes("memory") || value.includes("αποθηκε")) return "saved_chat";
  if (value.includes("tool") || value.includes("εργαλ")) return "tools";
  if (text.length > 0) return "write";

  return "unknown";
}

function categoryForMode(mode: PantavionEntryMode): { category: string; subcategory: string } {
  if (mode === "talk") return { category: "Voice", subcategory: "Talk / Speech Adapter" };
  if (mode === "search") return { category: "Research", subcategory: "Search / Knowledge Intake" };
  if (mode === "social") return { category: "People", subcategory: "Social Network Gateway" };
  if (mode === "messaging") return { category: "Chat", subcategory: "Messaging Gateway" };
  if (mode === "dating") return { category: "People", subcategory: "Dating / Matching Safety Gateway" };
  if (mode === "payments") return { category: "Business", subcategory: "Payments / Stripe / VIP Billing" };
  if (mode === "vip") return { category: "VIP", subcategory: "Premium Intelligence Layer" };
  if (mode === "saved_chat") return { category: "Memory", subcategory: "Save Chat / Consent Memory" };
  if (mode === "tools") return { category: "Tools", subcategory: "Dynamic Tool Request" };
  if (mode === "write") return { category: "AI Chat", subcategory: "Write / Ask / Create" };

  return { category: "Dynamic", subcategory: "New Category Work Order" };
}

function matchingCapabilities(mode: PantavionEntryMode): PantavionEntryCapability[] {
  const category = categoryForMode(mode).category.toLowerCase();

  return PANTAVION_ENTRY_CAPABILITIES.filter((capability) => {
    if (mode === "write") return capability.category === "ai_chat";
    if (mode === "talk") return capability.category === "voice";
    if (mode === "search") return capability.category === "search";
    if (mode === "social") return capability.category === "social";
    if (mode === "messaging") return capability.category === "messaging";
    if (mode === "dating") return capability.category === "dating";
    if (mode === "payments") return capability.category === "payments";
    if (mode === "vip") return capability.category === "vip";
    if (mode === "saved_chat") return capability.category === "memory";
    if (mode === "tools") return capability.category === "navigation";
    return capability.category.includes(category);
  });
}

export function getPantavionUniversalEntryGateway() {
  return {
    ok: true,
    id: PANTAVION_UNIVERSAL_ENTRY_ID,
    title: "Pantavion Universal Entry Gateway",
    status: "live_foundation",
    menu: PANTAVION_ENTRY_CAPABILITIES,
    legalIntegrationRule:
      "Pantavion may adapt capability patterns lawfully, but must not scrape, bypass, impersonate, steal data, copy protected systems, or expose private data without consent and approval.",
    defaultActions: [
      "Write / ask / create",
      "Talk / voice request",
      "Search / research request",
      "Social / people request",
      "Messaging request",
      "Dating / matching request",
      "Payments / Stripe / VIP request",
      "Save chat / memory request",
      "Open missing category as work order"
    ]
  };
}

export function assessPantavionUniversalEntry(
  input: PantavionUniversalEntryAssessmentInput
): PantavionUniversalEntryAssessment {
  const normalizedText = normalize(input.text);
  const mode = inferMode(input.mode, normalizedText);
  const category = categoryForMode(mode);
  const capabilities = matchingCapabilities(mode);

  const requiresProviderAdapter = capabilities.some((capability) => capability.requiresProviderAdapter);
  const requiresFounderApproval = capabilities.some((capability) => capability.requiresFounderApproval);
  const requiresPolicyGate = capabilities.some(
    (capability) =>
      capability.status === "requires_policy_gate" ||
      capability.category === "dating" ||
      capability.category === "social" ||
      capability.category === "messaging"
  );

  const canAnswerNow =
    mode === "write" ||
    mode === "saved_chat" ||
    mode === "tools" ||
    mode === "unknown";

  return {
    ok: true,
    requestId: `pantavion_entry_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    mode,
    normalizedText,
    saveRequested: Boolean(input.saveChat),
    entryStatus: "accepted_into_gateway",
    immediateResponse:
      canAnswerNow
        ? "Request accepted into Pantavion entry gateway. It can be answered or converted into a work order."
        : "Request accepted into Pantavion entry gateway. This category needs adapter/policy/approval work before full production execution.",
    suggestedCategory: category.category,
    suggestedSubcategory: category.subcategory,
    canAnswerNow,
    requiresProviderAdapter,
    requiresFounderApproval,
    requiresPolicyGate,
    safeNextActions: [
      "Create or update a real route for the requested category.",
      "Attach state, audit, and capability status.",
      "Convert missing feature into a build work order.",
      "Keep sensitive actions behind founder approval."
    ],
    blockedActions: [
      "No scraping or unauthorized import from other platforms.",
      "No fake login, fake payment, fake dating, fake messaging, or fake voice claims.",
      "No production billing, user data, auth, minors, dating, or private messages without policy gate.",
      "No secrets or provider keys in browser routes or logs."
    ],
    matchingCapabilities: capabilities,
    auditTags: ["entry", "universal_gateway", mode, category.category.toLowerCase()],
    assessedAt: new Date().toISOString()
  };
}
