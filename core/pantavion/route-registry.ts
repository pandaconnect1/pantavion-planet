export const routeRegistry = {
  id: "route-registry",
  title: "Pantavion Route Registry",
  status: "foundation",
  priority: "critical",
  summary:
    "Every public button must lead to a real route with a visible purpose, status and risk classification.",
  gates: [
    "No href='#'.",
    "No empty route.",
    "No route with fake provider execution.",
    "No payment route unless legal and Stripe gates pass.",
    "Restricted routes must explain why they are restricted."
  ],
  routes: [
    { path: "/", label: "Home", status: "live", risk: "low" },
    { path: "/ecosystem", label: "Ecosystem", status: "live-after-patch", risk: "low" },
    { path: "/kernel/audit", label: "Kernel Audit", status: "live-after-patch", risk: "internal-public-foundation" },
    { path: "/pricing", label: "Pricing", status: "foundation", risk: "commercial" },
    { path: "/checkout", label: "Checkout Gate", status: "stripe-required", risk: "payment" },
    { path: "/messages", label: "Messages", status: "foundation", risk: "privacy" },
    { path: "/import-world", label: "Import World", status: "foundation", risk: "data-portability" },
    { path: "/market", label: "Market", status: "foundation", risk: "marketplace" },
    { path: "/studio", label: "Creator Studio", status: "foundation", risk: "copyright-consent" },
    { path: "/radio", label: "Radio", status: "foundation", risk: "media-rights" },
    { path: "/build-services", label: "Build Services", status: "foundation", risk: "commercial-services" },
    { path: "/legal", label: "Legal Center", status: "foundation", risk: "legal" },
    { path: "/terms", label: "Terms", status: "foundation", risk: "legal" },
    { path: "/privacy", label: "Privacy", status: "foundation", risk: "privacy" },
    { path: "/minors", label: "Minors", status: "foundation", risk: "high" },
    { path: "/adult-connect", label: "Adult Connect", status: "restricted-policy-only", risk: "very-high" },
    { path: "/elite", label: "Elite", status: "foundation", risk: "high-trust" },
    { path: "/kernel/run", label: "Kernel Run", status: "foundation", risk: "control-room" },
    { path: "/signals", label: "Signals", status: "foundation", risk: "market-intelligence" },
    { path: "/security", label: "Security", status: "foundation", risk: "security" },
    { path: "/language", label: "Language", status: "foundation", risk: "translation" },
    { path: "/intelligence/routing", label: "PantaAI Routing", status: "foundation", risk: "ai-execution" }
  ]
} as const;
