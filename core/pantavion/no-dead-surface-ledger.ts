export type SurfaceType =
  | "top_navigation"
  | "hero_cta"
  | "homepage_card"
  | "system_route"
  | "governance_route"
  | "commercial_route"
  | "safety_route";

export type SurfaceStatus =
  | "live_route"
  | "foundation_route"
  | "beta_visible"
  | "disabled_until_gate"
  | "blocked_until_backend"
  | "retired";

export type DeadSurfaceRisk = "low" | "medium" | "high" | "critical";

export type SurfaceRecord = {
  id: string;
  label: string;
  type: SurfaceType;
  href: string;
  status: SurfaceStatus;
  risk: DeadSurfaceRisk;
  allowedClaim: string;
  blockedClaim: string;
  requiredNext: string;
};

export const SURFACE_STATUS_LABELS: Record<SurfaceStatus, string> = {
  live_route: "Live route",
  foundation_route: "Foundation route",
  beta_visible: "Beta visible",
  disabled_until_gate: "Disabled until gate",
  blocked_until_backend: "Blocked until backend",
  retired: "Retired",
};

export const NO_DEAD_SURFACE_LEDGER: SurfaceRecord[] = [
  {
    id: "home-planet",
    label: "Planet",
    type: "top_navigation",
    href: "/",
    status: "live_route",
    risk: "low",
    allowedClaim: "Pantavion planetary homepage is live.",
    blockedClaim: "Do not claim full global platform operations from the homepage alone.",
    requiredNext: "Keep homepage aligned with approved visual direction.",
  },
  {
    id: "language-bridge",
    label: "Language",
    type: "top_navigation",
    href: "/sos-interpreter",
    status: "foundation_route",
    risk: "high",
    allowedClaim: "Language and interpreter foundation exists.",
    blockedClaim: "Do not claim perfect, certified or emergency-grade translation.",
    requiredNext: "Add offline phrase packs, confidence levels and translation safety gates.",
  },
  {
    id: "people",
    label: "People",
    type: "top_navigation",
    href: "/readiness",
    status: "foundation_route",
    risk: "medium",
    allowedClaim: "People/social doctrine and readiness foundation exist.",
    blockedClaim: "Do not claim production social graph, real accounts or messaging backend yet.",
    requiredNext: "Create PantaPeople and PantaComms protocol contracts before real user graph claims.",
  },
  {
    id: "media",
    label: "Media",
    type: "top_navigation",
    href: "/architecture",
    status: "foundation_route",
    risk: "medium",
    allowedClaim: "Media architecture direction exists.",
    blockedClaim: "Do not claim public radio, music streaming, news broadcasting or licensed media operations yet.",
    requiredNext: "Create media rights, source verification and AI voice consent policy.",
  },
  {
    id: "pantaai",
    label: "PantaAI",
    type: "top_navigation",
    href: "/ai-feature-register",
    status: "foundation_route",
    risk: "critical",
    allowedClaim: "PantaAI capability registry foundation exists.",
    blockedClaim: "Do not claim native Pantavion foundation models or unlimited AI execution yet.",
    requiredNext: "Create PantaAI Router, local model lane, AI credit gates and provider kill switch.",
  },
  {
    id: "work",
    label: "Work",
    type: "top_navigation",
    href: "/access-model",
    status: "foundation_route",
    risk: "medium",
    allowedClaim: "Work/access model foundation exists.",
    blockedClaim: "Do not claim production workspace execution, marketplace payments or seller payouts yet.",
    requiredNext: "Create workspace capability contracts and commercial entitlement rules.",
  },
  {
    id: "safety",
    label: "Safety",
    type: "top_navigation",
    href: "/deep-audit",
    status: "live_route",
    risk: "critical",
    allowedClaim: "Deep Audit and safety governance foundation are live.",
    blockedClaim: "Do not claim emergency authority dispatch, satellite rescue or certified rescue operations.",
    requiredNext: "Create SOS truth ledger and off-grid packet schema.",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    type: "top_navigation",
    href: "/readiness",
    status: "foundation_route",
    risk: "medium",
    allowedClaim: "Readiness dashboard is live.",
    blockedClaim: "Do not claim authenticated user dashboard or personalized account backend yet.",
    requiredNext: "Create real dashboard route only after auth/data model exists.",
  },
  {
    id: "enter-pantavion",
    label: "Enter Pantavion",
    type: "hero_cta",
    href: "/readiness",
    status: "live_route",
    risk: "low",
    allowedClaim: "Entry route opens readiness foundation.",
    blockedClaim: "Do not imply real account onboarding until auth exists.",
    requiredNext: "Later connect to onboarding after legal/auth gates.",
  },
  {
    id: "try-language-bridge",
    label: "Try Language Bridge",
    type: "hero_cta",
    href: "/sos-interpreter",
    status: "foundation_route",
    risk: "high",
    allowedClaim: "Language bridge foundation is visible.",
    blockedClaim: "Do not imply live certified interpreter backend.",
    requiredNext: "Add translation safety ledger and offline phrase pack.",
  },
  {
    id: "open-pantaai",
    label: "Open PantaAI",
    type: "hero_cta",
    href: "/ai-feature-register",
    status: "foundation_route",
    risk: "critical",
    allowedClaim: "PantaAI register is visible.",
    blockedClaim: "Do not imply live proprietary AI model or autonomous execution.",
    requiredNext: "Add PantaAI Router and execution verification contracts.",
  },
  {
    id: "sovereignty",
    label: "Sovereignty",
    type: "governance_route",
    href: "/sovereignty",
    status: "live_route",
    risk: "critical",
    allowedClaim: "Pantavion-owned core doctrine is live.",
    blockedClaim: "Do not describe third-party providers as core Pantavion dependency.",
    requiredNext: "Use this ledger to block lock-in before feature expansion.",
  },
  {
    id: "kernel-hardening",
    label: "Kernel Hardening",
    type: "governance_route",
    href: "/kernel/hardening",
    status: "live_route",
    risk: "critical",
    allowedClaim: "Kernel hardening foundation is live.",
    blockedClaim: "Do not claim full autonomous self-healing yet.",
    requiredNext: "Add recovery priority and safe-mode runtime model.",
  },
  {
    id: "stripe-readiness",
    label: "Stripe Readiness",
    type: "commercial_route",
    href: "/stripe-readiness",
    status: "disabled_until_gate",
    risk: "critical",
    allowedClaim: "Stripe readiness gate is documented.",
    blockedClaim: "Do not claim live payment charging, marketplace payouts or full commercial compliance yet.",
    requiredNext: "Complete pricing terms, refund, cancellation, tax, company identity and webhook entitlement gate.",
  },
];

export function getNoDeadSurfaceSummary() {
  return {
    total: NO_DEAD_SURFACE_LEDGER.length,
    liveRoutes: NO_DEAD_SURFACE_LEDGER.filter((surface) => surface.status === "live_route").length,
    foundationRoutes: NO_DEAD_SURFACE_LEDGER.filter((surface) => surface.status === "foundation_route").length,
    blockedOrDisabled: NO_DEAD_SURFACE_LEDGER.filter(
      (surface) => surface.status === "blocked_until_backend" || surface.status === "disabled_until_gate",
    ).length,
    criticalRisk: NO_DEAD_SURFACE_LEDGER.filter((surface) => surface.risk === "critical").length,
  };
}
