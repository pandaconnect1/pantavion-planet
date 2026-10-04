export type UnifiedPlaceResultKind =
  | "STREET"
  | "ADDRESS"
  | "POI"
  | "HOTEL"
  | "BUSINESS"
  | "PLACE_NAME";

export type UnifiedPlaceSource =
  | "PANTAVION_VERIFIED"
  | "GOOGLE_MAPS"
  | "TOMTOM"
  | "HERE"
  | "MAPBOX"
  | "OPENSTREETMAP"
  | "CYPRUS_OFFICIAL";

export type UnifiedPlaceResult = {
  resultId: string;
  kind: UnifiedPlaceResultKind;
  displayName: string;
  secondaryLabel: string | null;
  coordinates: { lat: number; lng: number } | null;
  source: UnifiedPlaceSource;
  sourceResultId: string | null;
  confidence: number | null;
  persistence: "PANTAVION_OWNED" | "SESSION_ONLY" | "LICENSED_PERSISTENCE";
};

export const WATER_UNIFIED_PLACE_SEARCH_POLICY = {
  providerStrategy: "POLICY_BASED_MULTI_PROVIDER",
  interactiveProviderPriority: ["GOOGLE_MAPS", "TOMTOM", "PANTAVION_VERIFIED", "CYPRUS_OFFICIAL"],
  presentation: "ONE_PANTAVION_UI",
  principles: [
    "Show one ranked result list even when results originate from multiple lawful providers.",
    "Use Google Maps place/address discovery only where current licence and EEA terms permit the requested presentation and retention.",
    "Use TomTom as an independent search/navigation source and failover rather than making Pantavion dependent on one provider.",
    "Pantavion-owned and Cyprus-official retained data may be enriched only within their licences.",
    "Provider results with temporary-use restrictions remain session-only and are never copied into the permanent registry.",
    "Do not infer that matching provider names are the same real-world feature without spatial and contextual checks.",
    "Always retain source attribution internally and display attribution where provider terms require it.",
    "Provider outages degrade search gracefully and never affect authentic water-network data.",
  ],
  rankingSignals: [
    "PANTAVION_VERIFIED_MATCH",
    "OFFICIAL_CYPRUS_MATCH",
    "SPATIAL_PROXIMITY",
    "EXACT_MULTILINGUAL_NAME",
    "ADDRESS_COMPLETENESS",
    "SOURCE_CONFIDENCE",
  ],
} as const;
