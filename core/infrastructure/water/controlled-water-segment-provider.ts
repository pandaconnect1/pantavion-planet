import { promises as fs } from "fs";
import path from "path";

type Bbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

type Position = [number, number];

type JsonGeometry = {
  type: string;
  coordinates?: unknown;
  geometries?: JsonGeometry[];
};

type JsonFeature = {
  type: "Feature";
  geometry: JsonGeometry | null;
  properties?: Record<string, unknown> | null;
  id?: string | number;
};

type JsonFeatureCollection = {
  type: "FeatureCollection";
  features: JsonFeature[];
};

export type ControlledWaterSegmentResult = {
  sourceMode: "local_protected_master" | "private_cloud_master";
  sourceLabel: string;
  bbox: Bbox;
  totalMasterFeatureCount: number;
  matchingFeatureCount: number;
  segmentCount: number;
  segmentTruncated: boolean;
  collection: JsonFeatureCollection;
};

const LOCAL_PROTECTED_MASTER_PATH = path.join(
  process.cwd(),
  "data",
  "water-network-private",
  "processed",
  "water-network.geojson",
);

const DEFAULT_MAX_SEGMENT_FEATURES = 1200;
const HARD_MAX_SEGMENT_FEATURES = 2000;

function toNumber(value: string | null, label: string): number {
  if (!value) {
    throw new Error(`Missing bbox parameter: ${label}`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid bbox parameter: ${label}`);
  }

  return parsed;
}

export function parseControlledWaterBbox(searchParams: URLSearchParams): Bbox {
  const bbox = {
    minLng: toNumber(searchParams.get("minLng"), "minLng"),
    minLat: toNumber(searchParams.get("minLat"), "minLat"),
    maxLng: toNumber(searchParams.get("maxLng"), "maxLng"),
    maxLat: toNumber(searchParams.get("maxLat"), "maxLat"),
  };

  if (bbox.minLng >= bbox.maxLng || bbox.minLat >= bbox.maxLat) {
    throw new Error("Invalid bbox: minimum values must be lower than maximum values.");
  }

  if (bbox.minLng < -180 || bbox.maxLng > 180 || bbox.minLat < -90 || bbox.maxLat > 90) {
    throw new Error("Invalid bbox: coordinates are outside geographic bounds.");
  }

  const lngSpan = bbox.maxLng - bbox.minLng;
  const latSpan = bbox.maxLat - bbox.minLat;

  if (lngSpan > 0.35 || latSpan > 0.35) {
    throw new Error("Requested bbox is too large for controlled segment serving.");
  }

  return bbox;
}

export function parseMaxSegmentFeatures(searchParams: URLSearchParams): number {
  const raw = searchParams.get("maxFeatures");

  if (!raw) return DEFAULT_MAX_SEGMENT_FEATURES;

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) return DEFAULT_MAX_SEGMENT_FEATURES;

  return Math.max(10, Math.min(Math.floor(parsed), HARD_MAX_SEGMENT_FEATURES));
}

async function readProtectedMaster(): Promise<{
  sourceMode: ControlledWaterSegmentResult["sourceMode"];
  sourceLabel: string;
  collection: JsonFeatureCollection;
}> {
  const cloudUrl = process.env.PANTAVION_WATER_NETWORK_GEOJSON_URL;

  if (cloudUrl) {
    const response = await fetch(cloudUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Private cloud water master fetch failed: ${response.status}`);
    }

    const json = (await response.json()) as JsonFeatureCollection;

    assertFeatureCollection(json);

    return {
      sourceMode: "private_cloud_master",
      sourceLabel: "PANTAVION_WATER_NETWORK_GEOJSON_URL",
      collection: json,
    };
  }

  const raw = await fs.readFile(LOCAL_PROTECTED_MASTER_PATH, "utf8");
  const json = JSON.parse(raw) as JsonFeatureCollection;

  assertFeatureCollection(json);

  return {
    sourceMode: "local_protected_master",
    sourceLabel: LOCAL_PROTECTED_MASTER_PATH,
    collection: json,
  };
}

function assertFeatureCollection(value: JsonFeatureCollection) {
  if (!value || value.type !== "FeatureCollection" || !Array.isArray(value.features)) {
    throw new Error("Protected water master is not a valid GeoJSON FeatureCollection.");
  }
}

function collectPositions(value: unknown, output: Position[]) {
  if (!Array.isArray(value)) return;

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    output.push([value[0], value[1]]);
    return;
  }

  for (const child of value) {
    collectPositions(child, output);
  }
}

function positionInsideBbox(position: Position, bbox: Bbox) {
  const [lng, lat] = position;

  return lng >= bbox.minLng && lng <= bbox.maxLng && lat >= bbox.minLat && lat <= bbox.maxLat;
}

function boundsIntersectBbox(positions: Position[], bbox: Bbox) {
  if (positions.length === 0) return false;

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const [lng, lat] of positions) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  return minLng <= bbox.maxLng && maxLng >= bbox.minLng && minLat <= bbox.maxLat && maxLat >= bbox.minLat;
}

function geometryIntersectsBbox(geometry: JsonGeometry | null, bbox: Bbox): boolean {
  if (!geometry) return false;

  if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    return geometry.geometries.some((child) => geometryIntersectsBbox(child, bbox));
  }

  const positions: Position[] = [];
  collectPositions(geometry.coordinates, positions);

  if (positions.some((position) => positionInsideBbox(position, bbox))) {
    return true;
  }

  return boundsIntersectBbox(positions, bbox);
}

function safePropertyValue(value: unknown): string | number | boolean | null {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return null;
}

function sanitizeProperties(properties: Record<string, unknown> | null | undefined) {
  if (!properties) return {};

  const allowedKeys = [
    "id",
    "name",
    "Name",
    "NAME",
    "type",
    "Type",
    "TYPE",
    "layer",
    "Layer",
    "zone",
    "Zone",
    "district",
    "District",
    "municipality",
    "Municipality",
    "street",
    "Street",
    "diameter",
    "Diameter",
    "material",
    "Material",
  ];

  const sanitized: Record<string, string | number | boolean | null> = {};

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      sanitized[key] = safePropertyValue(properties[key]);
    }
  }

  return sanitized;
}

function sanitizeFeature(feature: JsonFeature): JsonFeature {
  return {
    type: "Feature",
    id: feature.id,
    geometry: feature.geometry,
    properties: sanitizeProperties(feature.properties),
  };
}

export async function getControlledWaterSegment(
  bbox: Bbox,
  maxFeatures: number,
): Promise<ControlledWaterSegmentResult> {
  const source = await readProtectedMaster();

  const matches = source.collection.features.filter((feature) =>
    geometryIntersectsBbox(feature.geometry, bbox),
  );

  const segment = matches.slice(0, maxFeatures).map(sanitizeFeature);

  return {
    sourceMode: source.sourceMode,
    sourceLabel: source.sourceLabel,
    bbox,
    totalMasterFeatureCount: source.collection.features.length,
    matchingFeatureCount: matches.length,
    segmentCount: segment.length,
    segmentTruncated: matches.length > segment.length,
    collection: {
      type: "FeatureCollection",
      features: segment,
    },
  };
}
