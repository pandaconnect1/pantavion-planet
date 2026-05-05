export const PANTAVION_PUBLIC_GROWTH_LEDGER_V1 = {
  marker: "PANTAVION_PUBLIC_GROWTH_LEDGER_V1",
  doctrine:
    "Pantavion being online is not enough. Pantavion must become crawlable, understandable, indexable, shareable, and commercially legible through honest public pages, sitemap, robots, structured product truth, social content, and platform discovery.",
  truth: [
    "Google indexing and ranking are not guaranteed by website existence.",
    "Bing/IndexNow requires proper key ownership and URL submission setup.",
    "Apple ecosystem discovery requires Apple Business Connect or related official business presence where eligible.",
    "Revenue is not guaranteed by being online.",
    "Pantavion must not rely only on external advertising platforms.",
  ],
  requiredPublicPages: [
    "/",
    "/sos",
    "/translate",
    "/panta-ai",
    "/life-connector",
    "/communication",
    "/advertise",
    "/newspaper",
    "/discovery",
    "/product-status",
    "/terms",
  ],
} as const;

export const PANTAVION_NO_INTRUSIVE_ADS_POLICY_V1 = {
  marker: "PANTAVION_NO_INTRUSIVE_ADS_POLICY_V1",
  doctrine:
    "Pantavion must not annoy users with unsolicited ads, popups, forced promotions, or advertising inside safety, SOS, private communication, minors, or core life flows.",
  prohibitedPlacements: [
    "SOS",
    "elder emergency flow",
    "minor-safe surfaces",
    "private chat",
    "trusted contacts",
    "critical safety screens",
    "medical-risk guidance",
    "guardian/family emergency screens",
  ],
  allowedPlacement:
    "Advertising belongs in a separate professional newspaper / classifieds / promotion surface where users intentionally browse listings.",
  userProtectionRules: [
    "No forced ads.",
    "No intrusive popups.",
    "No ads sent to users without consent.",
    "No adult ads to minors.",
    "No fake emergency, medical, financial or legal claims.",
    "No dark patterns.",
    "Paid promotion must be clearly labeled.",
  ],
} as const;

export const PANTAVION_NEWSPAPER_ADS_CENTER_V1 = {
  marker: "PANTAVION_NEWSPAPER_ADS_CENTER_V1",
  title: "Pantavion Newspaper / Professional Classifieds / Promotion Center",
  mission:
    "Create a separate professional page where businesses, professionals, creators and communities can request paid promotion by continent, country, city, region, community, category and language.",
  currentTruth:
    "The pages and policy can exist now. Automated payment, invoicing, provider payout, tax handling, moderation queue and self-serve publishing require payment provider, database and legal review before being marked live.",
  acceptedMediaTypes: ["text", "image", "audio", "video", "document", "link"],
  targetingModel: [
    "continent",
    "country",
    "city",
    "region",
    "community",
    "category",
    "profession",
    "service_type",
    "language",
    "local_reach",
    "regional_reach",
    "global_reach",
  ],
  listingLifecycle: [
    "draft",
    "submitted",
    "payment_pending",
    "under_review",
    "approved",
    "published",
    "sold",
    "rented",
    "fulfilled",
    "expired",
    "removed_from_public",
    "archived",
  ],
  removalRule:
    "Listings marked sold, rented, fulfilled, expired, rejected, or removed_from_public must not remain publicly promoted. Remove from public view first; retain records only according to legal, tax, accounting, fraud-prevention and moderation policy.",
} as const;

export const PANTAVION_DISCOVERY_PLATFORM_CHECKLIST_V1 = {
  marker: "PANTAVION_DISCOVERY_PLATFORM_CHECKLIST_V1",
  google: [
    "Create crawlable public product pages.",
    "Add sitemap route.",
    "Add robots route.",
    "Use clear metadata and internal links.",
    "Set up Google Search Console manually after deployment.",
    "Do not claim indexing/ranking is guaranteed.",
  ],
  bing: [
    "Create sitemap route.",
    "Prepare Bing Webmaster Tools.",
    "Prepare IndexNow later with real domain key file.",
    "Do not create fake IndexNow key.",
    "Do not claim URL submission guarantees indexing.",
  ],
  apple: [
    "Prepare Apple Business Connect checklist.",
    "Use official business identity where eligible.",
    "Do not claim Apple Maps/Siri/Wallet discovery is automatic.",
  ],
  organic: [
    "Publish clear public threads.",
    "Create product pages that users can share.",
    "Create no-intrusive Ads/Newspaper page.",
    "Use Pantavion-owned channels instead of depending only on external ads.",
  ],
} as const;

export function summarizePantavionPublicGrowthTruth() {
  return {
    growth: PANTAVION_PUBLIC_GROWTH_LEDGER_V1.marker,
    noIntrusiveAds: PANTAVION_NO_INTRUSIVE_ADS_POLICY_V1.marker,
    newspaper: PANTAVION_NEWSPAPER_ADS_CENTER_V1.marker,
    discovery: PANTAVION_DISCOVERY_PLATFORM_CHECKLIST_V1.marker,
    publicPages: PANTAVION_PUBLIC_GROWTH_LEDGER_V1.requiredPublicPages,
  };
}
