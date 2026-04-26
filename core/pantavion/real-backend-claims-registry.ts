export type BackendClaimStatus =
  | "doctrine_only"
  | "static_page"
  | "ui_foundation"
  | "local_prototype"
  | "backend_connected"
  | "production_operational"
  | "blocked_until_gate";

export type BackendClaimRisk = "low" | "medium" | "high" | "critical";

export type BackendClaimGate =
  | "none"
  | "legal_review"
  | "security_review"
  | "commercial_gate"
  | "payment_provider_gate"
  | "jurisdiction_gate"
  | "authority_partnership_gate"
  | "medical_safety_gate"
  | "financial_safety_gate"
  | "provider_integration_gate";

export type BackendClaimRecord = {
  id: string;
  name: string;
  productFamily: string;
  publicRoute: string | null;
  status: BackendClaimStatus;
  risk: BackendClaimRisk;
  requiredGates: BackendClaimGate[];
  liveClaimAllowed: boolean;
  blockedClaims: string[];
  currentTruth: string;
  nextSafeStep: string;
};

export const BACKEND_CLAIM_STATUS_LABELS: Record<BackendClaimStatus, string> = {
  doctrine_only: "Doctrine only",
  static_page: "Static page",
  ui_foundation: "UI foundation",
  local_prototype: "Local prototype",
  backend_connected: "Backend connected",
  production_operational: "Production operational",
  blocked_until_gate: "Blocked until gate",
};

