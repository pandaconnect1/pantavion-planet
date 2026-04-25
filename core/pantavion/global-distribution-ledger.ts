import { pantavionPlatformDiscoveryMatrix } from "./platform-discovery-matrix";
import { pantavionPublicIndexableRoutes, pantavionPrivateNoIndexRoutes } from "./public-indexing-policy";
import { pantavionPublicClaimsRegistry } from "./public-claims-registry";

export type PantavionDistributionGateStatus =
  | "foundation_ready"
  | "manual_platform_setup_required"
  | "blocked_until_domain"
  | "blocked_until_legal"
  | "blocked_until_backend";

export const pantavionGlobalDistributionLedger = {
  id: "pantavion-global-distribution-gate-v1",
  title: "Pantavion Global Distribution + Dynamic Readiness Gate v1",
  status: "foundation_ready" as PantavionDistributionGateStatus,
  primaryDomainTarget: "https://pantavion.com",
  currentDeploymentFallback: "https://pantavion-planet.vercel.app",
  doctrine:
    "Pantavion must become discoverable across search, social, mobile and future app ecosystems without exposing private data or making fake-live claims.",
  publicSignals: [
    "robots.txt",
    "sitemap.xml",
    "web manifest",
    "canonical metadata",
    "OpenGraph metadata",
    "Twitter card metadata",
    "public/private indexing policy",
    "public claims registry",
    "platform discovery matrix"
  ],
  publicIndexableRoutes: pantavionPublicIndexableRoutes,
  privateNoIndexRoutes: pantavionPrivateNoIndexRoutes,
  platforms: pantavionPlatformDiscoveryMatrix,
  claims: pantavionPublicClaimsRegistry,
  manualActions: [
    "Connect pantavion.com as the canonical production domain in Vercel.",
    "Verify pantavion.com in Google Search Console.",
    "Submit https://pantavion.com/sitemap.xml in Google Search Console.",
    "Verify pantavion.com in Bing Webmaster Tools.",
    "Submit sitemap to Bing and enable IndexNow later if backend publishing events exist.",
    "Validate OpenGraph previews in LinkedIn/Facebook/Telegram/WhatsApp/X preview tools.",
    "Replace placeholder icon with final Pantavion brand icon pack before major launch.",
    "Keep dashboard, account, admin, messages, payments and live SOS incident URLs noindex/private."
  ],
  blockedUntilLater: [
    "Live Stripe charging",
    "Marketplace payouts",
    "App Store / Google Play submission",
    "Authority emergency dispatch",
    "Certified translation claims",
    "Licensed media/radio broadcasting claims"
  ]
} as const;

export const pantavionGlobalDistributionVerdict = {
  decision: "Proceed with public discovery foundation, but keep money, private data and operational claims gated.",
  nextPatch: "Stripe Readiness Gate only after global distribution and deep audit routes remain build-clean.",
  riskPosture: "Zero uncontrolled risk, not impossible zero risk."
} as const;
