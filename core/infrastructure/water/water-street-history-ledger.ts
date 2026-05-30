export type PantavionWaterEvidenceType =
  | "scanned-note"
  | "handwritten-note"
  | "pdf"
  | "photo"
  | "audio"
  | "video"
  | "qgis-export"
  | "csv-import"
  | "excel-import"
  | "field-note"
  | "map-correction"
  | "fault-report"
  | "missing-street"
  | "valve-note"
  | "supply-point-note"
  | "network-extension-note"
  | "unknown";

export type PantavionWaterStreetEventType =
  | "fault"
  | "repair"
  | "valve"
  | "supply-point"
  | "network-note"
  | "network-extension"
  | "missing-street"
  | "map-correction"
  | "photo-evidence"
  | "audio-evidence"
  | "pdf-evidence"
  | "qgis-import"
  | "csv-import"
  | "unknown";

export type PantavionWaterApprovalStatus =
  | "submitted"
  | "pending-founder-review"
  | "needs-more-info"
  | "approved"
  | "rejected"
  | "duplicate"
  | "urgent"
  | "archived";

export type PantavionWaterEvidenceSource =
  | "mobile-field-user"
  | "founder"
  | "admin"
  | "qgis"
  | "csv"
  | "scanner"
  | "pdf"
  | "photo"
  | "audio"
  | "system"
  | "import";

export interface PantavionWaterEvidenceInboxItem {
  id: string;
  submittedAt: string;
  updatedAt: string;
  source: PantavionWaterEvidenceSource;
  evidenceType: PantavionWaterEvidenceType;
  approvalStatus: PantavionWaterApprovalStatus;
  streetName?: string;
  area?: string;
  zone?: string;
  locationHint?: string;
  eventType: PantavionWaterStreetEventType;
  title: string;
  summary: string;
  fieldNotes: string[];
  evidenceRefs: string[];
  requiresFounderReview: true;
  directMasterMutationAllowed: false;
  mutatesWaterMaster: false;
  mutatesUsers: false;
  mutatesBlob: false;
  exposesRawDwg: false;
}

export interface PantavionWaterStreetHistoryEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  streetName: string;
  area?: string;
  zone?: string;
  eventType: PantavionWaterStreetEventType;
  approvalStatus: PantavionWaterApprovalStatus;
  evidenceItemIds: string[];
  summary: string;
  knownRisks: string[];
  operationalNotes: string[];
  visibleToFieldUsersAfterApproval: boolean;
  founderApprovalRequiredForMasterChange: true;
  directMasterMutationAllowed: false;
  mutatesWaterMaster: false;
  exposesRawDwg: false;
}

export interface PantavionWaterStreetHistoryLedgerReport {
  ok: true;
  marker: "pantavion_water_street_history_ledger_v1";
  status: "read-only-foundation";
  generatedAt: string;
  purpose: string;
  inputChannels: PantavionWaterEvidenceType[];
  safetyPolicy: {
    acceptsScannerNotes: true;
    acceptsPdf: true;
    acceptsPhotos: true;
    acceptsAudio: true;
    acceptsQgisExports: true;
    acceptsCsvExcel: true;
    acceptsMobileFieldNotes: true;
    directMasterMutationAllowed: false;
    founderApprovalRequiredBeforeMasterChange: true;
    rawDwgPublicExposureAllowed: false;
    privateEvidenceStorageRequired: true;
    offlineMobileDraftsRequired: true;
  };
  reviewActions: Array<
    | "approve"
    | "reject"
    | "needs-more-info"
    | "mark-duplicate"
    | "mark-urgent"
    | "link-to-existing-street"
    | "convert-to-street-history"
    | "propose-master-map-change"
  >;
  evidenceInboxSeed: PantavionWaterEvidenceInboxItem[];
  streetHistorySeed: PantavionWaterStreetHistoryEntry[];
  nextBuildTargets: string[];
}

