export const WATER_APPROVAL_INBOX_VERSION = "2026-05-22.v1";

export const WATER_APPROVAL_ITEM_TYPES = [
  "access_request",
  "device_request",
  "map_note",
  "photo_evidence",
  "voice_note",
  "fault_report",
  "new_valve",
  "valve_change",
  "valve_removal",
  "pipe_correction",
  "new_pipe",
  "network_extension",
  "new_road",
  "new_area",
  "pdf_scanner_item",
  "source_vault_item",
  "ai_engineering_proposal",
] as const;

export const WATER_APPROVAL_STATUSES = [
  "pending_founder_review",
  "approved_for_all",
  "approved_founder_only",
  "needs_correction",
  "rejected",
  "revoked",
  "archived",
] as const;

export const WATER_APPROVAL_ACTIONS = [
  "approve_for_all",
  "approve_founder_only",
  "request_correction",
  "reject",
  "revoke",
  "archive",
] as const;

export type WaterApprovalItemType = (typeof WATER_APPROVAL_ITEM_TYPES)[number];
export type WaterApprovalStatus = (typeof WATER_APPROVAL_STATUSES)[number];
export type WaterApprovalAction = (typeof WATER_APPROVAL_ACTIONS)[number];

export type WaterApprovalInboxItem = {
  id: string;
  type: WaterApprovalItemType;
  status: WaterApprovalStatus;
  title: string;
  submittedBy?: string;
  submittedDeviceId?: string;
  areaLabel?: string;
  roadLabel?: string;
  zoneLabel?: string;
  mapTargetRef?: string;
  sourceRef?: string;
  evidenceRefs: string[];
  transcript?: string;
  aiSummary?: string;
  aiConfidence?: number;
  founderDecisionBy?: string;
  founderDecisionAt?: string;
  founderDecisionNote?: string;
  createdAt: string;
  updatedAt: string;
  visibleToApprovedUsers: boolean;
  rawSensitiveDataHiddenFromUsers: true;
};

export const WATER_APPROVAL_INBOX_RULES = {
  version: WATER_APPROVAL_INBOX_VERSION,
  founderOnly: true,
  allSubmissionsStartPending: true,
  rawSensitiveDataHiddenFromUsers: true,
  usersCannotSelfPublish: true,
  aiProposalIsNotVerifiedTruth: true,
  founderDecisionRequiredBeforeUserVisibility: true,
  auditTrailRequired: true,
} as const;

export function createWaterApprovalInboxItem(input: {
  id: string;
  type: WaterApprovalItemType;
  title: string;
  submittedBy?: string;
  submittedDeviceId?: string;
  areaLabel?: string;
  roadLabel?: string;
  zoneLabel?: string;
  mapTargetRef?: string;
  sourceRef?: string;
  evidenceRefs?: string[];
  transcript?: string;
  aiSummary?: string;
  aiConfidence?: number;
  createdAt?: string;
}): WaterApprovalInboxItem {
  const now = input.createdAt || new Date().toISOString();

  return {
    id: input.id,
    type: input.type,
    status: "pending_founder_review",
    title: input.title,
    submittedBy: input.submittedBy,
    submittedDeviceId: input.submittedDeviceId,
    areaLabel: input.areaLabel,
    roadLabel: input.roadLabel,
    zoneLabel: input.zoneLabel,
    mapTargetRef: input.mapTargetRef,
    sourceRef: input.sourceRef,
    evidenceRefs: input.evidenceRefs || [],
    transcript: input.transcript,
    aiSummary: input.aiSummary,
    aiConfidence: input.aiConfidence,
    createdAt: now,
    updatedAt: now,
    visibleToApprovedUsers: false,
    rawSensitiveDataHiddenFromUsers: true,
  };
}

export function applyFounderWaterApprovalDecision(
  item: WaterApprovalInboxItem,
  action: WaterApprovalAction,
  founderDecisionBy: string,
  founderDecisionNote?: string,
): WaterApprovalInboxItem {
  const nextStatusByAction: Record<WaterApprovalAction, WaterApprovalStatus> = {
    approve_for_all: "approved_for_all",
    approve_founder_only: "approved_founder_only",
    request_correction: "needs_correction",
    reject: "rejected",
    revoke: "revoked",
    archive: "archived",
  };

  const nextStatus = nextStatusByAction[action];

  return {
    ...item,
    status: nextStatus,
    founderDecisionBy,
    founderDecisionAt: new Date().toISOString(),
    founderDecisionNote,
    updatedAt: new Date().toISOString(),
    visibleToApprovedUsers: nextStatus === "approved_for_all",
    rawSensitiveDataHiddenFromUsers: true,
  };
}

export function canWaterApprovalItemBeVisibleToUsers(item: WaterApprovalInboxItem) {
  return (
    item.status === "approved_for_all" &&
    item.visibleToApprovedUsers === true &&
    item.rawSensitiveDataHiddenFromUsers === true
  );
}