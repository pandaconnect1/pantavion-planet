export type PantavionWaterMapId = "A" | "B" | "G";

export type PantavionWaterMapRole =
  | "operational_live_map"
  | "master_reference_map"
  | "intelligence_work_map";

export type PantavionWaterSourceKind =
  | "live_operational_layer"
  | "private_master_dwg_source"
  | "private_intelligence_dwg_source"
  | "derived_tile_layer"
  | "derived_search_index"
  | "derived_label_index"
  | "derived_layer_index"
  | "derived_viewport_layer";

export type PantavionWaterMapSource = {
  readonly mapId: PantavionWaterMapId;
  readonly role: PantavionWaterMapRole;
  readonly label: string;
  readonly sourceKind: PantavionWaterSourceKind;
  readonly privateBlobPath?: string;
  readonly expectedSizeBytes?: number;
  readonly publicBrowserAccess: false;
  readonly rawSourceMutationAllowed: false;
  readonly mobileMustUseDerivedTiles: boolean;
  readonly mobileMustUseViewportOnly: boolean;
  readonly searchMustReturnVisibleTarget: boolean;
  readonly notes: readonly string[];
};

export const PANTAVION_WATER_MASTER_B_EXPECTED_SIZE_BYTES = 205565159;

export const PANTAVION_WATER_ABC_MAP_SOURCES: readonly PantavionWaterMapSource[] = [
  {
    mapId: "A",
    role: "operational_live_map",
    label: "Pantavion Water Map A — live operational map",
    sourceKind: "live_operational_layer",
    publicBrowserAccess: false,
    rawSourceMutationAllowed: false,
    mobileMustUseDerivedTiles: true,
    mobileMustUseViewportOnly: true,
    searchMustReturnVisibleTarget: true,
    notes: [
      "Map A is the current working operational water map.",
      "Map A must not be touched by B/G source work.",
      "Any B/G patch must preserve the existing live map route.",
    ],
  },
  {
    mapId: "B",
    role: "master_reference_map",
    label: "Pantavion Water Map B — protected Master DWG reference",
    sourceKind: "private_master_dwg_source",
    privateBlobPath: "water/private/maps/dwg/2026_ANDREASPAP-01-02-014.dwg",
    expectedSizeBytes: PANTAVION_WATER_MASTER_B_EXPECTED_SIZE_BYTES,
    publicBrowserAccess: false,
    rawSourceMutationAllowed: false,
    mobileMustUseDerivedTiles: true,
    mobileMustUseViewportOnly: true,
    searchMustReturnVisibleTarget: true,
    notes: [
      "Map B is the protected original Master source.",
      "Map B is read-only and must never be mutated, simplified, sampled, or exposed publicly.",
      "Mobile users must see derived tiles/viewport output, not raw DWG download.",
      "When a user searches or pans/zooms, Pantavion must return only the visible area and the matched target point/label.",
    ],
  },
  {
    mapId: "G",
    role: "intelligence_work_map",
    label: "Pantavion Water Map G — intelligence source copy",
    sourceKind: "private_intelligence_dwg_source",
    privateBlobPath: "water/private/maps/intelligence-g/source/PANTAVION_WATER_MAP_G_SOURCE.dwg",
    expectedSizeBytes: PANTAVION_WATER_MASTER_B_EXPECTED_SIZE_BYTES,
    publicBrowserAccess: false,
    rawSourceMutationAllowed: false,
    mobileMustUseDerivedTiles: true,
    mobileMustUseViewportOnly: true,
    searchMustReturnVisibleTarget: true,
    notes: [
      "Map G starts as a same-size private copy of Map B.",
      "Map G is the future intelligence/work map for faults, notes, AI, pressures, elevations, field data, and approved overlays.",
      "Map G must not overwrite or mutate Map B.",
      "Map G must support viewport-based intelligence: only visible screen layers, active search target, nearby faults, notes, and approved overlays.",
    ],
  },
] as const;

