import { NextResponse } from "next/server";

import {
  createPantavionWaterViewportTileResponse,
  getPantavionWaterTileManifests,
  type PantavionWaterTileMapId,
} from "@/core/infrastructure/water/water-bg-tile-manifest";

import type {
  PantavionWaterSearchTarget,
  PantavionWaterViewportBounds,
} from "@/core/infrastructure/water/water-abc-tile-foundation";

export const dynamic = "force-dynamic";

function parseMapId(value: string | null): PantavionWaterTileMapId {
  return value === "G" ? "G" : "B";
}

function parseNumber(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function createBounds(searchParams: URLSearchParams): PantavionWaterViewportBounds {
  return {
    west: parseNumber(searchParams.get("west"), 0),
    south: parseNumber(searchParams.get("south"), 0),
    east: parseNumber(searchParams.get("east"), 0),
    north: parseNumber(searchParams.get("north"), 0),
  } as const;
}

function createSearchTarget(
  mapId: PantavionWaterTileMapId,
  searchQuery: string,
): PantavionWaterSearchTarget | undefined {
  const cleanQuery = searchQuery.trim();

  if (!cleanQuery) return undefined;

  return {
    id: `pending-search-${mapId}-${encodeURIComponent(cleanQuery).slice(0, 80)}`,
    label: cleanQuery,
    mapId,
    layer: "pending_search_index",
    source: "ai_ranked_match",
  } as const;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const mapId = parseMapId(searchParams.get("mapId"));
  const bounds = createBounds(searchParams);
  const zoom = parseNumber(searchParams.get("zoom"), 16);
  const searchQuery = searchParams.get("q") || searchParams.get("search") || "";

  const manifests = getPantavionWaterTileManifests(mapId);
  const tileLayerIds = manifests.map((manifest) => manifest.id);
  const searchTarget = createSearchTarget(mapId, searchQuery);

  const response = createPantavionWaterViewportTileResponse(
    {
      mapId,
      bounds,
      zoom,
      searchQuery: searchQuery || undefined,
      visibleOnly: true,
    },
    tileLayerIds,
    searchTarget,
  );

  return NextResponse.json(
    {
      ok: true,
      mode: "pantavion_water_bg_viewport_api_skeleton",
      warning:
        "CAD-derived tiles are not generated yet. This endpoint returns the safe viewport contract only.",
      rawDwgIncluded: false,
      publicRawDwgAccess: false,
      mobilePolicy: "visible_tiles_labels_and_target_only",
      response,
      manifests,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Water-Map-Mode": "viewport-only",
        "X-Pantavion-Water-Raw-DWG": "not-included",
      },
    },
  );
}
