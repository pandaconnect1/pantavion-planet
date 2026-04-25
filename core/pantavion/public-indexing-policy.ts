export type PantavionIndexingDecision =
  | "index_public"
  | "noindex_private"
  | "noindex_blocked"
  | "manual_review";

export type PantavionPublicRoutePolicy = {
  readonly route: string;
  readonly decision: PantavionIndexingDecision;
  readonly reason: string;
  readonly claimBoundary: string;
};

export const pantavionPublicIndexableRoutes = [
  "/",
  "/architecture",
  "/readiness",
  "/deep-audit",
  "/kernel/audit",
  "/access-model",
  "/ai-feature-register",
  "/sos-interpreter",
  "/intelligence/competitive",
  "/legal",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/pricing",
  "/security",
  "/safety"
] as const;

export const pantavionPrivateNoIndexRoutes = [
  "/admin",
  "/account",
  "/dashboard",
  "/messages",
  "/payments",
  "/checkout",
  "/api",
  "/sos/live",
  "/sos/incident",
  "/user",
  "/settings",
  "/billing",
  "/internal"
] as const;

export const pantavionIndexingPolicy = [
  {
    route: "/",
    decision: "index_public",
    reason: "Public Pantavion identity and global ecosystem entry point.",
    claimBoundary: "Public product foundation; must not claim backend operations unless connected."
  },
  {
    route: "/architecture",
    decision: "index_public",
    reason: "Public architecture doctrine and ecosystem baseline.",
    claimBoundary: "Doctrine and architecture foundation."
  },
  {
    route: "/readiness",
    decision: "index_public",
    reason: "Public readiness and production classification surface.",
    claimBoundary: "Status registry, not a promise that every product family is operational."
  },
  {
    route: "/deep-audit",
    decision: "index_public",
    reason: "Public-facing trust/readiness audit surface.",
    claimBoundary: "Audit/readiness foundation; legal review still required by jurisdiction."
  },
  {
    route: "/access-model",
    decision: "index_public",
    reason: "Public access model doctrine.",
    claimBoundary: "Commercial model foundation, not live charging."
  },
  {
    route: "/ai-feature-register",
    decision: "index_public",
    reason: "Public AI governance doctrine.",
    claimBoundary: "AI feature policy/register, not proof of autonomous AI operation."
  },
  {
    route: "/sos-interpreter",
    decision: "index_public",
    reason: "Public SOS and interpreter foundation.",
    claimBoundary: "Assistive foundation; not emergency-service guarantee."
  },
  {
    route: "/admin",
    decision: "noindex_private",
    reason: "Administrative surface must never be indexed.",
    claimBoundary: "Private internal operations."
  },
  {
    route: "/messages",
    decision: "noindex_private",
    reason: "User communication data must never be indexed.",
    claimBoundary: "Private user data."
  },
  {
    route: "/payments",
    decision: "noindex_blocked",
    reason: "Payment surfaces require commercial/legal/Stripe readiness gates.",
    claimBoundary: "Blocked until payment gate passes."
  },
  {
    route: "/sos/live",
    decision: "noindex_private",
    reason: "Live SOS incidents are sensitive life/safety data.",
    claimBoundary: "Private emergency data."
  }
] as const;

export function getPantavionIndexingDecision(route: string): PantavionIndexingDecision {
  if (pantavionPrivateNoIndexRoutes.some((blocked) => route === blocked || route.startsWith(blocked + "/"))) {
    return "noindex_private";
  }

  if (pantavionPublicIndexableRoutes.includes(route as never)) {
    return "index_public";
  }

  return "manual_review";
}
