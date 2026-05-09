import { NextRequest, NextResponse } from "next/server";
import {
  getWaterNetworkGeometrySummary,
  readWaterNetworkSource,
  selectWaterNetworkMapFeatures,
} from "@/core/infrastructure/water/cloud-water-network-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 5200;
const MIN_LIMIT = 900;
const MAX_LIMIT = 9000;

function safeLimit(request: NextRequest) {
  const raw = Number.parseInt(request.nextUrl.searchParams.get("limit") || "", 10);

  if (!Number.isFinite(raw)) return DEFAULT_LIMIT;

  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, raw));
}

export async function GET(request: NextRequest) {
  const source = await readWaterNetworkSource();
  const allFeatures = Array.isArray(source.collection.features) ? source.collection.features : [];
  const limit = safeLimit(request);
  const selectedFeatures = selectWaterNetworkMapFeatures(allFeatures, limit);

  const status =
    source.sourceMode === "production_cloud"
      ? "production_private_water_network_active"
      : source.sourceMode === "local_private_file"
        ? "local_private_water_network_active"
        : source.sourceMode === "error"
          ? "private_water_network_source_error"
          : "no_private_processed_layer";

  const statusCode = source.sourceMode === "error" ? 502 : 200;

  return NextResponse.json(
    {
      ...source.collection,
      type: "FeatureCollection",
      features: selectedFeatures,
      pantavion: {
        ...(source.collection.pantavion || {}),
        status,
        authorityOwner: "Γιώργος",
        rawFileExposed: false,
        publicFolder: false,
        sourceMode: source.sourceMode,
        sourceLabel: source.sourceLabel,
        sourceConfigured: source.sourceConfigured,
        sourceError: source.errorMessage || null,
        featureCount: allFeatures.length,
        returnedFeatureCount: selectedFeatures.length,
        serverLimit: limit,
        renderingMode: "production-cloud-or-local-balanced-mobile-preview",
        geometrySummary: getWaterNetworkGeometrySummary(allFeatures),
        productionCloudRequiredForPantavionDotCom: true,
      },
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Data-Source": source.sourceMode,
        "X-Pantavion-Raw-File-Exposed": "false",
        "X-Pantavion-Public-Folder": "false",
        "X-Pantavion-Authority-Owner": "George-Nicolaou",
      },
    }
  );
}