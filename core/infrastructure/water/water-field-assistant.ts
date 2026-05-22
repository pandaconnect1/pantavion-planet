export const WATER_FIELD_ASSISTANT_VERSION = "2026-05-22.v1";

export const WATER_FIELD_ASSISTANT_ACTIONS = [
  "show_my_location",
  "find_area",
  "find_road",
  "find_zone",
  "ask_what_is_under_here",
  "add_note",
  "add_photo",
  "add_voice_note",
  "report_fault",
  "find_nearest_valve",
  "show_pipe_depth_if_known",
  "show_pipe_pressure_if_known",
  "show_pipe_material_if_known",
] as const;

export const WATER_FIELD_SUBMISSION_TYPES = [
  "note",
  "photo",
  "voice_note",
  "fault_report",
  "possible_valve",
  "new_road",
  "new_area",
  "pipe_depth_observation",
  "pipe_material_observation",
  "underground_service_observation",
] as const;

export type WaterFieldAssistantAction =
  (typeof WATER_FIELD_ASSISTANT_ACTIONS)[number];

export type WaterFieldSubmissionType =
  (typeof WATER_FIELD_SUBMISSION_TYPES)[number];

export type WaterFieldAssistantTarget = {
  id: string;
  targetType: "current_location" | "map_point" | "road" | "area" | "zone";
  label: string;
  latitude?: number;
  longitude?: number;
  roadLabel?: string;
  areaLabel?: string;
  zoneLabel?: string;
};

export type WaterFieldAssistantSubmission = {
  id: string;
  type: WaterFieldSubmissionType;
  target: WaterFieldAssistantTarget;
  submittedBy?: string;
  submittedDeviceId?: string;
  title: string;
  description?: string;
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  status: "private_pending_founder_approval";
  visibleToFounder: true;
  visibleToApprovedUsers: false;
  verifiedTruth: false;
  aiEstimated: boolean;
};

export type WaterFieldAssistantSafeInfo = {
  target: WaterFieldAssistantTarget;
  nearestValveRefs: string[];
  nearbyPipeRefs: string[];
  knownPipeDepthMeters?: number;
  knownPipePressureBar?: number;
  knownPipeMaterial?: string;
  dataConfidence: "verified" | "founder_approved" | "field_observed" | "ai_estimated" | "needs_check" | "unknown";
  safeForApprovedUser: boolean;
};

export const WATER_FIELD_ASSISTANT_RULES = {
  version: WATER_FIELD_ASSISTANT_VERSION,
  simpleForNonGisUsers: true,
  submissionsStartPrivatePending: true,
  usersCannotPublishDirectly: true,
  founderApprovalRequiredBeforeSharedVisibility: true,
  rawSourceDataHiddenFromFieldUsers: true,
  aiEstimateIsNotVerifiedTruth: true,
  safeApprovedInformationOnlyForFieldUsers: true,
} as const;

export function createWaterFieldAssistantSubmission(input: {
  id: string;
  type: WaterFieldSubmissionType;
  target: WaterFieldAssistantTarget;
  title: string;
  description?: string;
  submittedBy?: string;
  submittedDeviceId?: string;
  evidenceRefs?: string[];
  aiEstimated?: boolean;
  createdAt?: string;
}): WaterFieldAssistantSubmission {
  const now = input.createdAt || new Date().toISOString();

  return {
    id: input.id,
    type: input.type,
    target: input.target,
    submittedBy: input.submittedBy,
    submittedDeviceId: input.submittedDeviceId,
    title: input.title,
    description: input.description,
    evidenceRefs: input.evidenceRefs || [],
    createdAt: now,
    updatedAt: now,
    status: "private_pending_founder_approval",
    visibleToFounder: true,
    visibleToApprovedUsers: false,
    verifiedTruth: false,
    aiEstimated: input.aiEstimated ?? false,
  };
}

export function canWaterFieldSubmissionBeSharedToApprovedUsers(
  submission: WaterFieldAssistantSubmission,
) {
  return (
    submission.status === "private_pending_founder_approval" &&
    submission.visibleToFounder === true &&
    submission.visibleToApprovedUsers === false
  );
}

export function isWaterFieldInfoSafeForApprovedUser(
  info: WaterFieldAssistantSafeInfo,
) {
  return info.safeForApprovedUser === true && info.dataConfidence !== "ai_estimated";
}