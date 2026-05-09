import { get } from "@vercel/blob";

type WaterCollection = {
  type: "FeatureCollection";
  features: unknown[];
  pantavion?: Record<string, unknown>;
};

export type CloudWaterNetworkResult = {
  ok: boolean;
  sourceMode:
    | "production_cloud"
    | "local_private_file"
    | "not_configured"
    | "error";
  sourceConfigured: boolean;
  sourceLabel: string;
  error?: string;
  errorMessage?: string;
  raw?: string;
  collection: WaterCollection;
  features: unknown[];
  featureCount: number;
  returnedFeatureCount: number;
};

const emptyCollection: WaterCollection = {
  type: "FeatureCollection",
  features: [],
  pantavion: {},
};

function failureResult(
  sourceMode: CloudWaterNetworkResult["sourceMode"],
  sourceConfigured: boolean,
  sourceLabel: string,
  message: string,
): CloudWaterNetworkResult {
  return {
    ok: false,
    sourceMode,
    sourceConfigured,
    sourceLabel,
    error: message,
    errorMessage: message,
    collection: emptyCollection,
    features: [],
    featureCount: 0,
    returnedFeatureCount: 0,
  };
}

export async function readCloudWaterNetworkSource(): Promise<CloudWaterNetworkResult> {
  const url = process.env.PANTAVION_WATER_NETWORK_GEOJSON_URL;
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!url) {
    return failureResult(
      "not_configured",
      false,
      "not_configured",
      "PANTAVION_WATER_NETWORK_GEOJSON_URL is not configured.",
    );
  }

  if (!token) {
    return failureResult(
      "error",
      true,
      "missing_blob_token",
      "BLOB_READ_WRITE_TOKEN is not configured.",
    );
  }

  try {
    const result = await get(url, {
      access: "private",
      token,
    });

    if (!result?.stream) {
      return failureResult(
        "error",
        true,
        "invalid_blob_stream",
        "Private blob source returned no readable stream.",
      );
    }

    const raw = await new Response(result.stream).text();
    const parsed = JSON.parse(raw);
    const features = Array.isArray(parsed?.features) ? parsed.features : [];

    const collection: WaterCollection = {
      type: "FeatureCollection",
      ...parsed,
      features,
      pantavion:
        parsed && typeof parsed.pantavion === "object" && parsed.pantavion !== null
          ? parsed.pantavion
          : {},
    };

    return {
      ok: true,
      sourceMode: "production_cloud",
      sourceConfigured: true,
      sourceLabel: "vercel_blob_private",
      raw,
      collection,
      features,
      featureCount: features.length,
      returnedFeatureCount: features.length,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown cloud water network source error.";

    return failureResult("error", true, "cloud_read_error", message);
  }
}

export async function readWaterNetworkSource(): Promise<CloudWaterNetworkResult> {
  return readCloudWaterNetworkSource();
}

export function getWaterNetworkGeometrySummary(features?: unknown[]) {
  return {
    featureCount: Array.isArray(features) ? features.length : 0,
    returnedFeatureCount: Array.isArray(features) ? features.length : 0,
  };
}

export function selectWaterNetworkMapFeatures(
  features?: unknown[],
  limit?: number,
) {
  const safeFeatures = Array.isArray(features) ? features : [];

  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) {
    return safeFeatures;
  }

  return safeFeatures.slice(0, limit);
}
