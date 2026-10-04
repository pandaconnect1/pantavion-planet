export type WaterReferenceMapCapability =
  | "MAP_DISPLAY"
  | "ADDRESS_SEARCH"
  | "HOUSE_NUMBERS"
  | "POI_SEARCH"
  | "PLACE_NAMES"
  | "REVERSE_GEOCODING"
  | "ROUTING"
  | "REAL_TIME_TRAFFIC";

export type WaterReferenceMapProviderId =
  | "TOMTOM_ORBIS"
  | "HERE"
  | "MAPBOX"
  | "OPENSTREETMAP"
  | "PANTAVION";

export type WaterReferenceMapProvider = {
  id: WaterReferenceMapProviderId;
  capabilities: readonly WaterReferenceMapCapability[];
  enabled: boolean;
  priority: number;
  termsVerified: boolean;
};

export const WATER_REFERENCE_MAP_RULES = {
  canonicalWaterNetworkOwner: "PANTAVION",
  providerRole: "REFERENCE_AND_NAVIGATION_ONLY",
  rules: [
    "External providers never become the canonical owner of authentic water-network geometry.",
    "Provider data is displayed, searched or routed only within verified licence and API terms.",
    "Do not persist provider content when provider terms prohibit storage.",
    "Pantavion Street Registry stores only data that Pantavion is legally permitted to retain.",
    "Provider failure must not corrupt or delete Pantavion network data.",
    "A provider can be replaced without changing Map A field-work semantics.",
    "GPS road guidance and underground-asset accuracy remain distinct concepts.",
  ],
} as const;

export const WATER_REFERENCE_PROVIDER_CANDIDATES: readonly WaterReferenceMapProvider[] = [
  {
    id: "TOMTOM_ORBIS",
    capabilities: [
      "MAP_DISPLAY",
      "ADDRESS_SEARCH",
      "HOUSE_NUMBERS",
      "POI_SEARCH",
      "PLACE_NAMES",
      "REVERSE_GEOCODING",
      "ROUTING",
      "REAL_TIME_TRAFFIC",
    ],
    enabled: false,
    priority: 10,
    termsVerified: false,
  },
  {
    id: "HERE",
    capabilities: [
      "MAP_DISPLAY",
      "ADDRESS_SEARCH",
      "HOUSE_NUMBERS",
      "POI_SEARCH",
      "PLACE_NAMES",
      "REVERSE_GEOCODING",
      "ROUTING",
    ],
    enabled: false,
    priority: 20,
    termsVerified: false,
  },
  {
    id: "MAPBOX",
    capabilities: [
      "MAP_DISPLAY",
      "ADDRESS_SEARCH",
      "POI_SEARCH",
      "PLACE_NAMES",
      "ROUTING",
    ],
    enabled: false,
    priority: 30,
    termsVerified: false,
  },
] as const;