export function createPantavionWaterStreetHistoryLedgerReport(): PantavionWaterStreetHistoryLedgerReport {
  const now = new Date().toISOString();

  return {
    ok: true,
    marker: "pantavion_water_street_history_ledger_v1",
    status: "read-only-foundation",
    generatedAt: now,
    purpose:
      "Registers the protected water evidence inbox and street history ledger for faults, notes, photos, audio, PDFs, scanner inputs, QGIS exports, CSV imports, and daily network changes.",
    inputChannels: [
      "scanned-note",
      "handwritten-note",
      "pdf",
      "photo",
      "audio",
      "video",
      "qgis-export",
      "csv-import",
      "excel-import",
      "field-note",
      "map-correction",
      "fault-report",
      "missing-street",
      "valve-note",
      "supply-point-note",
      "network-extension-note",
    ],
    safetyPolicy: {
      acceptsScannerNotes: true,
      acceptsPdf: true,
      acceptsPhotos: true,
      acceptsAudio: true,
      acceptsQgisExports: true,
      acceptsCsvExcel: true,
      acceptsMobileFieldNotes: true,
      directMasterMutationAllowed: false,
      founderApprovalRequiredBeforeMasterChange: true,
      rawDwgPublicExposureAllowed: false,
      privateEvidenceStorageRequired: true,
      offlineMobileDraftsRequired: true,
    },
    reviewActions: [
      "approve",
      "reject",
      "needs-more-info",
      "mark-duplicate",
      "mark-urgent",
      "link-to-existing-street",
      "convert-to-street-history",
      "propose-master-map-change",
    ],
    evidenceInboxSeed: [
      {
        id: "water.evidence.inbox.scanner-note.seed",
        submittedAt: now,
        updatedAt: now,
        source: "scanner",
        evidenceType: "scanned-note",
        approvalStatus: "pending-founder-review",
        streetName: "Unknown street pending review",
        area: "Unknown area",
        zone: "Unknown zone",
        locationHint: "Needs founder/admin classification",
        eventType: "pdf-evidence",
        title: "Scanned field note pending review",
        summary:
          "Scanner or handwritten document can enter the evidence inbox and wait for founder/admin approval before becoming official water history.",
        fieldNotes: [
          "Do not mutate master map directly.",
          "Classify street, area, zone, event type, and evidence quality before approval.",
        ],
        evidenceRefs: [],
        requiresFounderReview: true,
        directMasterMutationAllowed: false,
        mutatesWaterMaster: false,
        mutatesUsers: false,
        mutatesBlob: false,
        exposesRawDwg: false,
      },
      {
        id: "water.evidence.inbox.audio.seed",
        submittedAt: now,
        updatedAt: now,
        source: "mobile-field-user",
        evidenceType: "audio",
        approvalStatus: "pending-founder-review",
        streetName: "Unknown street pending audio transcription",
        area: "Unknown area",
        zone: "Unknown zone",
        locationHint: "Mobile field submission",
        eventType: "audio-evidence",
        title: "Audio field report pending review",
        summary:
          "A field user can submit audio explaining what happened; founder/admin reviews before approval or conversion to street history.",
        fieldNotes: [
          "Future layer should transcribe audio.",
          "Future layer should link audio to street, fault, valve, or supply point.",
        ],
        evidenceRefs: [],
        requiresFounderReview: true,
        directMasterMutationAllowed: false,
        mutatesWaterMaster: false,
        mutatesUsers: false,
        mutatesBlob: false,
        exposesRawDwg: false,
      },
      {
        id: "water.evidence.inbox.qgis.seed",
        submittedAt: now,
        updatedAt: now,
        source: "qgis",
        evidenceType: "qgis-export",
        approvalStatus: "pending-founder-review",
        streetName: "Imported layer pending validation",
        area: "QGIS import",
        zone: "QGIS import",
        locationHint: "GeoPackage/GeoJSON/CSV import should remain private until reviewed",
        eventType: "qgis-import",
        title: "QGIS export pending validation",
        summary:
          "QGIS export can be absorbed into Pantavion as private import evidence, then validated before becoming an approved derived layer or street history.",
        fieldNotes: [
          "Use private vault/import storage.",
          "Do not expose raw DWG/DXF or private infrastructure source files publicly.",
        ],
        evidenceRefs: [],
        requiresFounderReview: true,
        directMasterMutationAllowed: false,
        mutatesWaterMaster: false,
        mutatesUsers: false,
        mutatesBlob: false,
        exposesRawDwg: false,
      },
    ],
    streetHistorySeed: [
      {
        id: "water.street.history.search.seed",
        createdAt: now,
        updatedAt: now,
        streetName: "Street search history foundation",
        area: "Foundation",
        zone: "Foundation",
        eventType: "network-note",
        approvalStatus: "pending-founder-review",
        evidenceItemIds: [
          "water.evidence.inbox.scanner-note.seed",
          "water.evidence.inbox.audio.seed",
          "water.evidence.inbox.qgis.seed",
        ],
        summary:
          "When a street is searched, Pantavion should show approved past faults, repairs, valve notes, supply notes, network notes, field photos, audio evidence, and pending warnings when allowed.",
        knownRisks: [
          "Unapproved field data must not overwrite the master network.",
          "Raw DWG/DXF must not be public.",
          "Daily imports require deduplication and founder/admin approval.",
        ],
        operationalNotes: [
          "Create lightweight street index for mobile search.",
          "Keep raw evidence in private storage.",
          "Show approved history to authorized field users.",
        ],
        visibleToFieldUsersAfterApproval: true,
        founderApprovalRequiredForMasterChange: true,
        directMasterMutationAllowed: false,
        mutatesWaterMaster: false,
        exposesRawDwg: false,
      },
    ],
    nextBuildTargets: [
      "private-evidence-upload-route",
      "mobile-field-evidence-form",
      "audio-note-capture",
      "scanner-pdf-import",
      "qgis-geopackage-import-contract",
      "csv-excel-fault-import-contract",
      "street-search-history-panel",
      "founder-approval-inbox-actions",
      "daily-change-ingestion-queue",
      "deduplication-and-conflict-detection",
    ],
  };
}
