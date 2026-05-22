export type WaterFaultRecordSource =
  | "phone"
  | "audio"
  | "pdf"
  | "scanner"
  | "photo"
  | "map"
  | "field"
  | "citizen"
  | "email"
  | "fax"
  | "office"
  | "other";

export type WaterFaultLifecycleStatus =
  | "draft"
  | "pending_approval"
  | "recorded"
  | "received_by_supervisor"
  | "assigned_to_crew"
  | "accepted_by_technician"
  | "crew_arrived"
  | "work_in_progress"
  | "waiting_materials"
  | "waiting_machine"
  | "completed_by_crew"
  | "delivered_by_worker"
  | "checked_by_supervisor"
  | "approved_by_founder_admin"
  | "returned_for_completion"
  | "rejected"
  | "locked";

export type WaterFaultPriority =
  | "normal"
  | "urgent"
  | "critical";

export type WaterFaultType =
  | "fault"
  | "leak"
  | "broken_pipe"
  | "possible_valve"
  | "no_water"
  | "pressure_problem"
  | "quality_problem"
  | "other";

export type WaterFaultActorRole =
  | "citizen"
  | "call_center"
  | "worker"
  | "technician"
  | "assistant_supervisor"
  | "supervisor"
  | "chief_supervisor"
  | "warehouse"
  | "accounting"
  | "technical_services"
  | "contractor"
  | "general_manager"
  | "president"
  | "founder_admin"
  | "ai";

export type WaterFaultEvidenceKind =
  | "photo_before"
  | "photo_after"
  | "audio"
  | "transcript"
  | "pdf"
  | "scanner"
  | "map_snapshot"
  | "signature"
  | "material_receipt"
  | "machine_receipt"
  | "other";

export type WaterFaultTranscriptStatus =
  | "none"
  | "pending_transcription"
  | "transcribed"
  | "edited"
  | "approved"
  | "rejected";

export type WaterFaultApprovalState =
  | "not_required"
  | "pending_supervisor"
  | "pending_founder_admin"
  | "approved"
  | "returned_for_completion"
  | "rejected";

export type WaterFaultCommunicationAction =
  | "created"
  | "forwarded"
  | "assigned"
  | "received"
  | "reply"
  | "note"
  | "status_update"
  | "material_request"
  | "tool_request"
  | "arrival"
  | "departure"
  | "delivery"
  | "approval"
  | "return_for_completion"
  | "lock_record";

export type WaterFaultActor = {
  userId: string;
  name: string;
  role: WaterFaultActorRole;
  phone?: string;
  deviceId?: string;
};

export type WaterFaultTimestampSet = {
  recordedAt: string;
  givenAt?: string;
  receivedAt?: string;
  assignedAt?: string;
  acceptedAt?: string;
  crewArrivedAt?: string;
  crewDepartedAt?: string;
  completedAt?: string;
  deliveredAt?: string;
  checkedAt?: string;
  approvedAt?: string;
  lockedAt?: string;
};

export type WaterFaultLocationLink = {
  areaLabel: string;
  roadLabel: string;
  zoneLabel: string;
  gpsLat?: number;
  gpsLng?: number;
  nearestPipeId?: string;
  nearestPipeLabel?: string;
  nearestValveId?: string;
  nearestValveLabel?: string;
  pressureZoneId?: string;
  mapPath?: string;
  mapLinkStatus:
    | "missing"
    | "manual_location"
    | "gps_location"
    | "linked_to_zone"
    | "linked_to_pipe"
    | "linked_to_valve"
    | "verified";
};

export type WaterFaultExcavation = {
  wasExcavationDone: boolean;
  excavationType?: string;
  dimensions?: string;
  quantityOrLength?: string;
  machineUsed?: string;
  tractorUsed?: string;
  contractorName?: string;
  notes?: string;
};

export type WaterFaultMaterialLine = {
  materialName: string;
  quantity: string;
  unit?: string;
  confirmedBy?: string;
  confirmedAt?: string;
};

