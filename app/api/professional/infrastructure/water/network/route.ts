import { existsSync, readFileSync } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WaterFeature = {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

type WaterCollection = {
  type?: string;
  features?: WaterFeature[];
  pantavion?: Record<string, unknown>;
};

const DEFAULT_LIMIT = 2600;
const MIN_LIMIT = 400;
const MAX_LIMIT = 5200;

const emptyCollection = {
  type: "FeatureCollection",
  features: [],
  pantavion: {
    status: "no_private_processed_layer",
    message:
      "Δεν υπάρχει ακόμα επεξεργασμένο ιδιωτικό layer ύδρευσης. Βάλε ιδιωτικό KML/KMZ στο private-infrastructure/water-network/original/ και τρέξε scripts/pantavion-water-kml-to-geojson.cjs.",
    rawFileExposed: false,
    publicFolder: false,
    authorityOwner: "Γιώργος",
  },
};

function safeLimit(request: NextRequest) {
  const raw = Number.parseInt(request.nextUrl.searchParams.get("limit") || "", 10);

  if (!Number.isFinite(raw)) return DEFAULT_LIMIT;

  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, raw));
}

function featureRank(feature: WaterFeature) {
  const geometryType = feature.geometry?.type || "";
  const assetType = String(feature.properties?.pantavionAssetType || "").toLowerCase();

  if (geometryType === "LineString" && assetType.includes("central")) return 0;
  if (geometryType === "LineString") return 1;
  if (geometryType === "Polygon") return 2;
  if (geometryType === "Point" && assetType.includes("valve")) return 3;
  if (geometryType === "Point") return 4;

  return 9;
}

function selectMapFeatures(features: WaterFeature[], limit: number) {
  return features
    .filter((feature) => feature && feature.geometry && feature.geometry.coordinates)
    .sort((a, b) => featureRank(a) - featureRank(b))
    .slice(0, limit);
}

export async function GET(request: NextRequest) {
  const filePath = path.join(
    process.cwd(),
    "data",
    "water-network-private",
    "processed",
    "water-network.geojson"
  );

  if (!existsSync(filePath)) {
    return NextResponse.json(emptyCollection, {
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Data-Source": "private-water-network-missing",
      },
    });
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as WaterCollection;
    const allFeatures = Array.isArray(parsed.features) ? parsed.features : [];
    const limit = safeLimit(request);
    const selectedFeatures = selectMapFeatures(allFeatures, limit);

    return NextResponse.json(
      {
        ...parsed,
        features: selectedFeatures,
        pantavion: {
          ...(parsed.pantavion || {}),
          status: "private_water_network_preview_active",
          authorityOwner: "Γιώργος",
          rawFileExposed: false,
          publicFolder: false,
          featureCount: allFeatures.length,
          returnedFeatureCount: selectedFeatures.length,
          serverLimit: limit,
          renderingMode: "server-capped-line-first-mobile-view",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Data-Source": "private-processed-water-network",
          "X-Pantavion-Raw-File-Exposed": "false",
          "X-Pantavion-Public-Folder": "false",
          "X-Pantavion-Authority-Owner": "George-Nicolaou",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        ...emptyCollection,
        pantavion: {
          ...emptyCollection.pantavion,
          status: "private_processed_layer_read_error",
        },
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Data-Source": "private-water-network-error",
        },
      }
    );
  }
}