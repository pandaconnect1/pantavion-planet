export const WATER_INTELLIGENCE_SIDEBAR_VERSION = "2026-05-22.v1";

export const WATER_INTELLIGENCE_SIDEBAR_PANELS = [
  "area_overview",
  "faults",
  "valves",
  "tanks",
  "works_and_extensions",
  "photos_and_evidence",
  "voice_notes",
  "pipe_material",
  "depth_and_diameter",
  "pressure_and_zone",
  "history",
  "ai_recommendation",
  "pending_approval",
] as const;

export type WaterIntelligenceSidebarPanel =
  (typeof WATER_INTELLIGENCE_SIDEBAR_PANELS)[number];

export type WaterIntelligenceSidebarTarget = {
  id: string;
  targetType: "area" | "road" | "zone" | "pipe" | "valve" | "tank" | "point";
  label: string;
  areaLabel?: string;
  roadLabel?: string;
  zoneLabel?: string;
  mapTargetRef?: string;
};

export type WaterIntelligenceSidebarRecord = {
  target: WaterIntelligenceSidebarTarget;
  selectedPanel: WaterIntelligenceSidebarPanel;
  availablePanels: WaterIntelligenceSidebarPanel[];
  visibleToFounder: boolean;
  visibleToApprovedUser: boolean;
  containsFounderOnlyIntelligence: boolean;
  containsPendingApprovalItems: boolean;
};

export type WaterAreaIntelligenceSummary = {
  roadLabel?: string;
  areaLabel?: string;
  zoneLabel?: string;
  pipeMaterial?: string;
  pipeDiameterMm?: number;
  pipeDepthMeters?: number;
  pressureBar?: number;
  feedingTankLabel?: string;
  centralValveRefs: string[];
  faultHistoryRefs: string[];
  photoEvidenceRefs: string[];
  voiceNoteRefs: string[];
  changeHistoryRefs: string[];
  pendingApprovalRefs: string[];
  aiFounderOnlyRecommendation?: {
    summary: string;
    confidence: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    verifiedTruth: false;
  };
};

export const WATER_INTELLIGENCE_SIDEBAR_RULES = {
  version: WATER_INTELLIGENCE_SIDEBAR_VERSION,
  founderCanSeeAllPanels: true,
  approvedUsersSeeOnlySafeApprovedPanels: true,
  aiRecommendationFounderOnlyByDefault: true,
  pendingApprovalHiddenFromApprovedUsers: true,
  rawSourceDataHiddenFromApprovedUsers: true,
  aiRecommendationIsNotVerifiedTruth: true,
} as const;

export function createWaterIntelligenceSidebarRecord(input: {
  target: WaterIntelligenceSidebarTarget;
  selectedPanel?: WaterIntelligenceSidebarPanel;
  visibleToFounder?: boolean;
  visibleToApprovedUser?: boolean;
  containsFounderOnlyIntelligence?: boolean;
  containsPendingApprovalItems?: boolean;
}): WaterIntelligenceSidebarRecord {
  return {
    target: input.target,
    selectedPanel: input.selectedPanel || "area_overview",
    availablePanels: WATER_INTELLIGENCE_SIDEBAR_PANELS.slice(),
    visibleToFounder: input.visibleToFounder ?? true,
    visibleToApprovedUser: input.visibleToApprovedUser ?? false,
    containsFounderOnlyIntelligence:
      input.containsFounderOnlyIntelligence ?? false,
    containsPendingApprovalItems: input.containsPendingApprovalItems ?? false,
  };
}

export function canShowWaterSidebarRecordToApprovedUser(
  record: WaterIntelligenceSidebarRecord,
) {
  return (
    record.visibleToApprovedUser === true &&
    record.containsFounderOnlyIntelligence === false &&
    record.containsPendingApprovalItems === false
  );
}