export const REAL_BACKEND_CLAIMS_REGISTRY: BackendClaimRecord[] = [
  {
    id: "homepage",
    name: "Pantavion Homepage",
    productFamily: "Platform Entry",
    publicRoute: "/",
    status: "ui_foundation",
    risk: "medium",
    requiredGates: ["none"],
    liveClaimAllowed: true,
    blockedClaims: [
      "Do not claim the full ecosystem is operational.",
      "Do not claim all visible product families have backend execution.",
    ],
    currentTruth:
      "The homepage is a live public foundation surface for Pantavion positioning and navigation.",
    nextSafeStep:
      "Keep visible claims limited to platform foundation, roadmap, and governed product direction.",
  },
  {
    id: "readiness",
    name: "Readiness Gate",
    productFamily: "Governance",
    publicRoute: "/readiness",
    status: "ui_foundation",
    risk: "medium",
    requiredGates: ["none"],
    liveClaimAllowed: true,
    blockedClaims: [
      "Do not treat readiness as legal certification.",
      "Do not treat readiness as payment approval.",
    ],
    currentTruth:
      "Readiness is a live foundation page that records launch discipline, blocked claims, and release gates.",
    nextSafeStep:
      "Connect readiness to backend claims, dead surfaces, security, and Stripe readiness ledgers.",
  },
  {
    id: "kernel-audit",
    name: "Kernel Audit",
    productFamily: "Kernel Plane",
    publicRoute: "/kernel/audit",
    status: "ui_foundation",
    risk: "medium",
    requiredGates: ["security_review"],
    liveClaimAllowed: true,
    blockedClaims: [
      "Do not claim autonomous self-repair is operational.",
      "Do not claim full observability or incident response is implemented.",
    ],
    currentTruth:
      "Kernel audit is a live foundation surface describing sovereign control-room rules and audit direction.",
    nextSafeStep:
      "Bind kernel audit to concrete route, security, claims, and operational ledgers.",
  },
  {
    id: "architecture",
    name: "Architecture",
    productFamily: "Platform Architecture",
    publicRoute: "/architecture",
    status: "ui_foundation",
    risk: "low",
    requiredGates: ["none"],
    liveClaimAllowed: true,
    blockedClaims: [
      "Do not claim every architecture plane has production backend implementation.",
    ],
    currentTruth:
      "Architecture is a live explanatory foundation page for platform planes and doctrine.",
    nextSafeStep:
      "Map each architecture plane to real files, routes, APIs, and gates.",
  },
  {
    id: "ai-feature-register",
    name: "AI Feature Register",
    productFamily: "PantaAI",
    publicRoute: "/ai-feature-register",
    status: "ui_foundation",
    risk: "high",
    requiredGates: ["provider_integration_gate", "security_review", "legal_review"],
    liveClaimAllowed: false,
    blockedClaims: [
      "Do not claim Pantavion has a proprietary live foundation model.",
      "Do not claim unrestricted agent execution.",
      "Do not claim integrations are live unless connected by official APIs.",
    ],
    currentTruth:
      "The AI feature register is a foundation registry for PantaAI capabilities, risk zones, and future execution layers.",
    nextSafeStep:
      "Add provider routing contracts, permission scopes, audit trails, and blocked-action classes before execution claims.",
  },
  {
    id: "sos-interpreter",
    name: "SOS Interpreter",
    productFamily: "Crisis / Humanitarian / Safety",
    publicRoute: "/sos-interpreter",
    status: "ui_foundation",
    risk: "critical",
    requiredGates: [
      "legal_review",
      "security_review",
      "jurisdiction_gate",
      "authority_partnership_gate",
      "medical_safety_gate",
    ],
    liveClaimAllowed: false,
    blockedClaims: [
      "Do not claim emergency authority dispatch.",
      "Do not claim satellite rescue.",
      "Do not claim EPIRB, PLB, 112, 911, or coast guard equivalence.",
      "Do not claim perfect emergency translation.",
    ],
    currentTruth:
      "SOS Interpreter is a foundation surface for safety doctrine, emergency boundaries, and future off-grid identity logic.",
    nextSafeStep:
      "Implement local emergency packet, trusted contacts schema, consent records, and offline phrase pack before live SOS claims.",
  },
  {
    id: "access-model",
    name: "Access Model",
    productFamily: "Commercial / Entitlements",
    publicRoute: "/access-model",
    status: "ui_foundation",
    risk: "high",
    requiredGates: ["commercial_gate", "legal_review", "payment_provider_gate"],
    liveClaimAllowed: false,
    blockedClaims: [
      "Do not claim live subscriptions.",
      "Do not claim lifetime unlimited access.",
      "Do not claim marketplace payouts or payment splitting.",
    ],
    currentTruth:
      "Access Model is a foundation surface for future plans, entitlement classes, and commercial boundaries.",
    nextSafeStep:
      "Add Stripe readiness gate, refund terms, cancellation flow, fair-use boundaries, and restricted business review before live payments.",
  },
  {
    id: "deep-audit",
    name: "Deep Audit Gate",
    productFamily: "Governance & Resilience",
    publicRoute: "/deep-audit",
    status: "ui_foundation",
    risk: "critical",
    requiredGates: ["legal_review", "security_review", "commercial_gate", "jurisdiction_gate"],
    liveClaimAllowed: true,
    blockedClaims: [
      "Do not treat deep audit as completed legal approval.",
      "Do not treat deep audit as production certification.",
    ],
    currentTruth:
      "Deep Audit is a live foundation route used to expose blocked claims, gate status, and risk categories.",
    nextSafeStep:
      "Connect Deep Audit to backend claims, no-dead-surface audit, jurisdiction matrix, security ledger, and translation safety ledger.",
  },
  {
    id: "competitive-intelligence",
    name: "Competitive Intelligence",
    productFamily: "Intelligence & Capability Plane",
    publicRoute: "/intelligence/competitive",
    status: "blocked_until_gate",
    risk: "medium",
    requiredGates: ["security_review"],
    liveClaimAllowed: false,
    blockedClaims: [
      "Do not expose internal competitive intelligence publicly if it is operator-gated.",
      "Do not copy competitor layouts, logos, rankings, or claims.",
    ],
    currentTruth:
      "The route currently behaves as gated/operator access in production route checks.",
    nextSafeStep:
      "Decide whether this remains operator-gated or gets a public sanitized version.",
  },
  {
    id: "stripe-payments",
    name: "Stripe / Payments",
    productFamily: "Professional / Commercial",
    publicRoute: null,
    status: "blocked_until_gate",
    risk: "critical",
    requiredGates: ["commercial_gate", "legal_review", "payment_provider_gate", "jurisdiction_gate"],
    liveClaimAllowed: false,
    blockedClaims: [
      "Do not activate live charging.",
      "Do not claim tax, invoicing, refunds, subscriptions, or marketplace payouts are solved.",
      "Do not enable adult, restricted, or high-risk categories.",
    ],
    currentTruth:
      "Stripe readiness is allowed only as foundation planning. Live payments remain blocked.",
    nextSafeStep:
      "Create Stripe readiness ledger with pricing terms, refund policy, cancellation flow, fair-use policy, KYC/KYB boundary, and restricted categories.",
  },
  {
    id: "marketplace-classifieds",
    name: "Marketplace / Classifieds",
    productFamily: "Professional / Commercial",
    publicRoute: null,
    status: "doctrine_only",
    risk: "critical",
    requiredGates: ["legal_review", "jurisdiction_gate", "payment_provider_gate", "security_review"],
    liveClaimAllowed: false,
    blockedClaims: [
      "Do not claim marketplace is operational.",
      "Do not allow restricted goods, scams, counterfeit goods, weapons, drugs, adult services, or unlicensed medical products.",
      "Do not claim buyer protection, refunds, or payouts exist before implementation.",
    ],
    currentTruth:
      "Marketplace and classifieds are product doctrine only unless a real route, policy, moderation, and transaction model are implemented.",
    nextSafeStep:
      "Create restricted goods policy, listing verification model, fraud reporting, and non-payment classifieds foundation first.",
  },
  {
    id: "contacts-import",
    name: "Contacts / Import World",
    productFamily: "Human Core",
    publicRoute: null,
    status: "doctrine_only",
    risk: "critical",
    requiredGates: ["legal_review", "security_review", "provider_integration_gate", "jurisdiction_gate"],
    liveClaimAllowed: false,
    blockedClaims: [
      "Do not scrape contacts or messages.",
      "Do not collect third-party passwords.",
      "Do not import third-party contacts without explicit consent and official API or export paths.",
    ],
    currentTruth:
      "Contact import is doctrine only until permission, OAuth, CSV import, and consent handling exist.",
    nextSafeStep:
      "Create import consent matrix and supported-source classification before any import UI claim.",
  },
  {
    id: "translation",
    name: "Translation / Interpreter",
    productFamily: "Discovery / Place / Infrastructure",
    publicRoute: null,
    status: "doctrine_only",
    risk: "high",
    requiredGates: ["provider_integration_gate", "medical_safety_gate", "legal_review"],
    liveClaimAllowed: false,
    blockedClaims: [
      "Do not claim perfect translation.",
      "Do not claim certified legal, medical, or emergency interpretation.",
      "Do not hide confidence, fallback, or disclaimer requirements.",
    ],
    currentTruth:
      "Translation is assistive product doctrine unless a real translation provider or model and safety layer are connected.",
    nextSafeStep:
      "Add translation safety ledger with confidence, fallback phrases, high-risk disclaimers, and offline phrase pack status.",
  },
  {
    id: "radio-media",
    name: "Pantavion Radio / Media",
    productFamily: "Media / Culture / Civic",
    publicRoute: null,
    status: "doctrine_only",
    risk: "high",
    requiredGates: ["legal_review", "jurisdiction_gate"],
    liveClaimAllowed: false,
    blockedClaims: [
      "Do not claim music or broadcast rights.",
      "Do not claim official emergency alerts.",
      "Do not use AI voices without consent.",
      "Do not blur news, opinion, ads, and official alerts.",
    ],
    currentTruth:
      "Radio and media are future product doctrine unless rights, moderation, source labeling, and authority gates exist.",
    nextSafeStep:
      "Create media rights and news verification policy before visible broadcast claims.",
  },
  {
    id: "own-ai-models",
    name: "Pantavion-owned AI Models",
    productFamily: "PantaAI",
    publicRoute: null,
    status: "doctrine_only",
    risk: "critical",
    requiredGates: ["legal_review", "security_review", "provider_integration_gate"],
    liveClaimAllowed: false,
    blockedClaims: [
      "Do not claim Pantavion has its own live foundation model today.",
      "Do not claim training rights without consent and data governance.",
      "Do not claim private inference unless deployed.",
    ],
    currentTruth:
      "Pantavion-owned models are a future sovereign AI path. Current safe phase is orchestration, registry, memory, routing, and provider governance.",
    nextSafeStep:
      "Build multi-provider router contracts and model governance before any proprietary model claim.",
  },
];

