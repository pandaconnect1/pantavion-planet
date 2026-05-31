import type {
  PantavionWaterMapId,
  PantavionWaterViewportBounds,
  PantavionWaterViewportRequest,
  PantavionWaterSearchTarget,
} from "./water-abc-tile-foundation";

export type PantavionWaterTileMapId = Extract<PantavionWaterMapId, "B" | "G">;

export type PantavionWaterTileStatus =
  | "source_verified"
  | "tile_generation_pending"
  | "tile_manifest_pending"
  | "tile_manifest_ready"
  | "founder_visual_approval_pending"
  | "approved_for_mobile_viewer";

export type PantavionWaterTileKind =
  | "raster_tile"
  | "vector_tile"
  | "label_tile"
  | "search_index"
  | "layer_index"
  | "viewport_manifest";

export type PantavionWaterTileZoomPolicy = {
  readonly minZoom: number;
  readonly maxZoom: number;
  readonly defaultZoom: number;
  readonly mobileInitialZoom: number;
};

export type PantavionWaterTileLayerManifest = {
  readonly id: string;
  readonly mapId: PantavionWaterTileMapId;
  readonly label: string;
  readonly tileKind: PantavionWaterTileKind;
  readonly status: PantavionWaterTileStatus;
  readonly rawDwgIncluded: false;
  readonly publicRawSourceAccess: false;
  readonly mobileViewportOnly: true;
  readonly generatedFromPrivateBlobPath: string;
  readonly tilePathPattern?: string;
  readonly searchIndexPath?: string;
  readonly labelIndexPath?: string;
  readonly layerIndexPath?: string;
  readonly notes: readonly string[];
};

export type PantavionWaterViewportTileRequest = PantavionWaterViewportRequest & {
  readonly mapId: PantavionWaterTileMapId;
  readonly visibleOnly: true;
  readonly requestedLayerIds?: readonly string[];
};

export type PantavionWaterViewportTileResponse = {
  readonly mapId: PantavionWaterTileMapId;
  readonly bounds: PantavionWaterViewportBounds;
  readonly zoom: number;
  readonly visibleOnly: true;
  readonly rawDwgIncluded: false;
  readonly tileLayerIds: readonly string[];
  readonly searchTarget?: PantavionWaterSearchTarget;
  readonly payloadPolicy: "visible_tiles_labels_and_target_only";
};

export const PANTAVION_WATER_TILE_ZOOM_POLICY: PantavionWaterTileZoomPolicy = {
  minZoom: 8,
  maxZoom: 22,
  defaultZoom: 15,
  mobileInitialZoom: 16,
} as const;

export const PANTAVION_WATER_B_G_TILE_MANIFESTS: readonly PantavionWaterTileLayerManifest[] = [
  {
    id: "water-b-master-reference-viewport",
    mapId: "B",
    label: "Map B Master Reference Viewport Tiles",
    tileKind: "viewport_manifest",
    status: "tile_generation_pending",
    rawDwgIncluded: false,
    publicRawSourceAccess: false,
    mobileViewportOnly: true,
    generatedFromPrivateBlobPath: "water/private/maps/dwg/2026_ANDREASPAP-01-02-014.dwg",
    notes: [
      "Map B is the protected read-only Master reference.",
      "This manifest is a contract placeholder until CAD-derived tiles are generated.",
      "The mobile viewer must request only the visible viewport and search target, not the full DWG.",
    ],
  },
  {
    id: "water-b-master-label-search-index",
    mapId: "B",
    label: "Map B Master Label/Search Index",
    tileKind: "search_index",
    status: "tile_generation_pending",
    rawDwgIncluded: false,
    publicRawSourceAccess: false,
    mobileViewportOnly: true,
    generatedFromPrivateBlobPath: "water/private/maps/dwg/2026_ANDREASPAP-01-02-014.dwg",
    notes: [
      "Search must support Greek, Greeklish, English, mixed labels, road names, zones, layers, and technical identifiers.",
      "Search results must move the user to the visible target area.",
      "Search index must not expose raw private DWG.",
    ],
  },
  {
    id: "water-g-intelligence-viewport",
    mapId: "G",
    label: "Map G Intelligence Viewport Tiles",
    tileKind: "viewport_manifest",
    status: "tile_generation_pending",
    rawDwgIncluded: false,
    publicRawSourceAccess: false,
    mobileViewportOnly: true,
    generatedFromPrivateBlobPath: "water/private/maps/intelligence-g/source/PANTAVION_WATER_MAP_G_SOURCE.dwg",
    notes: [
      "Map G is the future intelligence/work map.",
      "It starts from the same-size private copy of B but is separate from B.",
      "Faults, field notes, pressure/elevation layers, AI suggestions, and approved overlays belong here.",
    ],
  },
] as const;

export function getPantavionWaterTileManifests(mapId: PantavionWaterTileMapId) {
  return PANTAVION_WATER_B_G_TILE_MANIFESTS.filter((manifest) => manifest.mapId === mapId);
}

export function assertPantavionWaterTileManifestSafe(manifest: PantavionWaterTileLayerManifest) {
  if (manifest.rawDwgIncluded !== false) {
    return {
      ok: false,
      reason: "RAW_DWG_MUST_NOT_BE_INCLUDED_IN_TILE_MANIFEST",
    } as const;
  }

  if (manifest.publicRawSourceAccess !== false) {
    return {
      ok: false,
      reason: "PUBLIC_RAW_SOURCE_ACCESS_FORBIDDEN",
    } as const;
  }

  if (manifest.mobileViewportOnly !== true) {
    return {
      ok: false,
      reason: "MOBILE_VIEWPORT_ONLY_REQUIRED",
    } as const;
  }

  return {
    ok: true,
    reason: "PANTAVION_WATER_B_G_TILE_MANIFEST_SAFE",
  } as const;
}

export function createPantavionWaterViewportTileResponse(
  request: PantavionWaterViewportTileRequest,
  tileLayerIds: readonly string[],
  searchTarget?: PantavionWaterSearchTarget,
): PantavionWaterViewportTileResponse {
  return {
    mapId: request.mapId,
    bounds: request.bounds,
    zoom: request.zoom,
    visibleOnly: true,
    rawDwgIncluded: false,
    tileLayerIds,
    searchTarget,
    payloadPolicy: "visible_tiles_labels_and_target_only",
  };
}
