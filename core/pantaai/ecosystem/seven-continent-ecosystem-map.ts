export type ContinentCode =
  | "africa"
  | "antarctica"
  | "asia"
  | "europe"
  | "north_america"
  | "oceania"
  | "south_america";

export type ContinentEcosystemLayer = {
  readonly continent: ContinentCode;
  readonly requiredCapabilities: readonly string[];
  readonly localizationNeeds: readonly string[];
  readonly legalNeeds: readonly string[];
  readonly serviceNeeds: readonly string[];
};

export const SEVEN_CONTINENT_ECOSYSTEM_MAP: readonly ContinentEcosystemLayer[] = [
  {
    continent: "africa",
    requiredCapabilities: [
      "mobile-first communication",
      "low-bandwidth mode",
      "local services",
      "regional payments",
      "education and work access",
      "language diversity",
      "community safety",
      "marketplace",
      "translation",
    ],
    localizationNeeds: [
      "Arabic",
      "English",
      "French",
      "Portuguese",
      "Swahili",
      "local language expansion",
    ],
    legalNeeds: [
      "country-by-country data rules",
      "payments compliance",
      "minors safety",
      "local business verification",
      "consumer protection",
    ],
    serviceNeeds: [
      "local commerce",
      "jobs",
      "learning",
      "health safety content controls",
      "mobility",
      "community services",
    ],
  },
  {
    continent: "asia",
    requiredCapabilities: [
      "China super-app pattern",
      "India and Southeast Asia mobile commerce",
      "Japan and Korea creator and messaging patterns",
      "payments and wallet abstraction",
      "high-scale social video",
      "local law segmentation",
      "regional search",
      "translation",
      "marketplace",
      "mobility",
    ],
    localizationNeeds: [
      "Chinese",
      "Hindi",
      "Japanese",
      "Korean",
      "Arabic",
      "Indonesian",
      "Thai",
      "Vietnamese",
      "Malay",
      "Filipino",
    ],
    legalNeeds: [
      "regional privacy",
      "payments licensing",
      "content rules",
      "age gates",
      "cross-border data controls",
      "marketplace compliance",
    ],
    serviceNeeds: [
      "super-app services",
      "marketplace",
      "education",
      "video",
      "mobility",
      "search",
      "local services",
    ],
  },
  {
    continent: "europe",
    requiredCapabilities: [
      "GDPR-first identity",
      "multilingual communication",
      "verified services",
      "regulated payments",
      "legal consent flows",
      "professional business layers",
      "accessibility",
      "public-sector ready privacy",
    ],
    localizationNeeds: [
      "Greek",
      "English",
      "German",
      "French",
      "Spanish",
      "Italian",
      "Dutch",
      "Polish",
      "Romanian",
      "Bulgarian",
    ],
    legalNeeds: [
      "GDPR",
      "ePrivacy",
      "consumer protection",
      "payments compliance",
      "accessibility",
      "data residency where required",
    ],
    serviceNeeds: [
      "business marketplace",
      "translation",
      "education",
      "jobs",
      "infrastructure professional tools",
      "local services",
    ],
  },
  {
    continent: "north_america",
    requiredCapabilities: [
      "creator economy",
      "AI productivity",
      "work automation",
      "business tools",
      "marketplace",
      "social video",
      "privacy and state-specific controls",
      "enterprise integrations",
    ],
    localizationNeeds: [
      "English",
      "Spanish",
      "French",
    ],
    legalNeeds: [
      "US state privacy",
      "Canada privacy",
      "payments and tax",
      "health claim controls",
      "financial claim controls",
      "consumer protection",
    ],
    serviceNeeds: [
      "business tools",
      "creator tools",
      "AI automation",
      "education",
      "commerce",
      "professional services",
    ],
  },
  {
    continent: "south_america",
    requiredCapabilities: [
      "mobile-first communication",
      "marketplace",
      "regional payments",
      "creator video",
      "local service discovery",
      "translation",
      "jobs",
      "education",
    ],
    localizationNeeds: [
      "Spanish",
      "Portuguese",
      "English",
    ],
    legalNeeds: [
      "country privacy law",
      "payments and tax",
      "consumer protection",
      "content moderation",
      "local business rules",
    ],
    serviceNeeds: [
      "commerce",
      "local services",
      "education",
      "jobs",
      "mobility",
      "creator economy",
    ],
  },
  {
    continent: "oceania",
    requiredCapabilities: [
      "remote connectivity awareness",
      "island service support",
      "services and marketplace",
      "education",
      "business tools",
      "safety and emergency communication",
      "translation",
    ],
    localizationNeeds: [
      "English",
      "Maori",
      "Pacific local languages",
    ],
    legalNeeds: [
      "privacy",
      "consumer protection",
      "accessibility",
      "emergency limitation notices",
      "regional service law",
    ],
    serviceNeeds: [
      "remote services",
      "education",
      "commerce",
      "translation",
      "safety",
      "local communities",
    ],
  },
  {
    continent: "antarctica",
    requiredCapabilities: [
      "research mode",
      "offline and weak-network mode",
      "expedition safety",
      "scientific knowledge",
      "limited-connectivity communication",
      "translation",
    ],
    localizationNeeds: [
      "English",
      "research team languages",
    ],
    legalNeeds: [
      "research station policies",
      "data protection",
      "safety disclaimers",
      "limited emergency claims",
    ],
    serviceNeeds: [
      "research",
      "translation",
      "offline packs",
      "safety communication",
      "scientific knowledge",
    ],
  },
];

export function getSevenContinentEcosystemMap(): readonly ContinentEcosystemLayer[] {
  return SEVEN_CONTINENT_ECOSYSTEM_MAP;
}

export function getContinentEcosystemLayer(
  continent: ContinentCode,
): ContinentEcosystemLayer | undefined {
  return SEVEN_CONTINENT_ECOSYSTEM_MAP.find((item) => item.continent === continent);
}

export const pantavion_seven_continent_marker_v1 =
  "pantavion_seven_continent_ecosystem_c2_v1";
