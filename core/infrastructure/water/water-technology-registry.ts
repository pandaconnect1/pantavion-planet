export const WATER_TECHNOLOGY_REGISTRY_VERSION = "2026-05-22.v1";

export const WATER_TECHNOLOGY_KINDS = [
  "telemetry",
  "scada",
  "rtu",
  "pressure_sensor",
  "flow_meter",
  "tank_level_sensor",
  "smart_meter_amr_ami",
  "acoustic_leak_detection",
  "fiber_optic_sensing",
  "gpr_underground_scan",
  "drone_survey",
  "thermal_imaging",
  "satellite_remote_sensing",
  "sar_insar_indicator",
  "dem_3d_terrain",
  "epanet_hydraulic_modeling",
  "ai_leak_prediction",
  "pdf_ocr_extraction",
  "photo_as_built_extraction",
] as const;

export const WATER_TECHNOLOGY_READINESS = [
  "idea",
  "research",
  "provider_needed",
  "data_needed",
  "pilot_ready",
  "connected",
  "active",
  "archived",
] as const;

export const WATER_TECHNOLOGY_SCORE_LABELS = [
  "very_low",
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type WaterTechnologyKind = (typeof WATER_TECHNOLOGY_KINDS)[number];
export type WaterTechnologyReadiness = (typeof WATER_TECHNOLOGY_READINESS)[number];
export type WaterTechnologyScoreLabel = (typeof WATER_TECHNOLOGY_SCORE_LABELS)[number];

export type WaterTechnologyRegistryItem = {
  id: string;
  kind: WaterTechnologyKind;
  readiness: WaterTechnologyReadiness;
  title: string;
  description: string;
  providerName?: string;
  providerDependency: WaterTechnologyScoreLabel;
  value: WaterTechnologyScoreLabel;
  cost: WaterTechnologyScoreLabel;
  complexity: WaterTechnologyScoreLabel;
  accuracy: WaterTechnologyScoreLabel;
  risk: WaterTechnologyScoreLabel;
  dataRequirements: string[];
  founderVisible: true;
  userVisible: boolean;
  requiresFounderApprovalBeforeActivation: true;
  createdAt: string;
  updatedAt: string;
};

export const WATER_TECHNOLOGY_REGISTRY_RULES = {
  version: WATER_TECHNOLOGY_REGISTRY_VERSION,
  difficultTechnologyIsRegisteredNotRejected: true,
  founderVisibilityByDefault: true,
  userVisibilityRequiresApproval: true,
  providerDependencyMustBeTracked: true,
  costComplexityRiskMustBeTracked: true,
  noOperationalClaimWithoutProviderOrData: true,
  noSafetyCriticalAutomationWithoutFounderApproval: true,
} as const;

export function createWaterTechnologyRegistryItem(input: {
  id: string;
  kind: WaterTechnologyKind;
  title: string;
  description: string;
  providerName?: string;
  readiness?: WaterTechnologyReadiness;
  providerDependency?: WaterTechnologyScoreLabel;
  value?: WaterTechnologyScoreLabel;
  cost?: WaterTechnologyScoreLabel;
  complexity?: WaterTechnologyScoreLabel;
  accuracy?: WaterTechnologyScoreLabel;
  risk?: WaterTechnologyScoreLabel;
  dataRequirements?: string[];
  userVisible?: boolean;
  createdAt?: string;
}): WaterTechnologyRegistryItem {
  const now = input.createdAt || new Date().toISOString();

  return {
    id: input.id,
    kind: input.kind,
    readiness: input.readiness || "research",
    title: input.title,
    description: input.description,
    providerName: input.providerName,
    providerDependency: input.providerDependency || "medium",
    value: input.value || "medium",
    cost: input.cost || "medium",
    complexity: input.complexity || "medium",
    accuracy: input.accuracy || "unknown" as WaterTechnologyScoreLabel,
    risk: input.risk || "medium",
    dataRequirements: input.dataRequirements || [],
    founderVisible: true,
    userVisible: input.userVisible ?? false,
    requiresFounderApprovalBeforeActivation: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function canShowWaterTechnologyToApprovedUsers(
  item: WaterTechnologyRegistryItem,
) {
  return item.userVisible === true && item.founderVisible === true;
}

export function canActivateWaterTechnology(
  item: WaterTechnologyRegistryItem,
) {
  return (
    item.readiness === "pilot_ready" ||
    item.readiness === "connected" ||
    item.readiness === "active"
  ) && item.requiresFounderApprovalBeforeActivation === true;
}