export type PantavionLiveModuleStatus =
  | "live_foundation"
  | "internal_runtime"
  | "requires_auth"
  | "requires_database"
  | "requires_policy_gate"
  | "requires_founder_approval";

export type PantavionLiveModule = {
  id: string;
  title: string;
  description: string;
  status: PantavionLiveModuleStatus;
  route: string;
  api?: string;
  visibleNow: boolean;
  userAction: string;
  nextFoundation: string;
};

export const PANTAVION_LIVE_SURFACE_ID =
  "pantavion_live_user_surface_v1";

export const PANTAVION_LIVE_MODULES: PantavionLiveModule[] = [
  {
    id: "chat",
    title: "Pantavion Chat",
    description: "User can write now. Messages are processed by Pantavion execution kernel and saved in local runtime.",
    status: "live_foundation",
    route: "/pantavion/chat",
    api: "/api/pantavion/chat",
    visibleNow: true,
    userAction: "Write and get an internal execution response.",
    nextFoundation: "Auth + durable database + personal memory consent."
  },
  {
    id: "pulse",
    title: "Pantavion Pulse",
    description: "First live feed foundation. Users can create local runtime pulse posts before full database/social graph.",
    status: "live_foundation",
    route: "/pantavion/pulse",
    api: "/api/pantavion/pulse",
    visibleNow: true,
    userAction: "Create a local pulse post.",
    nextFoundation: "Database, profiles, privacy, moderation and feed ranking."
  },
  {
    id: "people",
    title: "People / Social Graph",
    description: "People layer is visible as a real module status, but production social graph requires auth, privacy and safety.",
    status: "requires_auth",
    route: "/pantavion/live",
    visibleNow: true,
    userAction: "View status and required gates.",
    nextFoundation: "Profiles, follow/connect graph, block/report and moderation."
  },
  {
    id: "execution",
    title: "Execution Engine",
    description: "Connects user intent to Pantavion plan, capabilities and execution artifacts.",
    status: "internal_runtime",
    route: "/pantavion/live",
    api: "/api/pantavion/execute",
    visibleNow: true,
    userAction: "Ask Pantavion to convert intent into a plan.",
    nextFoundation: "Safe patch writer and provider adapters."
  },
  {
    id: "tools",
    title: "Tools / Capabilities",
    description: "Capabilities are exposed with truthful status instead of fake tool claims.",
    status: "internal_runtime",
    route: "/pantavion/live",
    api: "/api/pantavion/live/status",
    visibleNow: true,
    userAction: "See live module and capability status.",
    nextFoundation: "Capability registry, adapters, scoring and cost control."
  },
  {
    id: "vip",
    title: "VIP",
    description: "VIP is visible as a gated module. Billing and entitlement actions require founder approval.",
    status: "requires_founder_approval",
    route: "/pantavion/live",
    visibleNow: true,
    userAction: "View VIP gate and future entitlement path.",
    nextFoundation: "Stripe/provider gate, plans, invoices, entitlement checks."
  },
  {
    id: "sos",
    title: "SOS",
    description: "SOS remains safety-critical and must not be fake. It is shown as a governed module.",
    status: "requires_policy_gate",
    route: "/pantavion/live",
    visibleNow: true,
    userAction: "View SOS policy status.",
    nextFoundation: "Emergency circle, offline packet, consent and jurisdiction gates."
  }
];

export function getPantavionLiveSurfaceStatus() {
  return {
    ok: true,
    id: PANTAVION_LIVE_SURFACE_ID,
    status: "live_visible_foundation",
    message:
      "Pantavion now has a visible live user surface with real internal runtime APIs for chat, pulse and execution status.",
    modules: PANTAVION_LIVE_MODULES,
    truthRule:
      "Visible does not mean production-complete. Every module shows truthful status and next foundation."
  };
}
