export type KernelCompletionStatus =
  | "complete"
  | "foundation"
  | "in_progress"
  | "blocked"
  | "missing";

export type KernelCompletionRisk =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type KernelCompletionDomain =
  | "kernel"
  | "ai"
  | "communication"
  | "memory"
  | "translation"
  | "security"
  | "legal"
  | "payments"
  | "navigation"
  | "marketplace"
  | "media"
  | "infrastructure";

export type KernelCompletionItem = {
  id: string;
  domain: KernelCompletionDomain;
  title: string;
  status: KernelCompletionStatus;
  risk: KernelCompletionRisk;
  whyItMatters: string;
  currentReality: string;
  requiredBeforePublic: string[];
  requiredBeforeStripe: string[];
  kernelAction: string;
  blockedClaims: string[];
};

export const kernelCompletionDoctrine = {
  title: "Pantavion Kernel Completion Doctrine",
  mission:
    "The Pantavion Kernel must stop the ecosystem from drifting into static pages, fake-live claims, dead buttons, uncontrolled third-party dependency, legal gaps, security gaps and unfinished modules.",
  rule:
    "No product family becomes public-operational until the Kernel can classify its status, missing backend, legal boundary, security boundary, owner, route/action map and dependency exposure.",
  sovereignty:
    "Third-party providers may exist only as controlled adapters. The user-facing brain is PantaAI / Pantavion Kernel. Strategic memory, routing, policy, execution and audit stay inside Pantavion.",
  reality:
    "The Kernel is not magic yet. It becomes powerful by first receiving registries, ledgers, gates and execution queues. Then it can automate, repair and improve more of the system."
};

