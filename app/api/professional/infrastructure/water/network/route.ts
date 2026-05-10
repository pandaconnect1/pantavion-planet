import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEGACY_WATER_NETWORK_ENDPOINT_BLOCKED_MARKER =
  "legacy_water_network_endpoint_blocked_v1";

export async function GET() {
  return NextResponse.json(
    {
      marker: LEGACY_WATER_NETWORK_ENDPOINT_BLOCKED_MARKER,
      status: "blocked",
      productionServingStatus: "blocked",
      rendererStatus: "blocked",
      reason:
        "Legacy network endpoint is disabled. Full, sampled, preview, or mobile water network payloads must not be returned to the browser. Use readiness, target viewport, address candidates, and controlled bbox contracts only.",
      dataReturned: false,
      noDataReturned: true,
      waterNetworkDataReturned: false,
      noWaterNetworkDataReturned: true,
      featuresReturned: 0,
      mayReturnRawMaster: false,
      mayReturnCompleteNetwork: false,
      mayReturnPreviewAsProduction: false,
      mayReturnSampleAsFinal: false,
      mayLoadFullNetworkInBrowser: false,
      mayUseLegacyRenderer: false,
      requiredPresentationRoute: "/professional/infrastructure/water/readiness",
      allowedContracts: [
        "/api/professional/infrastructure/water/production-readiness",
        "/api/professional/infrastructure/water/address/candidates",
        "/api/professional/infrastructure/water/serving/readiness",
        "/api/professional/infrastructure/water/serving/bbox"
      ],
      blockers: [
        "real spatial index required",
        "server-side bbox provider required",
        "viewport-scoped access filtering required",
        "durable authorized-person store required",
        "durable append-only audit sink required",
        "address candidate disambiguation required",
        "founder/admin approval required"
      ]
    },
    {
      status: 423,
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Water-Network-Endpoint": "blocked",
        "X-Pantavion-Data-Returned": "false",
        "X-Pantavion-Raw-Master": "blocked",
        "X-Pantavion-Complete-Network": "blocked",
        "X-Pantavion-Legacy-Renderer": "disabled"
      }
    }
  );
}
