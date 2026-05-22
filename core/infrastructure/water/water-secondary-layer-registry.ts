export const WATER_SECONDARY_LAYER_REGISTRY_VERSION = "2026-05-22.v1";

export const WATER_SECONDARY_LAYER_KINDS = [
  "pressure_zone",
  "dma_sector",
  "valve_layer",
  "hydrant_layer",
  "reservoir_layer",
  "pump_layer",
  "borehole_layer",
  "critical_customer_layer",
  "maintenance_overlay",
  "fault_overlay",
  "contamination_risk_overlay",
  "flood_risk_overlay",
  "landslide_risk_overlay",
  "fire_response_overlay",
  "satellite_overlay",
  "ai_derived_overlay",
  "founder_private_overlay",
] as const;

export const WATER_LAYER_VISIBILITY = [
  "founder_only",
  "admin_only",
  "approved_users",
  "field_users_safe",
] as const;

export const WATER_LAYER_SENSITIVITY = [
  "public_safe",
  "restricted",
  "sensitive",
  "critical_infrastructure",
] as const;

export const WATER_LAYER_APPROVAL_STATUS = [
  "draft",
  "pending_founder_approval",
  "founder_approved",
  "published_to_approved_users",
  "revoked",
  "archived",
] as const;

export type WaterSecondaryLayerKind =
  (typeof WATER_SECONDARY_LAYER_KINDS)[number];

export type WaterLayerVisibility = (typeof WATER_LAYER_VISIBILITY)[number];

export type WaterLayerSensitivity = (typeof WATER_LAYER_SENSITIVITY)[number];

export type WaterLayerApprovalStatus =
  (typeof WATER_LAYER_APPROVAL_STATUS)[number];

export type WaterSecondaryLayerRegistryItem = {
  id: string;
  kind: WaterSecondaryLayerKind;
  title: string;
  description: string;
  visibility: WaterLayerVisibility;
  sensitivity: WaterLayerSensitivity;
  approvalStatus: WaterLayerApprovalStatus;
  sourceRefs: string[];
  derivedFromSourceVaultRefs: string[];
  evidenceLogRefs: string[];
  version: string;
  rollbackVersionRefs: string[];
  createdAt: string;
  updatedAt: string;
  founderApprovedBy?: string;
  founderApprovedAt?: string;
  rawSourceExposedToUsers: false;
  safeDerivedLayerOnly: true;
};

export const WATER_SECONDARY_LAYER_REGISTRY_RULES = {
  version: WATER_SECONDARY_LAYER_REGISTRY_VERSION,
  rawSourcesNeverExposedThroughLayers: true,
  founderApprovalRequiredBeforePublishing: true,
  sensitiveInfrastructureHiddenFromFieldUsers: true,
  eachLayerNeedsSourceProvenance: true,
  eachPublishedLayerNeedsRollback: true,
  derivedLayersOnlyForUsers: true,
} as const;

export function createWaterSecondaryLayerRegistryItem(input: {
  id: string;
  kind: WaterSecondaryLayerKind;
  title: string;
  description: string;
  visibility?: WaterLayerVisibility;
  sensitivity?: WaterLayerSensitivity;
  sourceRefs?: string[];
  derivedFromSourceVaultRefs?: string[];
  evidenceLogRefs?: string[];
  version?: string;
  createdAt?: string;
}): WaterSecondaryLayerRegistryItem {
  const now = input.createdAt || new Date().toISOString();

  return {
    id: input.id,
    kind: input.kind,
    title: input.title,
    description: input.description,
    visibility: input.visibility || "founder_only",
    sensitivity: input.sensitivity || "restricted",
    approvalStatus: "draft",
    sourceRefs: input.sourceRefs || [],
    derivedFromSourceVaultRefs: input.derivedFromSourceVaultRefs || [],
    evidenceLogRefs: input.evidenceLogRefs || [],
    version: input.version || "v1",
    rollbackVersionRefs: [],
    createdAt: now,
    updatedAt: now,
    rawSourceExposedToUsers: false,
    safeDerivedLayerOnly: true,
  };
}

export function approveWaterSecondaryLayerForFounder(
  item: WaterSecondaryLayerRegistryItem,
  founderApprovedBy: string,
): WaterSecondaryLayerRegistryItem {
  const now = new Date().toISOString();

  return {
    ...item,
    approvalStatus: "founder_approved",
    founderApprovedBy,
    founderApprovedAt: now,
    updatedAt: now,
    rawSourceExposedToUsers: false,
    safeDerivedLayerOnly: true,
  };
}

export function canPublishWaterSecondaryLayerToApprovedUsers(
  item: WaterSecondaryLayerRegistryItem,
) {
  return (
    item.approvalStatus === "founder_approved" &&
    item.visibility === "approved_users" &&
    item.rawSourceExposedToUsers === false &&
    item.safeDerivedLayerOnly === true &&
    item.sourceRefs.length > 0
  );
}