export const WATER_FOUNDER_SOURCE_VAULT_VERSION = "2026-05-22.v1";

export const WATER_SOURCE_KINDS = [
  "dwg",
  "dxf",
  "kmz",
  "kml",
  "geojson",
  "geopackage",
  "shapefile",
  "pdf",
  "scanner_report",
  "photo",
  "video",
  "voice_note",
  "telemetry_export",
  "satellite_indicator",
  "contractor_as_built_file",
] as const;

export const WATER_SOURCE_STATUSES = [
  "received",
  "private_source",
  "pending_inspection",
  "pending_extraction",
  "processing",
  "preview_ready",
  "founder_review",
  "approved_layer_ready",
  "published_to_users",
  "archived",
] as const;

export type WaterSourceKind = (typeof WATER_SOURCE_KINDS)[number];
export type WaterSourceStatus = (typeof WATER_SOURCE_STATUSES)[number];

export type WaterFounderSourceVaultItem = {
  id: string;
  kind: WaterSourceKind;
  status: WaterSourceStatus;
  title: string;
  originalFileName?: string;
  privateStorageRef?: string;
  submittedBy?: string;
  createdAt: string;
  updatedAt: string;
  areaLabel?: string;
  notes?: string;
  derivedLayerRefs: string[];
  founderApproved: boolean;
  publicRawAccessAllowed: false;
  githubRawStorageAllowed: false;
  browserRawLoadingAllowed: false;
};

export const WATER_FOUNDER_SOURCE_VAULT_RULES = {
  version: WATER_FOUNDER_SOURCE_VAULT_VERSION,
  founderOnly: true,
  rawSourcesStayPrivate: true,
  rawSourcesMayNotBePublic: true,
  rawSourcesMayNotBeCommittedToGitHub: true,
  rawSourcesMayNotBeBundledInApp: true,
  rawSourcesMayNotLoadDirectlyInBrowser: true,
  derivedLayersRequiredForUsers: true,
  founderApprovalRequiredBeforePublishing: true,
  provenanceRequired: true,
  versioningRequired: true,
  rollbackRequired: true,
} as const;

export function createWaterFounderSourceVaultItem(input: {
  id: string;
  kind: WaterSourceKind;
  title: string;
  originalFileName?: string;
  privateStorageRef?: string;
  submittedBy?: string;
  areaLabel?: string;
  notes?: string;
  createdAt?: string;
}): WaterFounderSourceVaultItem {
  const now = input.createdAt || new Date().toISOString();

  return {
    id: input.id,
    kind: input.kind,
    status: "received",
    title: input.title,
    originalFileName: input.originalFileName,
    privateStorageRef: input.privateStorageRef,
    submittedBy: input.submittedBy,
    createdAt: now,
    updatedAt: now,
    areaLabel: input.areaLabel,
    notes: input.notes,
    derivedLayerRefs: [],
    founderApproved: false,
    publicRawAccessAllowed: false,
    githubRawStorageAllowed: false,
    browserRawLoadingAllowed: false,
  };
}

export function canPublishWaterSourceToUsers(item: WaterFounderSourceVaultItem) {
  return (
    item.status === "approved_layer_ready" &&
    item.founderApproved === true &&
    item.derivedLayerRefs.length > 0 &&
    item.publicRawAccessAllowed === false &&
    item.githubRawStorageAllowed === false &&
    item.browserRawLoadingAllowed === false
  );
}