export type WaterFaultAudioTranscript = {
  audioRefs: string[];
  originalAudioFile?: string;
  transcriptStatus: WaterFaultTranscriptStatus;
  transcriptText?: string;
  transcriptLanguage?: string;
  transcriptConfidence?: number;
  transcriptEditedBy?: string;
  transcriptEditedAt?: string;
  transcriptApprovedBy?: string;
  transcriptApprovedAt?: string;
};

export type WaterFaultEvidence = {
  kind: WaterFaultEvidenceKind;
  ref: string;
  label?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
};

export type WaterFaultSignatureEvent = {
  id: string;
  action: WaterFaultCommunicationAction;
  signedBy: WaterFaultActor;
  signedAt: string;
  signatureRef?: string;
  confirmationText: string;
};

export type WaterFaultCommunicationEvent = {
  id: string;
  action: WaterFaultCommunicationAction;
  from: WaterFaultActor;
  to?: WaterFaultActor;
  toRole?: WaterFaultActorRole;
  message: string;
  createdAt: string;
  smsRequested?: boolean;
  smsStatus?: "not_requested" | "not_sent_provider_not_connected" | "sent" | "failed";
  readAt?: string;
  repliedAt?: string;
};

export type WaterFaultAiCheck = {
  id: string;
  severity: "info" | "warning" | "critical";
  category:
    | "missing_field"
    | "map_risk"
    | "history_risk"
    | "water_loss_risk"
    | "crew_delay"
    | "materials"
    | "excavation"
    | "photo_required"
    | "signature_required"
    | "approval_required"
    | "reporting";
  message: string;
  suggestedAction: string;
  requiresHumanApproval: boolean;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
};

export type WaterFaultManagementMetrics = {
  responseMinutes?: number;
  repairMinutes?: number;
  totalWorkMinutes?: number;
  estimatedWaterLoss?: string;
  estimatedCost?: string;
  repeatedFaultCountNearby?: number;
  highRiskArea?: boolean;
  reportTags: string[];
};

export type WaterFaultLifecycleRecord = {
  recordNumber: string;
  status: WaterFaultLifecycleStatus;
  priority: WaterFaultPriority;
  faultType: WaterFaultType;

  title: string;
  description: string;

  source: WaterFaultRecordSource;
  sourceReference?: string;

  recordedBy: WaterFaultActor;
  givenTo?: WaterFaultActor;
  assignedTo?: WaterFaultActor;
  completedBy?: WaterFaultActor;
  deliveredBy?: WaterFaultActor;
  checkedBy?: WaterFaultActor;
  finalApprovedBy?: WaterFaultActor;

  timestamps: WaterFaultTimestampSet;
  location: WaterFaultLocationLink;

  contactName?: string;
  contactPhone?: string;

  materials: WaterFaultMaterialLine[];
  excavation: WaterFaultExcavation;
  audioTranscript: WaterFaultAudioTranscript;
  evidence: WaterFaultEvidence[];
  signatureEvents: WaterFaultSignatureEvent[];
  communicationEvents: WaterFaultCommunicationEvent[];

  workerNotes: string[];
  supervisorNotes: string[];
  managementNotes: string[];
  founderAdminNotes: string[];
  aiNotes: string[];
  approvalNotes: string[];

  approvalState: WaterFaultApprovalState;
  aiChecks: WaterFaultAiCheck[];
  managementMetrics: WaterFaultManagementMetrics;

  recordLocked: boolean;
  lockedReason?: string;
};

export const WATER_FAULT_REQUIRED_FIELDS_BY_STAGE = {
  pending_approval: [
    "recordNumber",
    "recordedAt",
    "source",
    "recordedBy",
    "title",
    "description",
    "status",
  ],
  assigned_to_crew: [
    "assignedTo",
    "assignedAt",
    "priority",
  ],
  crew_arrived: [
    "crewArrivedAt",
  ],
  completed_by_crew: [
    "completedBy",
    "completedAt",
    "materials",
    "workTime",
    "photoOrNote",
  ],
  delivered_by_worker: [
    "deliveredBy",
    "deliveredAt",
    "signatureOrConfirmation",
  ],
  approved_by_founder_admin: [
    "checkedBy",
    "checkedAt",
    "finalApprovedBy",
    "approvedAt",
    "aiMissingDataCheck",
  ],
  locked: [
    "finalApproval",
    "recordLocked",
    "auditTrail",
  ],
} as const;

