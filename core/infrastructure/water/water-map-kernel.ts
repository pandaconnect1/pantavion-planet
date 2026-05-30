export type PantavionWaterMapSurfaceKey =
  | "a-operational-map"
  | "b-source-map"
  | "c-intelligence-map";

export interface PantavionWaterMapSurfaceContract {
  key: PantavionWaterMapSurfaceKey;
  title: string;
  route: string;
  purpose: string;
  mustShowWaterNetwork: true;
  mayShowDerivedLayers: true;
  mayExposeRawDwg: false;
  mayMutateMasterDirectly: false;
  founderApprovalRequiredForMasterChange: true;
  connectedToWaterHistoryLedger: boolean;
  connectedToEvidenceInbox: boolean;
  connectedToQgisImport: boolean;
  connectedToDailyChangeReview: boolean;
}

export interface PantavionWaterMapKernelReport {
  ok: true;
  marker: "pantavion_water_map_kernel_v1";
  status: "water-kernel-registered";
  generatedAt: string;
  doctrine: {
    waterHasSeparateKernel: true;
    guardianKernelCoordinatesWaterKernel: true;
    eachSectionHasOwnKernel: true;
    aMapIsOperationalTruth: true;
    bMapIsSourceAndDwgQgisProof: true;
    cMapIsIntelligenceEvidenceHistoryApproval: true;
    noRawDwgPublicExposure: true;
    noDirectUserMasterMutation: true;
    founderApprovalRequired: true;
  };
  mapSurfaces: PantavionWaterMapSurfaceContract[];
  nextRequiredConnections: string[];
}

export function createPantavionWaterMapKernelReport(): PantavionWaterMapKernelReport {
  const generatedAt = new Date().toISOString();

  return {
    ok: true,
    marker: "pantavion_water_map_kernel_v1",
    status: "water-kernel-registered",
    generatedAt,
    doctrine: {
      waterHasSeparateKernel: true,
      guardianKernelCoordinatesWaterKernel: true,
      eachSectionHasOwnKernel: true,
      aMapIsOperationalTruth: true,
      bMapIsSourceAndDwgQgisProof: true,
      cMapIsIntelligenceEvidenceHistoryApproval: true,
      noRawDwgPublicExposure: true,
      noDirectUserMasterMutation: true,
      founderApprovalRequired: true,
    },
    mapSurfaces: [
      {
        key: "a-operational-map",
        title: "A Map — Operational Water Network",
        route: "/professional/infrastructure/water",
        purpose:
          "Daily operational water map. It must show the protected water network and approved field history overlays.",
        mustShowWaterNetwork: true,
        mayShowDerivedLayers: true,
        mayExposeRawDwg: false,
        mayMutateMasterDirectly: false,
        founderApprovalRequiredForMasterChange: true,
        connectedToWaterHistoryLedger: true,
        connectedToEvidenceInbox: false,
        connectedToQgisImport: false,
        connectedToDailyChangeReview: true,
      },
      {
        key: "b-source-map",
        title: "B Map — Source / DWG / QGIS Proof",
        route: "/professional/infrastructure/water/master-dwg",
        purpose:
          "Private source proof map for DWG/QGIS/source validation. Raw DWG remains protected and is not exposed publicly.",
        mustShowWaterNetwork: true,
        mayShowDerivedLayers: true,
        mayExposeRawDwg: false,
        mayMutateMasterDirectly: false,
        founderApprovalRequiredForMasterChange: true,
        connectedToWaterHistoryLedger: true,
        connectedToEvidenceInbox: true,
        connectedToQgisImport: true,
        connectedToDailyChangeReview: true,
      },
      {
        key: "c-intelligence-map",
        title: "C Map — Intelligence / Evidence / Street History",
        route: "/professional/infrastructure/water/intelligence",
        purpose:
          "AI-supervised intelligence map for evidence inbox, street history, scanner/PDF/photo/audio notes, approvals, and daily change review.",
        mustShowWaterNetwork: true,
        mayShowDerivedLayers: true,
        mayExposeRawDwg: false,
        mayMutateMasterDirectly: false,
        founderApprovalRequiredForMasterChange: true,
        connectedToWaterHistoryLedger: true,
        connectedToEvidenceInbox: true,
        connectedToQgisImport: true,
        connectedToDailyChangeReview: true,
      },
    ],
    nextRequiredConnections: [
      "show-water-map-kernel-status-on-a-map",
      "show-water-map-kernel-status-on-b-map",
      "show-water-map-kernel-status-on-c-map",
      "connect-c-map-to-evidence-inbox",
      "connect-street-search-to-history-ledger",
      "connect-qgis-import-to-source-review",
      "connect-daily-changes-to-founder-approval",
    ],
  };
}
