import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      currentVersion: 1,
      serviceDescription:
        "Pantavion Water protected map service. DLS/ArcGIS-style layer service: base map remains independent and protected water geometry is requested only for the visible viewport.",
      mapName: "Pantavion Water",
      spatialReference: { wkid: 4326, latestWkid: 4326 },
      supportedQueryFormats: "JSON, geoJSON",
      supportsDynamicLayers: false,
      maxRecordCount: 1800,
      layers: [
        {
          id: 0,
          name: "Water Network A",
          parentLayerId: -1,
          defaultVisibility: true,
          subLayerIds: null,
          minScale: 0,
          maxScale: 0,
          access: "approved-device-or-water-admin",
          source: "authentic-private-water-index",
        },
      ],
      safety: {
        rawMasterPublicAccess: false,
        wholeNetworkBrowserLoad: false,
        viewportOnly: true,
        failClosed: true,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Pantavion-Water-MapServer": "metadata",
      },
    },
  );
}