export const kernelCompletionItems: KernelCompletionItem[] = [
  {
    id: "kernel-control-plane",
    domain: "kernel",
    title: "Kernel Control Plane",
    status: "in_progress",
    risk: "critical",
    whyItMatters:
      "Pantavion needs one central brain that sees product status, gaps, blocked claims, legal boundaries, security boundaries, provider dependencies and next actions.",
    currentReality:
      "Kernel files and audit routes exist, but the Kernel is not yet a full autonomous completion engine.",
    requiredBeforePublic: [
      "Capability registry",
      "Product status registry",
      "Route/action registry",
      "Backend claims registry",
      "Kernel completion queue"
    ],
    requiredBeforeStripe: [
      "Commercial readiness gate",
      "Security gate",
      "Legal gate",
      "No fake-live gate"
    ],
    kernelAction:
      "Build a completion queue that turns missing pieces into ordered implementation tasks.",
    blockedClaims: [
      "Do not claim the Kernel self-repairs production automatically yet.",
      "Do not claim the Kernel is fully autonomous without human approval."
    ]
  },
  {
    id: "pantaai-owned-brain",
    domain: "ai",
    title: "PantaAI Owned Brain",
    status: "foundation",
    risk: "critical",
    whyItMatters:
      "The user must see PantaAI / Pantavion Kernel, not OpenAI, Claude, Gemini or other providers as the identity of the product.",
    currentReality:
      "Third-party AI may still be needed temporarily as hidden adapters while Pantavion builds internal models, routing, memory and execution logic.",
    requiredBeforePublic: [
      "Provider abstraction",
      "No public provider branding",
      "AI claims registry",
      "Safety and policy router",
      "Cost/dependency ledger"
    ],
    requiredBeforeStripe: [
      "AI usage cost policy",
      "Fair-use policy",
      "Provider cost cap",
      "No unlimited unsafe promise"
    ],
    kernelAction:
      "Keep providers behind the Kernel and progressively replace provider dependency with Pantavion-owned models and logic.",
    blockedClaims: [
      "Do not claim Pantavion already owns frontier AI models.",
      "Do not expose competitors as the Pantavion brain.",
      "Do not send sensitive user data to providers without policy and consent."
    ]
  },
  {
    id: "communication-owned-system",
    domain: "communication",
    title: "Pantavion Communication System",
    status: "backend_required",
    risk: "critical",
    whyItMatters:
      "Pantavion cannot depend forever on WhatsApp, Viber, Telegram, SMS or email if the goal is a sovereign communication ecosystem.",
    currentReality:
      "Routes and doctrine may exist, but real own messaging, rooms, media, voice, notification and contact graph backends still need implementation.",
    requiredBeforePublic: [
      "Message schema",
      "Conversation schema",
      "Contacts consent flow",
      "Notification model",
      "No scraping policy",
      "Import legality matrix"
    ],
    requiredBeforeStripe: [
      "No paid communication promises before backend works",
      "No bulk messaging without anti-spam policy",
      "No third-party import without consent"
    ],
    kernelAction:
      "Create own Pantavion messaging primitives first, then connect optional legal import bridges.",
    blockedClaims: [
      "Do not claim users can import all app messages unless official API/export/legal transfer exists.",
      "Do not scrape private messages.",
      "Do not collect third-party app passwords."
    ]
  },
  {
    id: "memory-graph-owned",
    domain: "memory",
    title: "Pantavion Memory Graph",
    status: "foundation",
    risk: "critical",
    whyItMatters:
      "Pantavion must not behave like a chat that forgets. Memory is a sovereign spine for identity, learning, work, safety and execution.",
    currentReality:
      "Memory doctrine exists, but full user memory controls, graph schema, retention, export and restore are not complete.",
    requiredBeforePublic: [
      "Memory consent model",
      "Memory object schema",
      "Graph entity taxonomy",
      "Retention classes",
      "Delete/export controls"
    ],
    requiredBeforeStripe: [
      "Commercial memory boundaries",
      "Sensitive data handling policy",
      "Audit logs"
    ],
    kernelAction:
      "Make memory a governed Kernel-owned layer, not a random AI chat history.",
    blockedClaims: [
      "Do not claim permanent memory without backup/restore.",
      "Do not store sensitive data without purpose and user controls."
    ]
  },
  {
    id: "translation-owned-interpreter",
    domain: "translation",
    title: "Pantavion Interpreter",
    status: "foundation",
    risk: "high",
    whyItMatters:
      "Translation is central to Pantavion. It must become Pantavion-owned through glossary, phrase packs, confidence scoring and later own models.",
    currentReality:
      "Translation vision exists, but certified-perfect interpreter claims are blocked.",
    requiredBeforePublic: [
      "Language registry",
      "Confidence scoring",
      "Emergency phrase packs",
      "Offline phrase mode",
      "Medical/legal disclaimer",
      "Fallback phrase system"
    ],
    requiredBeforeStripe: [
      "No paid certified translation claim",
      "Clear assistive translation terms",
      "Professional review boundary"
    ],
    kernelAction:
      "Build translation safety and confidence into the Kernel before marketing it as life-critical.",
    blockedClaims: [
      "Do not claim 100 percent perfect translation.",
      "Do not claim certified medical/legal interpretation without certification."
    ]
  },
  {
    id: "security-defense-depth",
    domain: "security",
    title: "Security Defense-in-Depth",
    status: "foundation",
    risk: "critical",
    whyItMatters:
      "Pantavion cannot be global without RBAC, admin protection, rate limits, audit logs, incident response, backups and secret discipline.",
    currentReality:
      "Some security headers and security doctrine exist, but a full operational security control ledger is not complete.",
    requiredBeforePublic: [
      "RBAC plan",
      "Admin protection",
      "Rate limiting policy",
      "Audit log schema",
      "Incident response states",
      "Backup/restore policy",
      "Secret management"
    ],
    requiredBeforeStripe: [
      "Payment route protection",
      "Webhook validation",
      "Admin MFA roadmap",
      "Fraud review"
    ],
    kernelAction:
      "Kernel must block public/paid operations when security gates are not satisfied.",
    blockedClaims: [
      "Do not claim unbreakable security.",
      "Do not expose admin controls without RBAC/audit.",
      "Do not put secrets in frontend code."
    ]
  },
  {
    id: "global-legal-matrix",
    domain: "legal",
    title: "Global Jurisdiction Matrix",
    status: "foundation",
    risk: "critical",
    whyItMatters:
      "Pantavion is global. It needs region-aware rules for privacy, minors, adult restrictions, imports, safety, marketplace, payments and emergency communication.",
    currentReality:
      "Legal doctrine exists, but full jurisdiction-by-jurisdiction operational matrix requires professional legal review.",
    requiredBeforePublic: [
      "Country/region policy matrix",
      "Minors policy",
      "Restricted content policy",
      "Import consent policy",
      "Translation disclaimer",
      "SOS legal boundary"
    ],
    requiredBeforeStripe: [
      "Business status clarity",
      "Tax/invoice responsibility",
      "Refund terms",
      "Subscription terms",
      "Restricted category policy"
    ],
    kernelAction:
      "Kernel must mark jurisdictions as allowed, restricted, legal_review_required or blocked.",
    blockedClaims: [
      "Do not claim legal coverage in every country without review.",
      "Do not launch adult/restricted zones without jurisdiction and age verification."
    ]
  },
  {
    id: "stripe-payment-gate",
    domain: "payments",
    title: "Stripe / Payment Readiness Gate",
    status: "blocked",
    risk: "critical",
    whyItMatters:
      "Payments create legal, tax, refund, KYC/KYB, fraud and restricted category exposure.",
    currentReality:
      "Stripe can be a payment rail later, but live charging must remain blocked until commercial/legal/security gates pass.",
    requiredBeforePublic: [
      "Pricing terms",
      "Refund policy",
      "Cancellation flow",
      "Fair-use policy",
      "Commercial claims registry"
    ],
    requiredBeforeStripe: [
      "Stripe readiness ledger",
      "No raw card handling rule",
      "Checkout-only boundary",
      "Marketplace payouts blocked until KYC/KYB",
      "Restricted categories blocked"
    ],
    kernelAction:
      "Kernel blocks live charging until all payment gates are satisfied.",
    blockedClaims: [
      "Do not enable live charging now.",
      "Do not handle raw card data.",
      "Do not enable marketplace payouts before KYC/KYB."
    ]
  },
  {
    id: "no-dead-surfaces",
    domain: "navigation",
    title: "No Dead Surface Audit",
    status: "in_progress",
    risk: "high",
    whyItMatters:
      "Pantavion must not look like a static demo with dead buttons. Every visible action needs a route, real action, disabled state or beta explanation.",
    currentReality:
      "Many routes return 200, but full UI button/action audit still needs completion.",
    requiredBeforePublic: [
      "Route map",
      "Button map",
      "CTA map",
      "Form action map",
      "Disabled/beta labels",
      "Backend-connected claims"
    ],
    requiredBeforeStripe: [
      "Pricing buttons audited",
      "Checkout blocked until ready",
      "Refund/cancel pages available"
    ],
    kernelAction:
      "Kernel scans visible surfaces and blocks fake-live claims.",
    blockedClaims: [
      "Do not show fake working buttons.",
      "Do not label static pages as operational systems."
    ]
  },
  {
    id: "provider-replacement-roadmap",
    domain: "infrastructure",
    title: "Provider Replacement Roadmap",
    status: "in_progress",
    risk: "high",
    whyItMatters:
      "Pantavion can use Vercel and managed services early, but must keep exit paths and own infrastructure roadmap.",
    currentReality:
      "Vercel is acceptable now. Databases, storage, analytics, email, SMS, translation and AI providers must be tracked and minimized.",
    requiredBeforePublic: [
      "Provider ledger",
      "Cost ledger",
      "Exit plan",
      "Backup/export strategy",
      "Privacy boundaries"
    ],
    requiredBeforeStripe: [
      "Payment provider boundary",
      "Commercial cost exposure",
      "Provider failure plan"
    ],
    kernelAction:
      "Kernel tracks every provider and asks: keep, replace, self-host or block.",
    blockedClaims: [
      "Do not claim own data centers before they exist.",
      "Do not depend on providers without backup/export/exit path."
    ]
  }
];

export const kernelCompletionStats = {
  total: kernelCompletionItems.length,
  complete: kernelCompletionItems.filter((item) => item.status === "complete").length,
  foundation: kernelCompletionItems.filter((item) => item.status === "foundation").length,
  inProgress: kernelCompletionItems.filter((item) => item.status === "in_progress").length,
  blocked: kernelCompletionItems.filter((item) => item.status === "blocked").length,
  critical: kernelCompletionItems.filter((item) => item.risk === "critical").length
};

export const kernelNextActions = [
  "Build completion queue from all missing/foundation items.",
  "Connect route/action map to no-dead-surface audit.",
  "Connect provider ledger to cost and replacement roadmap.",
  "Connect Stripe readiness to legal/security/commercial gates.",
  "Connect PantaAI provider adapters behind Kernel boundary.",
  "Create backend claims registry for every module.",
  "Add admin-only future review console after RBAC exists."
];
