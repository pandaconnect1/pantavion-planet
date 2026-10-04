export type PantavionWaterMapSurface = "A" | "B" | "C";

export type PantavionBaseMapCapability =
  | "buildings"
  | "house_numbers"
  | "streets"
  | "street_names"
  | "poi"
  | "search"
  | "gps";

export type PantavionOverlayCapability =
  | "water_network"
  | "faults"
  | "repairs"
  | "work_orders"
  | "field_evidence"
  | "dwg_reference"
  | "source_alignment"
  | "terrain"
  | "elevation"
  | "pressure"
  | "flow"
  | "zones"
  | "prv"
  | "telemetry"
  | "hydraulic_scenarios";

export const PANTAVION_MAP_ENGINE_FOUNDATION = {
  id: "pantavion_owned_map_engine_v1",
  viewer: "maplibre-gl",
  sameBaseMapForABC: true,
  baseMap: {
    styleEnvironmentVariable: "PANTAVION_BASEMAP_STYLE_URL",
    bootstrapStyle:
      "https://vector.openstreetmap.org/styles/shortbread/colorful.json",
    productionTarget: "pantavion-self-hosted-cyprus-vector-tiles",
    paidProviderAccountRequired: false,
    selfHostedProductionRequired: true,
    requiredCapabilities: [
      "buildings",
      "house_numbers",
      "streets",
      "street_names",
      "poi",
      "search",
      "gps",
    ] satisfies PantavionBaseMapCapability[],
  },
  surfaces: {
    A: {
      role: "field-operational",
      overlays: [
        "water_network",
        "faults",
        "repairs",
        "work_orders",
        "field_evidence",
      ] satisfies PantavionOverlayCapability[],
    },
    B: {
      role: "technical-master-reference",
      overlays: [
        "water_network",
        "dwg_reference",
        "source_alignment",
        "field_evidence",
      ] satisfies PantavionOverlayCapability[],
    },
    C: {
      role: "engineering-intelligence",
      overlays: [
        "water_network",
        "terrain",
        "elevation",
        "pressure",
        "flow",
        "zones",
        "prv",
        "telemetry",
        "hydraulic_scenarios",
      ] satisfies PantavionOverlayCapability[],
    },
  } satisfies Record<
    PantavionWaterMapSurface,
    { role: string; overlays: PantavionOverlayCapability[] }
  >,
  invariants: {
    waterGeometryNeverMutatedByBaseMap: true,
    rawDwgNeverExposedToBrowser: true,
    fullPrivateNetworkNeverLoadedPublicly: true,
    founderApprovalRequiredForCanonicalChange: true,
    baseProviderSwappable: true,
  },
} as const;
