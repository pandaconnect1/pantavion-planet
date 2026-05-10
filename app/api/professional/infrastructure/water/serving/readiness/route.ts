import { NextResponse } from "next/server";

import {
  planControlledWaterServingRequest,
  type PantavionWaterServingDecision,
} from "@/core/infrastructure/water/controlled-water-serving-scaffold";

import {
  PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS,
} from "@/core/infrastructure/water/water-spatial-serving-readiness";

export const dynamic = "force-dynamic";

const WATER_SERVING_READINESS_ROUTE_VERSION = "water-serving-readiness-route-v1" as const;

const diagnosticRequester = {
  firstName: "Pantavion",
  lastName: "Kernel",
  title: "Controlled serving readiness gate",
  accessLevel: "founder-admin-diagnostic",
  status: "active" as const,
};

const diagnosticDecision: PantavionWaterServingDecision =
  planControlledWaterServingRequest({
    bbox: {
      minLng: -180,
      minLat: -90,
      maxLng: 180,
      maxLat: 90,
    },
    zoom: 0,
    requester: diagnosticRequester,
    readiness: {
      hasWaterKernelConstitution: true,
      hasDataTruthReport: true,
      hasFullMasterStrategy: true,
      hasDataServingStrategy: true,
      hasServingArchitectureDecision: true,
      fullMasterProtected: true,
      spatialServingReady: PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS.spatialServingReady,
      accessControlReady: false,
      founderApprovedProductionActivation:
        PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS.productionActivationAllowed,
    },
  });

export async function GET() {
  return NextResponse.json({
    version: WATER_SERVING_READINESS_ROUTE_VERSION,
    module: "pantavion-water",
    productionServingStatus: "blocked",
    rendererStatus: "blocked",
    dataReturned: false,
    mayReturnRawMaster: false,
    mayReturnCompleteNetwork: false,
    message: "No water network data is returned by this route.",
    activationRule: "Founder/admin approval is required before production activation",
    spatialServingReadiness: PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS,
    decision: diagnosticDecision,
  });
}
