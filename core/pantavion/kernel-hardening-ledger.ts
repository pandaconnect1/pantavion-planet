export type KernelHardeningStatus =
  | "active_foundation"
  | "required_next"
  | "blocked_until_gate"
  | "planned"
  | "operator_required";

export type KernelHardeningRisk = "low" | "medium" | "high" | "critical";

export type KernelHardeningRecord = {
  id: string;
  name: string;
  plane: string;
  status: KernelHardeningStatus;
  risk: KernelHardeningRisk;
  kernelDuty: string;
  failureIfMissing: string;
  automaticAction: string;
  humanActionRequired: string;
  liveClaimAllowed: string;
};

export const KERNEL_HARDENING_STATUS_LABELS: Record<KernelHardeningStatus, string> = {
  active_foundation: "Active foundation",
  required_next: "Required next",
  blocked_until_gate: "Blocked until gate",
  planned: "Planned",
  operator_required: "Operator required",
};

export const KERNEL_HARDENING_LEDGER: KernelHardeningRecord[] = [
  {
    id: "route-health",
    name: "Route Health Sentinel",
    plane: "Kernel / Runtime / Public Surface",
    status: "required_next",
    risk: "critical",
    kernelDuty:
      "Track public routes and classify each route as live, redirect, missing, blocked, beta, operator-only or retired.",
    failureIfMissing:
      "Users, crawlers and operators can hit 404 or fake pages without the system knowing.",
    automaticAction:
      "Mark failed routes as recovery priority and block new launch claims until the route returns 200 or is intentionally retired.",
    humanActionRequired:
      "Operator must repair route, retire route, or update sitemap/navigation truth.",
    liveClaimAllowed:
      "Only routes verified as 200 may be described as public live surfaces.",
  },
  {
    id: "build-tsc-health",
    name: "Build and TypeScript Sentinel",
    plane: "Kernel / CI / Release Safety",
    status: "active_foundation",
    risk: "critical",
    kernelDuty:
      "Require npm run build and npx tsc --noEmit before every committed platform patch.",
    failureIfMissing:
      "Broken TypeScript or build errors can reach deploy and block production recovery.",
    automaticAction:
      "Set release status to blocked if local or CI checks fail.",
    humanActionRequired:
      "Operator fixes first error, reruns checks, removes tsconfig.tsbuildinfo noise, then commits.",
    liveClaimAllowed:
      "A patch may be considered clean only when build and TypeScript both pass.",
  },
  {
    id: "dead-surface-audit",
    name: "No Dead Surface Auditor",
    plane: "Product / Navigation / Trust",
    status: "required_next",
    risk: "critical",
    kernelDuty:
      "Ensure every visible button, nav item, card action, footer link and CTA has a real route, action, disabled state, beta state or blocked state.",
    failureIfMissing:
      "Pantavion becomes a fake super-app with dead buttons and user trust collapses.",
    automaticAction:
      "Flag any visible surface without a real destination as dead_surface_risk.",
    humanActionRequired:
      "Operator connects route/action, hides item, or marks it disabled/beta/blocked.",
    liveClaimAllowed:
      "No surface may imply production functionality unless the backend or route exists.",
  },
  {
    id: "claim-truth",
    name: "Claim Truth Registry",
    plane: "Governance / Legal / Product Truth",
    status: "active_foundation",
    risk: "critical",
    kernelDuty:
      "Separate doctrine_only, static_page, ui_foundation, local_prototype, backend_connected and production_operational claims.",
    failureIfMissing:
      "The platform may claim AI, payments, SOS, translation or infrastructure capabilities that do not exist yet.",
    automaticAction:
      "Block fake-live claims and require claim status before public language is approved.",
    humanActionRequired:
      "Operator updates claim registry when a module changes state.",
    liveClaimAllowed:
      "Only production_operational modules may be presented as fully live.",
  },
  {
    id: "sovereignty-lock-in",
    name: "Sovereignty Lock-in Sentinel",
    plane: "Sovereignty / Infrastructure / Cost Control",
    status: "active_foundation",
    risk: "critical",
    kernelDuty:
      "Block core dependency on OpenAI, Google Maps, Twilio, WhatsApp, DeepL, Sentry, Datadog, Pinecone or any third-party provider.",
    failureIfMissing:
      "Pantavion becomes a wrapper or reseller instead of a sovereign ecosystem.",
    automaticAction:
      "Mark any required third-party core dependency as blocked unless a Pantavion-owned path exists.",
    humanActionRequired:
      "Operator defines Pantavion-owned path, self-host path, open-source path or regulated processor boundary.",
    liveClaimAllowed:
      "Core capabilities must be described as Pantavion-owned targets unless clearly marked as temporary fallback.",
  },
  {
    id: "stripe-commercial-gate",
    name: "Stripe Commercial Gate",
    plane: "Commercial / Payments / Entitlements",
    status: "blocked_until_gate",
    risk: "critical",
    kernelDuty:
      "Prevent live charging until business identity, tax, refund, cancellation, customer portal, pricing terms and webhook entitlement verification exist.",
    failureIfMissing:
      "Pantavion can charge users before legal/commercial support is ready.",
    automaticAction:
      "Keep live payments blocked and allow only readiness/test-mode architecture.",
    humanActionRequired:
      "Operator completes business, policy, account and webhook requirements.",
    liveClaimAllowed:
      "Stripe readiness may be shown. Live payment collection remains blocked until the gate passes.",
  },
  {
    id: "sos-truth-gate",
    name: "SOS Truth Gate",
    plane: "Safety / Crisis / Emergency",
    status: "active_foundation",
    risk: "critical",
    kernelDuty:
      "Prevent claims of authority dispatch, satellite rescue, EPIRB/PLB equivalence, guaranteed rescue or certified emergency response.",
    failureIfMissing:
      "Pantavion can create dangerous false safety expectations.",
    automaticAction:
      "Block emergency claims unless supported by signed institutional/provider agreements.",
    humanActionRequired:
      "Operator defines SOS truth, trusted contacts, off-grid packet and authority opt-in status.",
    liveClaimAllowed:
      "Only local/off-grid identity packet and assistive SOS foundation may be claimed until integrations exist.",
  },
  {
    id: "translation-truth-gate",
    name: "Translation Truth Gate",
    plane: "Interpreter / Language / Safety",
    status: "active_foundation",
    risk: "high",
    kernelDuty:
      "Prevent perfect/certified translation claims and require confidence, fallback, offline phrases and high-risk disclaimers.",
    failureIfMissing:
      "Users may rely on unverified translation in legal, medical, emergency or professional contexts.",
    automaticAction:
      "Downgrade translation claim to assistive unless certified human/professional review exists.",
    humanActionRequired:
      "Operator defines phrase packs, confidence status and high-risk disclaimer model.",
    liveClaimAllowed:
      "Assistive translation and interpreter foundation may be claimed; perfect/certified translation is blocked.",
  },
  {
    id: "safe-mode-recovery",
    name: "Safe Mode and Recovery Priority",
    plane: "Kernel / Recovery / Resilience",
    status: "required_next",
    risk: "critical",
    kernelDuty:
      "Define safe mode when a module breaks: keep core pages alive, hide broken surfaces, show truthful status and prioritize repair.",
    failureIfMissing:
      "A broken module can make the ecosystem look dead, fake or unstable.",
    automaticAction:
      "Move broken features to blocked/beta/disabled status and publish operator recovery priority.",
    humanActionRequired:
      "Operator repairs highest-risk failed item first and commits only after checks pass.",
    liveClaimAllowed:
      "Pantavion may claim resilient governance only when safe-mode status is truthful.",
  },
  {
    id: "multi-kernel-sentinel",
    name: "Multi-Kernel Sentinel Mesh",
    plane: "Kernel / Sovereign Monitoring / Future Scale",
    status: "planned",
    risk: "critical",
    kernelDuty:
      "Prepare Prime, Sentinel, Recovery, Cost and Sovereignty kernels to watch each other across future Pantavion-owned deployments.",
    failureIfMissing:
      "A single process cannot observe every failure mode of the ecosystem.",
    automaticAction:
      "Declare future sentinel-node requirement without sending user content to third-party monitors by default.",
    humanActionRequired:
      "Operator creates independent Pantavion-owned sentinel nodes as infrastructure grows.",
    liveClaimAllowed:
      "Current system may claim kernel hardening foundation, not full autonomous self-healing.",
  },
];

export function getKernelHardeningSummary() {
  return {
    total: KERNEL_HARDENING_LEDGER.length,
    critical: KERNEL_HARDENING_LEDGER.filter((record) => record.risk === "critical").length,
    activeFoundation: KERNEL_HARDENING_LEDGER.filter((record) => record.status === "active_foundation").length,
    requiredNext: KERNEL_HARDENING_LEDGER.filter((record) => record.status === "required_next").length,
    blockedUntilGate: KERNEL_HARDENING_LEDGER.filter((record) => record.status === "blocked_until_gate").length,
  };
}
