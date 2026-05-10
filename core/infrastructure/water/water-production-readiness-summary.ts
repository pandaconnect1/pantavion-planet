import * as AuthorizedPersonStore from "./water-authorized-person-store";
import * as SpatialIndex from "./water-spatial-index";
import * as BboxQueryProvider from "./water-bbox-query-provider";
import * as AccessFiltering from "./water-access-filtering";
import * as TargetViewport from "./water-target-viewport";
import * as AuditDurableSink from "./water-audit-durable-sink";
import * as AuditLogging from "./water-audit-logging";
import * as AccessControl from "./water-access-control-readiness";
import * as SpatialServing from "./water-spatial-serving-readiness";

export const WATER_PRODUCTION_READINESS_SUMMARY_MARKER =
  "water_production_readiness_summary_v1";

export const WATER_PRODUCTION_READINESS_SUMMARY_GATE_VERSION =
  "water_kernel_gate_v21";

type ReadinessModule = Record<string, unknown>;

export type WaterProductionReadinessSummary = {
  marker: typeof WATER_PRODUCTION_READINESS_SUMMARY_MARKER;
  gateVersion: typeof WATER_PRODUCTION_READINESS_SUMMARY_GATE_VERSION;
  status: "blocked";
  overallReady: false;
  productionActivationAllowed: false;
  noDataReturned: true;
  dataReturned: false;
  mayReturnRawMaster: false;
  mayReturnCompleteNetwork: false;
  mayLoadFullNetworkInBrowser: false;
  authorizedPersonStoreReadiness: unknown;
  spatialIndexReadiness: unknown;
  bboxQueryProviderReadiness: unknown;
  accessFilteringReadiness: unknown;
  targetViewportReadiness: unknown;
  auditDurableSinkReadiness: unknown;
  auditLoggingReadiness: unknown;
  accessControlReadiness: unknown;
  spatialServingReadiness: unknown;
  blockers: string[];
  presentationSummary: string[];
  requiredBeforeProduction: string[];
};

function valueFromModule<T>(
  moduleObject: ReadinessModule,
  candidateExportNames: string[],
  fallback: T,
): T {
  for (const exportName of candidateExportNames) {
    const value = moduleObject[exportName];

    if (typeof value !== "undefined") {
      return value as T;
    }
  }

  if (typeof moduleObject.default !== "undefined") {
    return moduleObject.default as T;
  }

  return fallback;
}

function blockedFallback(component: string): Record<string, unknown> {
  return {
    component,
    ready: false,
    productionAllowed: false,
    status: "blocked",
    blocker:
      "Production use is blocked until the required durable provider, audit, access, and founder/admin approval contracts are complete.",
  };
}

