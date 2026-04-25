export type PantavionPublicClaimStatus =
  | "doctrine_only"
  | "static_public_page"
  | "ui_foundation"
  | "backend_required"
  | "backend_connected"
  | "blocked_until_legal"
  | "blocked_until_payment_gate"
  | "production_operational";

export type PantavionPublicClaim = {
  readonly id: string;
  readonly surface: string;
  readonly publicClaim: string;
  readonly allowedStatus: PantavionPublicClaimStatus;
  readonly blockedClaim: string;
  readonly nextGate: string;
};

export const pantavionPublicClaimsRegistry = [
  {
    id: "global-ecosystem",
    surface: "Home / Architecture",
    publicClaim: "Pantavion is a governed global ecosystem foundation.",
    allowedStatus: "ui_foundation",
    blockedClaim: "Do not claim trillions of users, operational global authorities or complete platform execution today.",
    nextGate: "Backend identity, data model, legal and operational gates."
  },
  {
    id: "ai-orchestration",
    surface: "AI Feature Register",
    publicClaim: "Pantavion defines governed AI feature zones and capability orchestration doctrine.",
    allowedStatus: "doctrine_only",
    blockedClaim: "Do not claim proprietary frontier AI models or fully autonomous critical decisions.",
    nextGate: "Real AI router, provider contracts, evaluation, audit and human oversight."
  },
  {
    id: "sos-interpreter",
    surface: "SOS+Interpreter",
    publicClaim: "Pantavion defines SOS, off-grid identity and multilingual interpreter foundations.",
    allowedStatus: "ui_foundation",
    blockedClaim: "Do not claim guaranteed emergency dispatch, certified translation or satellite rescue.",
    nextGate: "Trusted contacts backend, consent, responder partnerships and country legal review."
  },
  {
    id: "access-model",
    surface: "Access Model",
    publicClaim: "Pantavion defines access tiers and commercial boundaries.",
    allowedStatus: "blocked_until_payment_gate",
    blockedClaim: "Do not enable live charging before Stripe/commercial/legal gate.",
    nextGate: "Stripe readiness, refund policy, tax/invoice responsibility and restricted business review."
  },
  {
    id: "competitive-intelligence",
    surface: "Competitive Intelligence",
    publicClaim: "Pantavion tracks strategic gaps and global competition at doctrine level.",
    allowedStatus: "doctrine_only",
    blockedClaim: "Do not copy competitor branding, rankings, screenshots or private claims.",
    nextGate: "Source registry, legal review and original Pantavion taxonomy."
  },
  {
    id: "media-radio",
    surface: "Radio / Audio",
    publicClaim: "Pantavion defines a multilingual audio network vision.",
    allowedStatus: "doctrine_only",
    blockedClaim: "Do not claim licensed music/news/radio broadcasting until rights and publishing workflows exist.",
    nextGate: "Rights ledger, source verification, presenter consent and audio publishing backend."
  },
  {
    id: "marketplace",
    surface: "Marketplace / Ads Center",
    publicClaim: "Pantavion defines future classified, services and ads center boundaries.",
    allowedStatus: "blocked_until_legal",
    blockedClaim: "Do not enable restricted goods, adult services, weapons, drugs, scams, counterfeit or live payment splitting.",
    nextGate: "Marketplace restricted goods registry, fraud workflow, moderation and payment/KYC decision."
  }
] as const;

export const pantavionClaimsDoctrine = {
  title: "Pantavion Public Claims Registry",
  rule: "Every public surface must state only what is true today. Future vision may be shown as foundation, roadmap or blocked-gate status, never as fake-live operation.",
  noFakeLiveRule: "If backend, legal, payment or operational support does not exist, the public status must not say production-operational."
} as const;
