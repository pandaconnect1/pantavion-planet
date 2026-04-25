export type GateState = "PASS" | "PARTIAL" | "BLOCKED";

export type ReadinessGate = {
  readonly id: string;
  readonly title: string;
  readonly state: GateState;
  readonly summary: string;
  readonly requiredEvidence: readonly string[];
  readonly blocks: readonly string[];
};

export const productionReadinessGates = [
  {
    id: "build-types-routes",
    title: "Build, TypeScript and Live Routes",
    state: "PASS",
    summary: "Local build, TypeScript and key live routes have passed.",
    requiredEvidence: ["npm run build", "npx tsc --noEmit", "live route HTTP 200 checks"],
    blocks: [],
  },
  {
    id: "no-dead-buttons",
    title: "No Dead Buttons",
    state: "PARTIAL",
    summary: "All visible buttons must route to a real page or show a clear beta/disabled state.",
    requiredEvidence: ["route registry", "button audit", "navigation audit"],
    blocks: ["new public buttons without route/status"],
  },
  {
    id: "stripe-before-money",
    title: "Stripe / Bank Gate",
    state: "BLOCKED",
    summary: "Stripe and payment capture remain blocked until legal, refund, privacy, pricing and access policy are complete.",
    requiredEvidence: ["pricing terms", "refund policy", "privacy policy", "terms", "business/payment provider decision"],
    blocks: ["real payment collection", "subscription activation", "paid trials"],
  },
  {
    id: "sos-claims",
    title: "SOS Safety Claims",
    state: "PARTIAL",
    summary: "SOS may be described as an emergency information and escalation system, not as guaranteed rescue or automatic authority dispatch.",
    requiredEvidence: ["SOS legal boundaries", "consent flow", "trusted contacts model", "false alarm flow"],
    blocks: ["guaranteed rescue claims", "automatic authority dispatch without agreement"],
  },
  {
    id: "imports-connectors",
    title: "Imports and External Connectors",
    state: "BLOCKED",
    summary: "External app data import requires official API, export/import, connector permission and user consent.",
    requiredEvidence: ["connector matrix", "consent records", "API terms review"],
    blocks: ["scraping", "password collection for external apps", "silent contact harvesting"],
  },
  {
    id: "minors-adult-elite",
    title: "Restricted Zones",
    state: "BLOCKED",
    summary: "Minors, Adult 18+ and Elite require separate age, identity, legal, moderation and access gates.",
    requiredEvidence: ["age model", "minor safety policy", "adult restricted policy", "elite channel policy"],
    blocks: ["adult zone launch", "minor matching", "VIP secure claims"],
  },
  {
    id: "media-rights",
    title: "Media and Audio Rights",
    state: "BLOCKED",
    summary: "Audio/radio/media operations require rights, source verification and moderation policy before live broadcasting claims.",
    requiredEvidence: ["media rights policy", "news source policy", "submission review", "AI voice consent"],
    blocks: ["unlicensed music", "unverified news broadcast", "voice cloning without consent"],
  },
] as const satisfies readonly ReadinessGate[];

export const readinessSummary = {
  total: productionReadinessGates.length,
  pass: productionReadinessGates.filter((gate) => gate.state === "PASS").length,
  partial: productionReadinessGates.filter((gate) => gate.state === "PARTIAL").length,
  blocked: productionReadinessGates.filter((gate) => gate.state === "BLOCKED").length,
  stripeAllowed: false,
} as const;
