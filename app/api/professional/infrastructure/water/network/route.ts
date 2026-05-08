import { existsSync, readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emptyCollection = {
  type: "FeatureCollection",
  features: [],
  pantavion: {
    status: "no_private_processed_layer",
    message:
      "No processed private water-network layer exists yet. Place a private KML/KMZ in private-infrastructure/water-network/original/ and run scripts/pantavion-water-kml-to-geojson.cjs.",
    rawFileExposed: false,
  },
};

export async function GET() {
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
    const parsed = JSON.parse(readFileSync(filePath, "utf8"));

    return NextResponse.json(parsed, {
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Data-Source": "private-processed-water-network",
        "X-Pantavion-Raw-File-Exposed": "false",
      },
    });
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
