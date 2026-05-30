export type PantavionContinuityMemoryArea =
  | "conversation"
  | "professional-conversation"
  | "kernel-audit"
  | "water-field-history"
  | "water-street-history"
  | "user-note"
  | "deleted-visible-content"
  | "transferred-conversation"
  | "decision"
  | "risk"
  | "unknown";

export type PantavionContinuityMemoryStatus =
  | "recorded"
  | "summarized"
  | "transferred"
  | "hidden-from-user"
  | "deleted-visible-retained-internal-note"
  | "pending-founder-review"
  | "approved"
  | "rejected";

export interface PantavionContinuityMemoryEntry {
  id: string;
  area: PantavionContinuityMemoryArea;
  status: PantavionContinuityMemoryStatus;
  createdAt: string;
  updatedAt: string;
  source:
    | "user"
    | "founder"
    | "kernel"
    | "field-user"
    | "admin"
    | "system"
    | "import";
  title: string;
  summary: string;
  tags: string[];
  protected: true;
  lightweightIndexRequired: true;
  fullRawContentStoredSeparately: boolean;
  canBeMovedToAnotherConversation: boolean;
  visibleDeletionAllowed: boolean;
  internalContinuityNoteRetained: boolean;
  founderApprovalRequiredForMasterChange: boolean;
  mutatesWaterMaster: false;
  mutatesUsers: false;
  mutatesBlob: false;
  exposesRawDwg: false;
}

export interface PantavionWaterStreetHistoryPolicy {
  enabled: true;
  userCanSubmitMissingStreet: true;
  userCanSubmitValve: true;
  userCanSubmitSupplyPoint: true;
  userCanSubmitNetworkNote: true;
  userCanSubmitFault: true;
  userCanSubmitExpansion: true;
  userCanSubmitPhotoOrFieldEvidence: true;
  directMasterMutationAllowed: false;
  founderOrAdminApprovalRequired: true;
  searchStreetShowsHistoricalIncidents: true;
  searchStreetShowsPreviousFaults: true;
  searchStreetShowsKnownNetworkNotes: true;
  searchStreetShowsApprovedFieldNotes: true;
  searchStreetShowsPendingWarningsWhenAllowed: true;
}

export interface PantavionContinuityMemoryReport {
  ok: true;
  marker: "pantavion_continuity_memory_contract_v1";
  status: "contract-registered";
  generatedAt: string;
  purpose: string;
  memoryPolicy: {
    unlimitedVision: true;
    lightweightRuntimeRequired: true;
    hotCurrentContext: true;
    warmIndexedSummaries: true;
    coldPrivateArchive: true;
    userVisibleConversationHistory: true;
    internalDecisionLedger: true;
    deletionKeepsMinimalContinuityNote: true;
    noChaosAllowed: true;
  };
  conversationPolicy: {
    newConversationsAllowed: true;
    conversationTransferAllowed: true;
    professionalConversationModeRequired: true;
    timestampEveryImportantEvent: true;
    noteTakingRequired: true;
    userCanHideOrDeleteVisibleParts: true;
    internalSafetyAndContinuityNotesMayRemain: true;
  };
  waterStreetHistoryPolicy: PantavionWaterStreetHistoryPolicy;
  protectedBoundaries: {
    noDirectWaterMasterMutation: true;
    noRawDwgExposure: true;
    noUserRecordLoss: true;
    noBlobMutation: true;
    founderApprovalRequiredForInfrastructureChanges: true;
  };
  seedEntries: PantavionContinuityMemoryEntry[];
  nextBuildTargets: string[];
}