export function getWaterProductionReadinessSummary(): WaterProductionReadinessSummary {
  const authorizedPersonStoreReadiness = valueFromModule(
    AuthorizedPersonStore as ReadinessModule,
    [
      "authorizedPersonStoreReadiness",
      "waterAuthorizedPersonStoreReadiness",
      "AUTHORIZED_PERSON_STORE_READINESS",
    ],
    blockedFallback("authorized-person-store"),
  );

  const spatialIndexReadiness = valueFromModule(
    SpatialIndex as ReadinessModule,
    [
      "spatialIndexReadiness",
      "waterSpatialIndexReadiness",
      "WATER_SPATIAL_INDEX_READINESS",
    ],
    blockedFallback("spatial-index"),
  );

  const bboxQueryProviderReadiness = valueFromModule(
    BboxQueryProvider as ReadinessModule,
    [
      "bboxQueryProviderReadiness",
      "waterBboxQueryProviderReadiness",
      "WATER_BBOX_QUERY_PROVIDER_READINESS",
    ],
    blockedFallback("bbox-query-provider"),
  );

  const accessFilteringReadiness = valueFromModule(
    AccessFiltering as ReadinessModule,
    [
      "accessFilteringReadiness",
      "waterAccessFilteringReadiness",
      "WATER_ACCESS_FILTERING_READINESS",
    ],
    blockedFallback("access-filtering"),
  );

  const targetViewportReadiness = valueFromModule(
    TargetViewport as ReadinessModule,
    [
      "targetViewportReadiness",
      "waterTargetViewportReadiness",
      "WATER_TARGET_VIEWPORT_READINESS",
    ],
    blockedFallback("target-viewport"),
  );

  const auditDurableSinkReadiness = valueFromModule(
    AuditDurableSink as ReadinessModule,
    [
      "auditDurableSinkReadiness",
      "waterAuditDurableSinkReadiness",
      "WATER_AUDIT_DURABLE_SINK_READINESS",
    ],
    blockedFallback("audit-durable-sink"),
  );

  const auditLoggingReadiness = valueFromModule(
    AuditLogging as ReadinessModule,
    [
      "auditLoggingReadiness",
      "waterAuditLoggingReadiness",
      "WATER_AUDIT_LOGGING_READINESS",
    ],
    blockedFallback("audit-logging"),
  );

  const accessControlReadiness = valueFromModule(
    AccessControl as ReadinessModule,
    [
      "accessControlReadiness",
      "waterAccessControlReadiness",
      "WATER_ACCESS_CONTROL_READINESS",
    ],
    blockedFallback("access-control"),
  );

  const spatialServingReadiness = valueFromModule(
    SpatialServing as ReadinessModule,
    [
      "spatialServingReadiness",
      "waterSpatialServingReadiness",
      "WATER_SPATIAL_SERVING_READINESS",
    ],
    blockedFallback("spatial-serving"),
  );

  return {
    marker: WATER_PRODUCTION_READINESS_SUMMARY_MARKER,
    gateVersion: WATER_PRODUCTION_READINESS_SUMMARY_GATE_VERSION,
    status: "blocked",
    overallReady: false,
    productionActivationAllowed: false,
    noDataReturned: true,
    dataReturned: false,
    mayReturnRawMaster: false,
    mayReturnCompleteNetwork: false,
    mayLoadFullNetworkInBrowser: false,

    authorizedPersonStoreReadiness,
    spatialIndexReadiness,
    bboxQueryProviderReadiness,
    accessFilteringReadiness,
    targetViewportReadiness,
    auditDurableSinkReadiness,
    auditLoggingReadiness,
    accessControlReadiness,
    spatialServingReadiness,

    blockers: [
      "Production activation is blocked by design.",
      "The full master water network must remain protected and complete.",
      "The browser must never receive the full raw network.",
      "Sampling or mobile preview files cannot be treated as final production truth.",
      "A real spatial index built from the complete protected master is required.",
      "A real server-side bbox query provider is required.",
      "Viewport-scoped access filtering is required before serving any segment.",
      "A durable authorized-person store is required.",
      "A durable append-only encrypted audit sink is required.",
      "Founder/admin approval is required before production activation.",
      "Ambiguous address search must require selectedCandidateId before bbox derivation.",
    ],

    presentationSummary: [
      "The Pantavion Water Module does not load the full water network in the browser.",
      "The complete master network remains protected and is not exposed as public geodata.",
      "The map will request only a controlled segment for current location, address search, manual pan/zoom, or founder/admin selected area.",
      "Address search cannot auto-pick ambiguous street names or repeated addresses.",
      "A selected candidate and target viewport are required before controlled bbox serving.",
      "Production data serving remains blocked until spatial index, bbox provider, access filtering, durable audit sink, authorized-person store, and founder/admin approval exist.",
    ],

    requiredBeforeProduction: [
      "protected full master source",
      "spatial index built from complete master",
      "bbox query provider backed by complete index",
      "strict bbox validation",
      "viewport limit and zoom limit",
      "address candidate disambiguation",
      "access filtering",
      "authorized-person store",
      "durable audit sink",
      "founder/admin approval",
    ],
  };
}