export const WATER_FAULT_AI_REMINDERS = [
  "Πάτησες άφιξη;",
  "Πάτησες αναχώρηση;",
  "Έβαλες υλικά;",
  "Έβαλες αν έγινε εκσκαφή;",
  "Έβαλες είδος και διαστάσεις εκσκαφής;",
  "Έβγαλες φωτογραφία πριν σκεπαστεί;",
  "Έβγαλες φωτογραφία μετά την αποκατάσταση;",
  "Λείπει υπογραφή ή επιβεβαίωση παράδοσης.",
  "Δεν έχει δηλωθεί ποια βάνα έκλεισε.",
  "Δεν έχει δηλωθεί κοντινός αγωγός ή ζώνη.",
  "Η περιοχή έχει επαναλαμβανόμενες βλάβες. Χρειάζεται έλεγχος ιστορικού.",
  "Υπάρχει πιθανή απώλεια νερού. Χρειάζεται εκτίμηση χρόνου και περιοχής.",
  "Υπάρχει ηχητικό χωρίς εγκεκριμένη μεταγραφή.",
  "Το AI προτείνει έλεγχο, αλλά δεν εγκρίνει μόνο του.",
] as const;

export const WATER_FAULT_OFFICIAL_WORKFLOW = [
  "Καταχώρηση από εργάτη / πολίτη / τηλεφωνικό κέντρο / scanner / PDF / φωτογραφία / ηχητικό / χάρτη.",
  "Αυτόματη δημιουργία φακέλου με αύξον αριθμό, ημερομηνία, ώρα, πηγή, συσκευή και χρήστη.",
  "Μεταγραφή ηχητικού σε κείμενο, με διατήρηση αρχικού ηχητικού.",
  "Έλεγχος επιστάτη για προτεραιότητα, ανάθεση, σημείωση και επιβεβαίωση.",
  "Εργασία συνεργείου με άφιξη, αναχώρηση, υλικά, εκσκαφή, μηχάνημα, φωτογραφίες και ηχητικά.",
  "Παράδοση από υπεύθυνο με ημερομηνία, ώρα, σημείωση και υπογραφή ή επιβεβαίωση.",
  "Τελική έγκριση από founder/admin ή αρμόδιο υπεύθυνο.",
  "Κλείδωμα φακέλου με πλήρες ιστορικό και χωρίς κρυφή αλλαγή.",
] as const;

export const WATER_FAULT_REPORTING_DIMENSIONS = [
  "μέσος χρόνος απόκρισης",
  "μέσος χρόνος αποκατάστασης",
  "χρόνος εργασίας",
  "πιθανές απώλειες νερού",
  "κόστος ανά περιοχή",
  "κόστος ανά συνεργείο",
  "περιοχές με επαναλαμβανόμενες βλάβες",
  "υλικά που ξοδεύονται πολύ",
  "εκκρεμότητες",
  "σημεία χωρίς επαρκή στοιχεία",
  "προτάσεις αντικατάστασης αγωγών",
  "έργα που πρέπει να προγραμματιστούν",
] as const;

export const WATER_FAULT_AI_BOUNDARIES = [
  "Το AI βλέπει, υπενθυμίζει, ελέγχει, προτείνει και οργανώνει.",
  "Το AI δεν εγκρίνει μόνο του.",
  "Το AI δεν αλλάζει master data μόνο του.",
  "Κανένα AI αποτέλεσμα δεν γίνεται επίσημη αλήθεια χωρίς ανθρώπινη έγκριση.",
  "Κάθε αλλαγή αφήνει ίχνος.",
  "Κανένα αρχείο δεν χάνεται.",
] as const;