export function getBackendClaimById(id: string): BackendClaimRecord | undefined {
  return REAL_BACKEND_CLAIMS_REGISTRY.find((record) => record.id === id);
}

export function getBackendClaimsByStatus(status: BackendClaimStatus): BackendClaimRecord[] {
  return REAL_BACKEND_CLAIMS_REGISTRY.filter((record) => record.status === status);
}

export function getPublicBackendClaims(): BackendClaimRecord[] {
  return REAL_BACKEND_CLAIMS_REGISTRY.filter((record) => record.publicRoute !== null);
}

export function getBlockedBackendClaims(): BackendClaimRecord[] {
  return REAL_BACKEND_CLAIMS_REGISTRY.filter((record) => record.liveClaimAllowed === false);
}

export function getBackendClaimsSummary() {
  const statuses: Record<BackendClaimStatus, number> = {
    doctrine_only: 0,
    static_page: 0,
    ui_foundation: 0,
    local_prototype: 0,
    backend_connected: 0,
    production_operational: 0,
    blocked_until_gate: 0,
  };

  for (const record of REAL_BACKEND_CLAIMS_REGISTRY) {
    statuses[record.status] += 1;
  }

  return {
    total: REAL_BACKEND_CLAIMS_REGISTRY.length,
    liveClaimAllowed: REAL_BACKEND_CLAIMS_REGISTRY.filter((record) => record.liveClaimAllowed).length,
    liveClaimBlocked: REAL_BACKEND_CLAIMS_REGISTRY.filter((record) => !record.liveClaimAllowed).length,
    statuses,
  };
}

export const realBackendClaimsRegistry = {
  id: "real-backend-claims-registry",
  title: "Pantavion Real Backend Claims Registry",
  status: "mandatory-deep-audit-foundation",
  priority: "critical",
  summary:
    "Every Pantavion module must state whether it is doctrine-only, static page, UI foundation, local prototype, backend-connected, production-operational, or blocked until gate.",
  states: Object.keys(BACKEND_CLAIM_STATUS_LABELS) as BackendClaimStatus[],
  modules: REAL_BACKEND_CLAIMS_REGISTRY.map((record) => ({
    module: record.id,
    name: record.name,
    state: record.status,
    route: record.publicRoute,
    risk: record.risk,
    claimAllowed: record.currentTruth,
    claimBlocked: record.blockedClaims.join(" "),
    liveClaimAllowed: record.liveClaimAllowed,
    requiredGates: record.requiredGates,
    nextSafeStep: record.nextSafeStep,
  })),
  summaryCounts: getBackendClaimsSummary(),
} as const;
