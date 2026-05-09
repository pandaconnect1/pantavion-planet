import { NextResponse } from "next/server";
import {
  getWaterNetworkGeometrySummary,
  readWaterNetworkSource,
} from "@/core/infrastructure/water/cloud-water-network-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const source = await readWaterNetworkSource();
  const features = Array.isArray(source.collection.features) ? source.collection.features : [];

  return NextResponse.json(
    {
      ok: source.sourceMode === "production_cloud" || source.sourceMode === "local_private_file",
      sourceMode: source.sourceMode,
      sourceLabel: source.sourceLabel,
      sourceConfigured: source.sourceConfigured,
      sourceError: source.errorMessage || null,
      featureCount: features.length,
      geometrySummary: getWaterNetworkGeometrySummary(features),
      pantavion: {
        authorityOwner: "Γιώργος",
        rawFileExposed: false,
        publicFolder: false,
        productionCloudUrlConfigured: Boolean(process.env.PANTAVION_WATER_NETWORK_GEOJSON_URL),
        bearerTokenConfigured: Boolean(process.env.PANTAVION_WATER_NETWORK_GEOJSON_BEARER_TOKEN),
        message:
          source.sourceMode === "production_cloud"
            ? "Το Pantavion.com διαβάζει παραγωγικό private cloud layer."
            : source.sourceMode === "local_private_file"
              ? "Το local development διαβάζει τοπικό private processed GeoJSON. Το Pantavion.com χρειάζεται cloud env URL."
              : "Δεν έχει ρυθμιστεί production private cloud layer.",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Water-Network-Status": source.sourceMode,
      },
    }
  );
}