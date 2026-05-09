import { existsSync, readFileSync } from "fs";
import path from "path";

export type WaterGeometry = {
  type?: string;
  coordinates?: unknown;
  geometries?: WaterGeometry[];
};

export type WaterFeature = {
  type?: string;
  geometry?: WaterGeometry;
  properties?: Record<string, unknown>;
};

export type WaterCollection = {
  type?: string;
  features?: WaterFeature[];
  pantavion?: Record<string, unknown>;
};

export type WaterNetworkSourceResult = {
  collection: WaterCollection;
  sourceMode: "production_cloud" | "local_private_file" | "missing" | "error";
  sourceLabel: string;
  sourceConfigured: boolean;
  errorMessage?: string;
};

const localMobilePath = path.join(
  process.cwd(),
  "data",
  "water-network-private",
  "mobile",
  "water-network-mobile.geojson"
);

const localProcessedPath = path.join(
  process.cwd(),
  "data",
  "water-network-private",
  "processed",
  "water-network.geojson"
);

export const emptyWaterNetworkCollection: WaterCollection = {
  type: "FeatureCollection",
  features: [],
  pantavion: {
    status: "no_private_processed_layer",
    message:
      "Î”ÎµÎ½ Ï…Ï€Î¬ÏÏ‡ÎµÎ¹ Î±ÎºÏŒÎ¼Î± ÎµÎ½ÎµÏÎ³ÏŒ production private cloud layer ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚. Î¤Î¿ Pantavion.com Î´ÎµÎ½ Î¼Ï€Î¿ÏÎµÎ¯ Î½Î± Î´Î¹Î±Î²Î¬ÏƒÎµÎ¹ Ï„Î¿Ï€Î¹ÎºÎ¬ Î±ÏÏ‡ÎµÎ¯Î± Î±Ï€ÏŒ PC. Î“Î¹Î± production Ï€ÏÎ­Ï€ÎµÎ¹ Î½Î± ÏÏ…Î¸Î¼Î¹ÏƒÏ„ÎµÎ¯ PANTAVION_WATER_NETWORK_GEOJSON_URL ÏƒÎµ private cloud/object storage ÎºÎ±Î¹ Î½Î± Î³Î¯Î½ÎµÎ¹ redeploy.",
    rawFileExposed: false,
    publicFolder: false,
    authorityOwner: "Î“Î¹ÏŽÏÎ³Î¿Ï‚",
  },
};

function parseCollection(raw: string): WaterCollection {
  const parsed = JSON.parse(raw) as WaterCollection;

  return {
    ...parsed,
    type: "FeatureCollection",
    features: Array.isArray(parsed.features) ? parsed.features : [],
    pantavion: parsed.pantavion || {},
  };
}

async function readCloudCollection(): Promise<WaterNetworkSourceResult | null> {
  const url = process.env.PANTAVION_WATER_NETWORK_GEOJSON_URL;
  const token =
    process.env.PANTAVION_WATER_NETWORK_GEOJSON_BEARER_TOKEN ||
    process.env.BLOB_READ_WRITE_TOKEN;

  if (!url) return null;

  try {
    const result = await get(url, {
      access: "private",
      token,
    });

    if (!result || result.statusCode !== 200) {
      return {
        collection: emptyWaterNetworkCollection,
        sourceMode: "error",
        sourceLabel: "production private cloud GeoJSON",
        sourceConfigured: true,
        errorMessage: `Private Blob source returned HTTP ${result?.statusCode || "unknown"}`,
      };
    }

    const raw = await result.blob.text();
    const collection = parseCollection(raw);

    return {
      collection,
      sourceMode: "production_cloud",
      sourceLabel: "production private cloud GeoJSON",
      sourceConfigured: true,
    };
  } catch (error) {
    return {
      collection: emptyWaterNetworkCollection,
      sourceMode: "error",
      sourceLabel: "production private cloud GeoJSON",
      sourceConfigured: true,
      errorMessage: error instanceof Error ? error.message : "Unknown private Blob read error",
    };
  }
}

