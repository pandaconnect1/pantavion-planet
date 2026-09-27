import "server-only";

import { NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DLS_GENERAL_SEARCH =
  "https://eservices.dls.moi.gov.cy/arcgis/rest/services/National/General_Search/MapServer";
const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

type SearchCandidate = {
  id: string;
  source: "pantavion" | "dls" | "osm";
  label: string;
  latitude: number;
  longitude: number;
  confidence: "verified" | "reference" | "external";
  metadata?: Record<string, unknown>;
};

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalize(value: unknown) {
  return clean(value, 1000)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("el-GR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function finite(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function geometryPoint(value: unknown): { latitude: number; longitude: number } | null {
  if (!value || typeof value !== "object") return null;
  const geometry = value as Record<string, unknown>;

  const x = finite(geometry.x);
  const y = finite(geometry.y);
  if (x !== null && y !== null) {
    return { longitude: x, latitude: y };
  }

  const coordinates: Array<[number, number]> = [];
  for (const key of ["paths", "rings"] as const) {
    const groups = geometry[key];
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      if (!Array.isArray(group)) continue;
      for (const pair of group) {
        if (!Array.isArray(pair) || pair.length < 2) continue;
        const px = finite(pair[0]);
        const py = finite(pair[1]);
        if (px !== null && py !== null) coordinates.push([px, py]);
      }
    }
  }

  if (!coordinates.length) return null;
  const [sumX, sumY] = coordinates.reduce(
    (sum, [px, py]) => [sum[0] + px, sum[1] + py],
    [0, 0],
  );
  return {
    longitude: sumX / coordinates.length,
    latitude: sumY / coordinates.length,
  };
}

function patchPoint(patch: Record<string, unknown>) {
  const geometry =
    patch.geometry && typeof patch.geometry === "object"
      ? (patch.geometry as Record<string, unknown>)
      : {};
  const coordinates = geometry.coordinates;

  if (
    geometry.type === "Point" &&
    Array.isArray(coordinates) &&
    coordinates.length >= 2
  ) {
    const longitude = finite(coordinates[0]);
    const latitude = finite(coordinates[1]);
    if (longitude !== null && latitude !== null) return { latitude, longitude };
  }

  const minX = finite(patch.bbox_min_x);
  const maxX = finite(patch.bbox_max_x);
  const minY = finite(patch.bbox_min_y);
  const maxY = finite(patch.bbox_max_y);
  if (minX !== null && maxX !== null && minY !== null && maxY !== null) {
    return {
      longitude: (minX + maxX) / 2,
      latitude: (minY + maxY) / 2,
    };
  }

  return null;
}

function patchSearchText(patch: Record<string, unknown>) {
  const attributes =
    patch.attributes && typeof patch.attributes === "object"
      ? (patch.attributes as Record<string, unknown>)
      : {};

  return normalize(
    [
      patch.street_name,
      patch.area,
      patch.postal_code,
      attributes.name,
      attributes.buildingName,
      attributes.poiName,
      attributes.houseNumber,
      attributes.aliases,
      attributes.customerReference,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function patchLabel(patch: Record<string, unknown>) {
  const attributes =
    patch.attributes && typeof patch.attributes === "object"
      ? (patch.attributes as Record<string, unknown>)
      : {};
  return (
    clean(attributes.name, 500) ||
    clean(attributes.buildingName, 500) ||
    clean(attributes.poiName, 500) ||
    [patch.street_name, attributes.houseNumber, patch.area]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Pantavion verified location"
  );
}

async function pantavionCandidates(
  query: string,
  actorRef: string,
  adminMode: boolean,
): Promise<SearchCandidate[]> {
  const admin = createAdminClient();
  const base = () =>
    admin
      .from("water_spatial_patches")
      .select(
        "patch_id,status,created_by,geometry,bbox_min_x,bbox_min_y,bbox_max_x,bbox_max_y,street_name,area,postal_code,attributes",
      )
      .eq("asset_type", "road_reference")
      .order("created_at", { ascending: false })
      .limit(500);

  const [approvedResult, mineResult] = await Promise.all([
    adminMode
      ? base()
      : base().in("status", [
          "approved_overlay",
          "officialization_candidate",
          "officialized",
        ]),
    adminMode ? Promise.resolve({ data: [], error: null }) : base().eq("created_by", actorRef),
  ]);

  if (approvedResult.error) throw approvedResult.error;
  if (mineResult.error) throw mineResult.error;

  const byId = new Map<string, Record<string, unknown>>();
  for (const row of [...(approvedResult.data ?? []), ...(mineResult.data ?? [])]) {
    byId.set(String(row.patch_id), row as Record<string, unknown>);
  }

  const normalizedQuery = normalize(query);
  return Array.from(byId.values())
    .filter((patch) => patchSearchText(patch).includes(normalizedQuery))
    .flatMap<SearchCandidate>((patch) => {
      const point = patchPoint(patch);
      if (!point) return [];

      return [
        {
          id: `pantavion:${String(patch.patch_id)}`,
          source: "pantavion",
          label: patchLabel(patch),
          latitude: point.latitude,
          longitude: point.longitude,
          confidence:
            patch.status === "approved_overlay" ||
            patch.status === "officialization_candidate" ||
            patch.status === "officialized"
              ? "verified"
              : "reference",
          metadata: {
            status: patch.status,
            streetName: patch.street_name,
            area: patch.area,
            postalCode: patch.postal_code,
          },
        },
      ];
    })
    .slice(0, 8);
}

async function dlsCandidates(query: string): Promise<SearchCandidate[]> {
  const params = new URLSearchParams({
    searchText: query,
    contains: "true",
    layers: "0,9,10,11,12,13",
    returnGeometry: "true",
    outSR: "4326",
    f: "json",
  });

  const response = await fetch(`${DLS_GENERAL_SEARCH}/find?${params.toString()}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return [];

  const json = (await response.json()) as {
    results?: Array<{
      layerId?: number;
      layerName?: string;
      foundFieldName?: string;
      value?: unknown;
      attributes?: Record<string, unknown>;
      geometry?: unknown;
    }>;
  };

  return (json.results ?? [])
    .flatMap<SearchCandidate>((result, index) => {
      const point = geometryPoint(result.geometry);
      if (!point) return [];

      const label =
        clean(result.value, 500) ||
        clean(result.attributes?.ROAD_NAME, 500) ||
        clean(result.attributes?.NAME, 500) ||
        clean(result.layerName, 200) ||
        query;

      return [
        {
          id: `dls:${result.layerId ?? "x"}:${index}`,
          source: "dls",
          label,
          latitude: point.latitude,
          longitude: point.longitude,
          confidence: "reference",
          metadata: {
            layerId: result.layerId,
            layerName: result.layerName,
            foundFieldName: result.foundFieldName,
          },
        },
      ];
    })
    .slice(0, 8);
}

async function osmCandidates(query: string): Promise<SearchCandidate[]> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "6",
    addressdetails: "1",
    countrycodes: "cy",
  });

  const response = await fetch(`${NOMINATIM_SEARCH}?${params.toString()}`, {
    headers: {
      accept: "application/json",
      "user-agent": "Pantavion-Water-GIS/1.0",
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return [];

  const json = (await response.json()) as Array<{
    place_id?: number;
    lat?: string;
    lon?: string;
    display_name?: string;
    type?: string;
    class?: string;
  }>;

  return json
    .flatMap<SearchCandidate>((result) => {
      const latitude = finite(result.lat);
      const longitude = finite(result.lon);
      if (latitude === null || longitude === null) return [];

      return [
        {
          id: `osm:${result.place_id ?? `${latitude}:${longitude}`}`,
          source: "osm",
          label: clean(result.display_name, 800) || query,
          latitude,
          longitude,
          confidence: "external",
          metadata: { type: result.type, class: result.class },
        },
      ];
    });
}

export async function GET(request: Request) {
  const access = await authorizeWaterMapRequest(request);

  const url = new URL(request.url);
  const query = clean(url.searchParams.get("q"), 500);
  if (query.length < 2) {
    return NextResponse.json(
      { ok: false, error: "search_query_too_short" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const [pantavion, dls, osm] = await Promise.all([
      access.ok
        ? pantavionCandidates(
            query,
            access.actorRef,
            access.mode === "admin-session",
          )
        : Promise.resolve([]),
      dlsCandidates(query).catch(() => []),
      osmCandidates(query).catch(() => []),
    ]);

    const seen = new Set<string>();
    const results = [...pantavion, ...dls, ...osm]
      .filter((candidate) => {
        const key = `${candidate.latitude.toFixed(5)}:${candidate.longitude.toFixed(5)}:${normalize(candidate.label)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 18);

    return NextResponse.json(
      {
        ok: true,
        query,
        results,
        sourceOrder: ["pantavion", "dls", "osm"],
        protectedPantavionRegistryIncluded: access.ok,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "location_search_failed",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