export type PantavionWaterViewportBounds = {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
};

export type PantavionWaterViewportRequest = {
  readonly mapId: PantavionWaterMapId;
  readonly bounds: PantavionWaterViewportBounds;
  readonly zoom: number;
  readonly searchQuery?: string;
  readonly userLocation?: {
    readonly lat: number;
    readonly lng: number;
  };
  readonly visibleOnly: true;
};

export type PantavionWaterSearchTarget = {
  readonly id: string;
  readonly label: string;
  readonly mapId: PantavionWaterMapId;
  readonly lat?: number;
  readonly lng?: number;
  readonly layer?: string;
  readonly source: "label_index" | "layer_index" | "geometry_index" | "manual_record" | "ai_ranked_match";
};

export type PantavionWaterViewportResponseContract = {
  readonly mapId: PantavionWaterMapId;
  readonly visibleOnly: true;
  readonly includesRawDwg: false;
  readonly includesOnlyScreenArea: true;
  readonly tileManifestRequired: true;
  readonly searchTargetRequiredWhenSearching: true;
  readonly labelsMustBeScreenBounded: true;
  readonly maxMobilePayloadPolicy: "viewport_tiles_and_visible_labels_only";
};

export type PantavionWaterTilePipelineStage =
  | "private_source_verified"
  | "cad_render_required"
  | "tile_manifest_required"
  | "viewport_api_required"
  | "visible_screen_only_required"
  | "search_index_required"
  | "search_target_marker_required"
  | "label_index_required"
  | "layer_index_required"
  | "mobile_viewer_required"
  | "founder_visual_approval_required";

export const PANTAVION_WATER_GOOGLE_STYLE_TILE_PIPELINE: readonly PantavionWaterTilePipelineStage[] = [
  "private_source_verified",
  "cad_render_required",
  "tile_manifest_required",
  "viewport_api_required",
  "visible_screen_only_required",
  "search_index_required",
  "search_target_marker_required",
  "label_index_required",
  "layer_index_required",
  "mobile_viewer_required",
  "founder_visual_approval_required",
] as const;

export const PANTAVION_WATER_VIEWPORT_RESPONSE_CONTRACT: PantavionWaterViewportResponseContract = {
  mapId: "B",
  visibleOnly: true,
  includesRawDwg: false,
  includesOnlyScreenArea: true,
  tileManifestRequired: true,
  searchTargetRequiredWhenSearching: true,
  labelsMustBeScreenBounded: true,
  maxMobilePayloadPolicy: "viewport_tiles_and_visible_labels_only",
} as const;

export function getPantavionWaterMapSource(mapId: PantavionWaterMapId) {
  return PANTAVION_WATER_ABC_MAP_SOURCES.find((source) => source.mapId === mapId) ?? null;
}

export function assertPantavionWaterMobilePolicy(source: PantavionWaterMapSource) {
  if (source.publicBrowserAccess !== false) {
    return {
      ok: false,
      reason: "RAW_SOURCE_PUBLIC_BROWSER_ACCESS_FORBIDDEN",
    } as const;
  }

  if (source.rawSourceMutationAllowed !== false) {
    return {
      ok: false,
      reason: "RAW_SOURCE_MUTATION_FORBIDDEN",
    } as const;
  }

  if (!source.mobileMustUseDerivedTiles) {
    return {
      ok: false,
      reason: "MOBILE_MUST_USE_DERIVED_TILES",
    } as const;
  }

  if (!source.mobileMustUseViewportOnly) {
    return {
      ok: false,
      reason: "MOBILE_MUST_USE_VISIBLE_VIEWPORT_ONLY",
    } as const;
  }

  if (!source.searchMustReturnVisibleTarget) {
    return {
      ok: false,
      reason: "SEARCH_MUST_RETURN_VISIBLE_TARGET",
    } as const;
  }

  return {
    ok: true,
    reason: "PANTAVION_WATER_TILE_VIEWPORT_SEARCH_POLICY_OK",
  } as const;
}
