import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WATER_SERVING_READINESS_ROUTE_VERSION = "water-serving-readiness-route-v2" as const;

export async function GET() {
  return NextResponse.json(
    {
      version: WATER_SERVING_READINESS_ROUTE_VERSION,
      module: "pantavion-water",
      productionServingStatus: "protected-operational",
      rendererStatus: "authorized-users-only",
      dataReturned: false,
      servingRoute: "/api/professional/infrastructure/water/segment/bbox",
      accessModel: "founder-admin-session-or-approved-device",
      adminEditFlow: "/professional/infrastructure/water/admin/changes",
      mayReturnRawMaster: false,
      mayReturnCompleteNetwork: false,
      browserFullNetworkAllowed: false,
      rawMasterPublicExposureAllowed: false,
      message:
        "Readiness is operational for protected segmented serving. This readiness endpoint itself returns no water-network payload.",
      founderDirective:
        "Private/protected Water maps remain operational for authorized users and editable/reviewable by founder/admin.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Water-Serving": "protected-operational",
      },
    },
  );
}