export function createPantavionContinuityMemoryReport(): PantavionContinuityMemoryReport {
  const now = new Date().toISOString();

  return {
    ok: true,
    marker: "pantavion_continuity_memory_contract_v1",
    status: "contract-registered",
    generatedAt: now,
    purpose:
      "Defines Pantavion continuity memory so conversations, decisions, professional notes, deletions, transfers, and water field history remain organized without making the runtime heavy.",
    memoryPolicy: {
      unlimitedVision: true,
      lightweightRuntimeRequired: true,
      hotCurrentContext: true,
      warmIndexedSummaries: true,
      coldPrivateArchive: true,
      userVisibleConversationHistory: true,
      internalDecisionLedger: true,
      deletionKeepsMinimalContinuityNote: true,
      noChaosAllowed: true,
    },
    conversationPolicy: {
      newConversationsAllowed: true,
      conversationTransferAllowed: true,
      professionalConversationModeRequired: true,
      timestampEveryImportantEvent: true,
      noteTakingRequired: true,
      userCanHideOrDeleteVisibleParts: true,
      internalSafetyAndContinuityNotesMayRemain: true,
    },
    waterStreetHistoryPolicy: {
      enabled: true,
      userCanSubmitMissingStreet: true,
      userCanSubmitValve: true,
      userCanSubmitSupplyPoint: true,
      userCanSubmitNetworkNote: true,
      userCanSubmitFault: true,
      userCanSubmitExpansion: true,
      userCanSubmitPhotoOrFieldEvidence: true,
      directMasterMutationAllowed: false,
      founderOrAdminApprovalRequired: true,
      searchStreetShowsHistoricalIncidents: true,
      searchStreetShowsPreviousFaults: true,
      searchStreetShowsKnownNetworkNotes: true,
      searchStreetShowsApprovedFieldNotes: true,
      searchStreetShowsPendingWarningsWhenAllowed: true,
    },
    protectedBoundaries: {
      noDirectWaterMasterMutation: true,
      noRawDwgExposure: true,
      noUserRecordLoss: true,
      noBlobMutation: true,
      founderApprovalRequiredForInfrastructureChanges: true,
    },
    seedEntries: [
      {
        id: "conversation.flow.timestamped-memory",
        area: "conversation",
        status: "recorded",
        createdAt: now,
        updatedAt: now,
        source: "kernel",
        title: "Timestamped conversation flow",
        summary:
          "Pantavion must remember conversation flow with date, time, decisions, notes, transfers, and summaries so the system does not become chaotic.",
        tags: ["memory", "conversation", "timestamp", "continuity"],
        protected: true,
        lightweightIndexRequired: true,
        fullRawContentStoredSeparately: true,
        canBeMovedToAnotherConversation: true,
        visibleDeletionAllowed: true,
        internalContinuityNoteRetained: true,
        founderApprovalRequiredForMasterChange: false,
        mutatesWaterMaster: false,
        mutatesUsers: false,
        mutatesBlob: false,
        exposesRawDwg: false,
      },
      {
        id: "water.street.history.search",
        area: "water-street-history",
        status: "pending-founder-review",
        createdAt: now,
        updatedAt: now,
        source: "kernel",
        title: "Water street historical intelligence",
        summary:
          "Searching a street should show approved historical faults, incidents, valve notes, supply notes, expansions, cables, network observations, and previous field reports.",
        tags: ["water", "street", "history", "field-notes", "search"],
        protected: true,
        lightweightIndexRequired: true,
        fullRawContentStoredSeparately: true,
        canBeMovedToAnotherConversation: false,
        visibleDeletionAllowed: false,
        internalContinuityNoteRetained: true,
        founderApprovalRequiredForMasterChange: true,
        mutatesWaterMaster: false,
        mutatesUsers: false,
        mutatesBlob: false,
        exposesRawDwg: false,
      },
      {
        id: "deleted.visible.content.internal.note",
        area: "deleted-visible-content",
        status: "deleted-visible-retained-internal-note",
        createdAt: now,
        updatedAt: now,
        source: "kernel",
        title: "Visible deletion with internal continuity note",
        summary:
          "When a user deletes or hides visible conversation content, Pantavion may retain minimal internal continuity notes where legally allowed to preserve safety, auditability, and flow.",
        tags: ["deletion", "privacy", "continuity", "audit"],
        protected: true,
        lightweightIndexRequired: true,
        fullRawContentStoredSeparately: false,
        canBeMovedToAnotherConversation: false,
        visibleDeletionAllowed: true,
        internalContinuityNoteRetained: true,
        founderApprovalRequiredForMasterChange: false,
        mutatesWaterMaster: false,
        mutatesUsers: false,
        mutatesBlob: false,
        exposesRawDwg: false,
      },
    ],
    nextBuildTargets: [
      "conversation-memory-index",
      "conversation-transfer-action",
      "professional-conversation-mode",
      "visible-delete-with-internal-note",
      "water-street-history-ledger",
      "water-field-submission-inbox",
      "street-search-history-panel",
      "founder-approval-before-master-map-change",
    ],
  };
}
