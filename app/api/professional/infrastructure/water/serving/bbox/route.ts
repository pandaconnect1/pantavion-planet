import { NextRequest, NextResponse } from "next/server";

import {
  planControlledWaterServingRequest,
  type PantavionWaterBoundingBox,
  type PantavionWaterServingDecision,
} from "@/core/infrastructure/water/controlled-water-serving-scaffold";

import {
  PANTAVION_WATER_BLOCKED_SPATIAL_INDEX_READINESS,
} from "@/core/infrastructure/water/water-spatial-index";

import {
  PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS,
} from "@/core/infrastructure/water/water-spatial-serving-readiness";

import {
  PANTAVION_WATER_BLOCKED_AUDIT_LOGGING_READINESS,
  createWaterAuditLogRecord,
} from "@/core/infrastructure/water/water-audit-logging";

import {
  PANTAVION_WATER_BLOCKED_ACCESS_CONTROL_READINESS,
} from "@/core/infrastructure/water/water-access-control-readiness";

import {
  PANTAVION_WATER_BLOCKED_AUTHORIZED_PERSON_STORE_READINESS,
  PANTAVION_WATER_DIAGNOSTIC_FOUNDER_ADMIN_RECORD,
} from "@/core/infrastructure/water/water-authorized-person-store";

export const dynamic = "force-dynamic";

const WATER_SERVING_BBOX_ROUTE_VERSION = "water-serving-bbox-route-v1" as const;

const diagnosticRequester = PANTAVION_WATER_DIAGNOSTIC_FOUNDER_ADMIN_RECORD;

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
      accessControlReady: PANTAVION_WATER_BLOCKED_ACCESS_CONTROL_READINESS.accessControlReady,
      founderApprovedProductionActivation:
        PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS.productionActivationAllowed &&
        PANTAVION_WATER_BLOCKED_ACCESS_CONTROL_READINESS.productionAccessAllowed &&
        PANTAVION_WATER_BLOCKED_AUTHORIZED_PERSON_STORE_READINESS.productionStoreAllowed,
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
      authorizedPersonStoreReadiness: PANTAVION_WATER_BLOCKED_AUTHORIZED_PERSON_STORE_READINESS,
      spatialIndexReadiness: PANTAVION_WATER_BLOCKED_SPATIAL_INDEX_READINESS,
      spatialServingReadiness: PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS,
      accessControlReadiness: PANTAVION_WATER_BLOCKED_ACCESS_CONTROL_READINESS,
      auditLoggingReadiness: PANTAVION_WATER_BLOCKED_AUDIT_LOGGING_READINESS,
      diagnosticAuditRecord,
      decision,
    },
    {
      status: 423,
    },
  );
}