function readLocalCollection(): WaterNetworkSourceResult {
  const hasMobile = existsSync(localMobilePath);
  const hasProcessed = existsSync(localProcessedPath);

  if (!hasMobile && !hasProcessed) {
    return {
      collection: emptyWaterNetworkCollection,
      sourceMode: "missing",
      sourceLabel: "missing production cloud source and missing local private GeoJSON",
      sourceConfigured: false,
    };
  }

  const preferredLocalPath = hasMobile ? localMobilePath : localProcessedPath;
  const preferredLocalLabel = hasMobile
    ? "local private mobile GeoJSON preview"
    : "local private processed GeoJSON fallback";

  try {
    const collection = parseCollection(readFileSync(preferredLocalPath, "utf8"));

    return {
      collection,
      sourceMode: "local_private_file",
      sourceLabel: preferredLocalLabel,
      sourceConfigured: true,
    };
  } catch (error) {
    return {
      collection: emptyWaterNetworkCollection,
      sourceMode: "error",
      sourceLabel: preferredLocalLabel,
      sourceConfigured: true,
      errorMessage: error instanceof Error ? error.message : "Unknown local read error",
    };
  }
}

export async function readWaterNetworkSource(): Promise<WaterNetworkSourceResult> {
  const cloudResult = await readCloudCollection();

  if (cloudResult) return cloudResult;

  return readLocalCollection();
}

function geometryFamily(feature: WaterFeature): "line" | "polygon" | "point" | "other" {
  const geometry = feature.geometry;
  const type = geometry?.type || "";

  if (type === "LineString" || type === "MultiLineString") return "line";
  if (type === "Polygon" || type === "MultiPolygon") return "polygon";
  if (type === "Point" || type === "MultiPoint") return "point";

  const childGeometries = geometry?.geometries;

  if (type === "GeometryCollection" && Array.isArray(childGeometries)) {
    const childTypes = childGeometries.map((child) => child.type || "");

    if (childTypes.some((childType) => childType === "LineString" || childType === "MultiLineString")) {
      return "line";
    }

    if (childTypes.some((childType) => childType === "Polygon" || childType === "MultiPolygon")) {
      return "polygon";
    }

    if (childTypes.some((childType) => childType === "Point" || childType === "MultiPoint")) {
      return "point";
    }
  }

  return "other";
}

function evenlyPick<T>(items: T[], count: number): T[] {
  if (count <= 0) return [];
  if (items.length <= count) return items;

  const selected: T[] = [];
  const step = (items.length - 1) / (count - 1);

  for (let index = 0; index < count; index += 1) {
    selected.push(items[Math.round(index * step)]);
  }

  return selected;
}

export function selectWaterNetworkMapFeatures(features: WaterFeature[], limit: number) {
  const lines: WaterFeature[] = [];
  const polygons: WaterFeature[] = [];
  const points: WaterFeature[] = [];
  const other: WaterFeature[] = [];

  for (const feature of features) {
    if (!feature || !feature.geometry) continue;

    const family = geometryFamily(feature);

    if (family === "line") lines.push(feature);
    else if (family === "polygon") polygons.push(feature);
    else if (family === "point") points.push(feature);
    else other.push(feature);
  }

  const lineTarget = Math.ceil(limit * 0.72);
  const polygonTarget = Math.ceil(limit * 0.16);
  const pointTarget = Math.ceil(limit * 0.1);
  const otherTarget = Math.max(0, limit - lineTarget - polygonTarget - pointTarget);

  return [
    ...evenlyPick(lines, lineTarget),
    ...evenlyPick(polygons, polygonTarget),
    ...evenlyPick(points, pointTarget),
    ...evenlyPick(other, otherTarget),
  ].slice(0, limit);
}

export function getWaterNetworkGeometrySummary(features: WaterFeature[]) {
  const summary: Record<string, number> = {};

  for (const feature of features) {
    const type = feature.geometry?.type || "unknown";
    summary[type] = (summary[type] || 0) + 1;
  }

  return summary;
}
