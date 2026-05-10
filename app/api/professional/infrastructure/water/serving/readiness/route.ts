import { NextResponse } from "next/server";

import {
  planControlledWaterServingRequest,
  type PantavionWaterServingDecision,
} from "@/core/infrastructure/water/controlled-water-serving-scaffold";

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

const WATER_SERVING_READINESS_ROUTE_VERSION = "water-serving-readiness-route-v1" as const;

const diagnosticRequester = PANTAVION_WATER_DIAGNOSTIC_FOUNDER_ADMIN_RECORD;

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
      accessControlReady: PANTAVION_WATER_BLOCKED_ACCESS_CONTROL_READINESS.accessControlReady,
      founderApprovedProductionActivation:
        PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS.productionActivationAllowed &&
        PANTAVION_WATER_BLOCKED_ACCESS_CONTROL_READINESS.productionAccessAllowed &&
        PANTAVION_WATER_BLOCKED_AUTHORIZED_PERSON_STORE_READINESS.productionStoreAllowed,
    },
  });

const diagnosticAuditRecord = createWaterAuditLogRecord({
  action: "readiness-check",
  actor: diagnosticRequester,
  route: "/api/professional/infrastructure/water/serving/readiness",
  decisionAllowed: diagnosticDecision.allowed,
  blockers: diagnosticDecision.blockers,
  rawNetworkReturned: false,
  completeNetworkReturned: false,
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
    authorizedPersonStoreReadiness: PANTAVION_WATER_BLOCKED_AUTHORIZED_PERSON_STORE_READINESS,
    spatialServingReadiness: PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS,
    accessControlReadiness: PANTAVION_WATER_BLOCKED_ACCESS_CONTROL_READINESS,
    auditLoggingReadiness: PANTAVION_WATER_BLOCKED_AUDIT_LOGGING_READINESS,
    diagnosticAuditRecord,
    decision: diagnosticDecision,
  });
}
