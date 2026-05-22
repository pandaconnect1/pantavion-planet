export const WATER_CHANGE_EVIDENCE_LOG_VERSION = "2026-05-22.v1";

export const WATER_CHANGE_EVIDENCE_TYPES = [
  "photo",
  "note",
  "fault",
  "new_valve",
  "valve_removal",
  "valve_change",
  "new_pipe",
  "pipe_repair",
  "network_extension",
  "new_connection",
  "connection_isolation",
  "pressure_change",
  "zone_change",
  "pipe_depth",
  "pipe_material",
  "new_road",
  "new_area",
  "pdf",
  "scanner_report",
  "voice_note",
] as const;

export const WATER_CHANGE_EVIDENCE_STATUSES = [
  "private_pending_founder_approval",
  "founder_approved",
  "approved_shared",
  "needs_check",
  "rejected",
  "archived",
] as const;

export const WATER_EVIDENCE_TRUTH_LABELS = [
  "verified",
  "founder_approved",
  "field_observed",
  "ai_estimated",
  "needs_check",
  "unknown",
] as const;

export type WaterChangeEvidenceType =
  (typeof WATER_CHANGE_EVIDENCE_TYPES)[number];

export type WaterChangeEvidenceStatus =
  (typeof WATER_CHANGE_EVIDENCE_STATUSES)[number];

export type WaterEvidenceTruthLabel =
  (typeof WATER_EVIDENCE_TRUTH_LABELS)[number];

export type WaterChangeEvidenceTarget = {
  id: string;
  targetType: "point" | "road" | "area" | "zone" | "pipe" | "valve" | "tank";
  label: string;
  latitude?: number;
  longitude?: number;
  roadLabel?: string;
  areaLabel?: string;
  zoneLabel?: string;
  pipeRef?: string;
  valveRef?: string;
  tankRef?: string;
};

export type WaterChangeEvidenceLogEntry = {
  id: string;
  type: WaterChangeEvidenceType;
  status: WaterChangeEvidenceStatus;
  truthLabel: WaterEvidenceTruthLabel;
  target: WaterChangeEvidenceTarget;
  title: string;
  description?: string;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  evidenceRefs: string[];
  photoRefs: string[];
  voiceNoteRefs: string[];
  documentRefs: string[];
  relatedApprovalInboxRef?: string;
  relatedSourceVaultRef?: string;
  createdAt: string;
  updatedAt: string;
  visibleToFounder: true;
  visibleToApprovedUsers: boolean;
  aiEstimateIsVerifiedTruth: false;
};

export const WATER_CHANGE_EVIDENCE_LOG_RULES = {
  version: WATER_CHANGE_EVIDENCE_LOG_VERSION,
  everyChangeNeedsHistory: true,
  submissionsStartPrivatePending: true,
  founderApprovalRequiredBeforeSharedVisibility: true,
  aiEstimateIsNotVerifiedTruth: true,
  rawSensitiveEvidenceHiddenFromApprovedUsers: true,
  rollbackAndAuditTrailRequired: true,
  longTermMemoryGoalYears: 60,
} as const;

export function createWaterChangeEvidenceLogEntry(input: {
  id: string;
  type: WaterChangeEvidenceType;
  target: WaterChangeEvidenceTarget;
  title: string;
  description?: string;
  submittedBy?: string;
  evidenceRefs?: string[];
  photoRefs?: string[];
  voiceNoteRefs?: string[];
  documentRefs?: string[];
  relatedApprovalInboxRef?: string;
  relatedSourceVaultRef?: string;
  truthLabel?: WaterEvidenceTruthLabel;
  createdAt?: string;
}): WaterChangeEvidenceLogEntry {
  const now = input.createdAt || new Date().toISOString();

  return {
    id: input.id,
    type: input.type,
    status: "private_pending_founder_approval",
    truthLabel: input.truthLabel || "field_observed",
    target: input.target,
    title: input.title,
    description: input.description,
    submittedBy: input.submittedBy,
    evidenceRefs: input.evidenceRefs || [],
    photoRefs: input.photoRefs || [],
    voiceNoteRefs: input.voiceNoteRefs || [],
    documentRefs: input.documentRefs || [],
    relatedApprovalInboxRef: input.relatedApprovalInboxRef,
    relatedSourceVaultRef: input.relatedSourceVaultRef,
    createdAt: now,
    updatedAt: now,
    visibleToFounder: true,
    visibleToApprovedUsers: false,
    aiEstimateIsVerifiedTruth: false,
  };
}

export function approveWaterChangeEvidenceLogEntry(
  entry: WaterChangeEvidenceLogEntry,
  approvedBy: string,
): WaterChangeEvidenceLogEntry {
  const now = new Date().toISOString();

  return {
    ...entry,
    status: "founder_approved",
    truthLabel:
      entry.truthLabel === "ai_estimated" ? "needs_check" : "founder_approved",
    approvedBy,
    approvedAt: now,
    updatedAt: now,
    visibleToApprovedUsers: false,
    aiEstimateIsVerifiedTruth: false,
  };
}

export function publishWaterChangeEvidenceLogEntryToApprovedUsers(
  entry: WaterChangeEvidenceLogEntry,
): WaterChangeEvidenceLogEntry {
  if (entry.status !== "founder_approved") {
    return entry;
  }

  return {
    ...entry,
    status: "approved_shared",
    updatedAt: new Date().toISOString(),
    visibleToApprovedUsers: true,
    aiEstimateIsVerifiedTruth: false,
  };
}

export function canShowWaterChangeEvidenceToApprovedUsers(
  entry: WaterChangeEvidenceLogEntry,
) {
  return (
    entry.status === "approved_shared" &&
    entry.visibleToApprovedUsers === true &&
    entry.aiEstimateIsVerifiedTruth === false
  );
}