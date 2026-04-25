export type PantavionDiscoveryStatus =
  | "ready"
  | "foundation"
  | "manual_required"
  | "blocked_until_domain"
  | "blocked_until_legal"
  | "blocked_until_backend";

export type PantavionDiscoveryPlatform = {
  readonly id: string;
  readonly name: string;
  readonly surface: string;
  readonly purpose: string;
  readonly requiredSignals: readonly string[];
  readonly status: PantavionDiscoveryStatus;
  readonly ownerGate: string;
};

export const pantavionPlatformDiscoveryMatrix = [
  {
    id: "google-search",
    name: "Google Search",
    surface: "Search index",
    purpose: "Make public Pantavion pages discoverable through search.",
    requiredSignals: ["robots.txt", "sitemap.xml", "canonical URLs", "metadata", "Search Console verification"],
    status: "manual_required",
    ownerGate: "Verify domain in Google Search Console and submit sitemap."
  },
  {
    id: "bing-msn-yahoo",
    name: "Bing / MSN / Yahoo",
    surface: "Search index",
    purpose: "Make Pantavion discoverable across Microsoft search distribution.",
    requiredSignals: ["sitemap.xml", "Bing Webmaster Tools", "IndexNow readiness"],
    status: "manual_required",
    ownerGate: "Verify domain in Bing Webmaster Tools after production domain is connected."
  },
  {
    id: "social-opengraph",
    name: "OpenGraph Platforms",
    surface: "Facebook, LinkedIn, WhatsApp, Telegram, Viber, Messenger, Discord",
    purpose: "Show professional title, description and preview image when Pantavion links are shared.",
    requiredSignals: ["og:title", "og:description", "og:url", "og:type", "og:site_name", "og:image"],
    status: "ready",
    ownerGate: "Validate previews after deployment."
  },
  {
    id: "x-twitter-cards",
    name: "X / Twitter Cards",
    surface: "X link previews",
    purpose: "Show rich preview cards for Pantavion public links.",
    requiredSignals: ["twitter:card", "twitter:title", "twitter:description", "twitter:image"],
    status: "ready",
    ownerGate: "Validate card preview after deployment."
  },
  {
    id: "pwa-mobile",
    name: "PWA / Mobile Installability",
    surface: "Browser install prompt and mobile home screen",
    purpose: "Prepare Pantavion as a mobile-first installable web app.",
    requiredSignals: ["manifest", "theme color", "icons", "mobile viewport"],
    status: "foundation",
    ownerGate: "Add final production icon pack before public brand launch."
  },
  {
    id: "app-store-google-play",
    name: "App Store / Google Play",
    surface: "Future mobile distribution",
    purpose: "Prepare for future native app submission without claiming app store launch today.",
    requiredSignals: ["privacy policy", "data safety disclosures", "app screenshots", "native build"],
    status: "blocked_until_backend",
    ownerGate: "Blocked until mobile app, privacy disclosures and backend data flows exist."
  },
  {
    id: "ai-crawlers-public-knowledge",
    name: "AI / Knowledge Crawlers",
    surface: "Public web knowledge systems",
    purpose: "Allow public doctrine and public product pages to be understood while blocking private user data.",
    requiredSignals: ["public route policy", "private route disallow", "claims registry"],
    status: "foundation",
    ownerGate: "Keep private/user/SOS/payment/admin surfaces out of public indexing."
  }
] as const;

export const pantavionDiscoverySummary = {
  title: "Pantavion Global Distribution Matrix",
  doctrine: "Pantavion must be discoverable as a public governed ecosystem, while private, financial, SOS, admin and user data surfaces remain blocked from indexing.",
  primaryPublicGoal: "Global recognition without fake-live claims.",
  blockedGoal: "Do not expose private or backend-dependent features as production-operational before they exist."
} as const;
