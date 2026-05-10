import { NextRequest, NextResponse } from "next/server";

import {
  planControlledWaterServingRequest,
  type PantavionWaterBoundingBox,
  type PantavionWaterServingDecision,
} from "@/core/infrastructure/water/controlled-water-serving-scaffold";

import {
  PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS,
} from "@/core/infrastructure/water/water-spatial-serving-readiness";

import {
  PANTAVION_WATER_BLOCKED_AUDIT_LOGGING_READINESS,
  createWaterAuditLogRecord,
} from "@/core/infrastructure/water/water-audit-logging";

export const dynamic = "force-dynamic";

const WATER_SERVING_BBOX_ROUTE_VERSION = "water-serving-bbox-route-v1" as const;

const diagnosticRequester = {
  firstName: "Pantavion",
  lastName: "Kernel",
  title: "Controlled bbox serving gate",
  accessLevel: "founder-admin-diagnostic",
  status: "active" as const,
};

function readNumber(searchParams: URLSearchParams, key: string): number | null {
  const raw = searchParams.get(key);

  if (raw === null || raw.trim().length === 0) {
    return null;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const parsed = {
    minLng: readNumber(searchParams, "minLng"),
    minLat: readNumber(searchParams, "minLat"),
    maxLng: readNumber(searchParams, "maxLng"),
    maxLat: readNumber(searchParams, "maxLat"),
    zoom: readNumber(searchParams, "zoom"),
  };

  const missingParameters = Object.entries(parsed)
    .filter(([, value]) => value === null)
    .map(([key]) => key);

  const bbox: PantavionWaterBoundingBox = {
    minLng: parsed.minLng ?? Number.NaN,
    minLat: parsed.minLat ?? Number.NaN,
    maxLng: parsed.maxLng ?? Number.NaN,
    maxLat: parsed.maxLat ?? Number.NaN,
  };

  const zoom = parsed.zoom ?? Number.NaN;

  const decision: PantavionWaterServingDecision = planControlledWaterServingRequest({
    bbox,
    zoom,
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

  const diagnosticAuditRecord = createWaterAuditLogRecord({
    action: "bbox-request",
    actor: diagnosticRequester,
    route: "/api/professional/infrastructure/water/serving/bbox",
    bbox,
    zoom,
    decisionAllowed: decision.allowed,
    blockers: decision.blockers,
    rawNetworkReturned: false,
    completeNetworkReturned: false,
  });

  return NextResponse.json(
    {
      version: WATER_SERVING_BBOX_ROUTE_VERSION,
      module: "pantavion-water",
      productionServingStatus: "blocked",
      rendererStatus: "blocked",
      dataReturned: false,
      mayReturnRawMaster: false,
      mayReturnCompleteNetwork: false,
      servingPattern: "bbox-api",
      requestedViewport: {
        bbox,
        zoom,
      },
      missingParameters,
      message: "No water network data is returned by this bbox route.",
      activationRule: "Founder/admin approval is required before production activation",
      spatialServingReadiness: PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS,
      auditLoggingReadiness: PANTAVION_WATER_BLOCKED_AUDIT_LOGGING_READINESS,
      diagnosticAuditRecord,
      decision,
    },
    {
      status: 423,
    },
  );
}
