const fs = require("fs");
const path = require("path");

const outputDir = path.join(process.cwd(), "exports", "project-intake");
const outputFile = path.join(outputDir, "local-language-work-orders.json");

const workOrders = [
  {
    id: "language-provider-router-v1",
    priority: "p1_high",
    kind: "provider_integration",
    title: "Create translation provider router",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    reason:
      "Pantavion cannot claim global live translation until provider routing, cost controls, fallback and legal boundaries exist.",
  },
  {
    id: "sos-live-translation-v1",
    priority: "p1_high",
    kind: "protected_sos_implementation",
    title: "Build SOS live voice/text translation pipeline",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    reason:
      "SOS translation is critical and must include consent, warnings, fallback phrases and provider safety checks.",
  },
  {
    id: "language-quality-safety-v1",
    priority: "p1_high",
    kind: "safety_gate",
    title: "Add translation quality and safety guard",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    reason:
      "Medical, legal, emergency and financial contexts require confidence, original text, disclaimers and escalation.",
  },
  {
    id: "offline-emergency-language-pack-v1",
    priority: "p2_medium",
    kind: "offline_resilience",
    title: "Draft offline emergency language pack",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    reason:
      "Weak/no-signal cases need local phrases and QR/display mode, without claiming satellite rescue behavior.",
  },
  {
    id: "chat-message-translation-v1",
    priority: "p2_medium",
    kind: "product_route_completion",
    title: "Create real multilingual Messages/Chat translation flow",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    reason:
      "Chat translation needs identity, storage, moderation, privacy and provider-backed translation.",
  },
  {
    id: "video-subtitle-translation-v1",
    priority: "p2_medium",
    kind: "media_pipeline",
    title: "Create video subtitle and live media translation work order",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    reason:
      "Video/live subtitles need speech-to-text, translation, renderer, consent and copyright controls.",
  },
  {
    id: "searchable-world-language-catalog-v1",
    priority: "p2_medium",
    kind: "realness_repair",
    title: "Replace huge dropdown with searchable language catalog",
    founderApprovalRequired: false,
    autonomousDraftAllowed: true,
    publicClaimAllowed: true,
    reason:
      "250+ starter choices are visible now, but a planet-scale selector must become searchable and usable.",
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  source: "pantavion-language-kernel",
  warning:
    "Local-only export. Do not commit this file. It may contain internal planning signals.",
  totalWorkOrders: workOrders.length,
  founderApprovalRequired: workOrders.filter((order) => order.founderApprovalRequired)
    .length,
  autonomousDraftAllowed: workOrders.filter((order) => order.autonomousDraftAllowed)
    .length,
  publicClaimAllowed: workOrders.filter((order) => order.publicClaimAllowed).length,
  workOrders,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));

console.log("Wrote " + outputFile);
console.log("TOTAL_LANGUAGE_WORK_ORDERS=" + report.totalWorkOrders);
console.log("FOUNDER_APPROVAL_REQUIRED=" + report.founderApprovalRequired);
console.log("AUTONOMOUS_DRAFT_ALLOWED=" + report.autonomousDraftAllowed);
console.log("PUBLIC_CLAIM_ALLOWED=" + report.publicClaimAllowed);
for (const order of workOrders) {
  console.log(
    "- [" +
      order.priority +
      "] " +
      order.kind +
      " | " +
      order.title +
      " | founder=" +
      order.founderApprovalRequired,
  );
}
