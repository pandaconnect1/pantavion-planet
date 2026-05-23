export type WaterAIKernelStage =
  | "observe"
  | "classify"
  | "check_missing_data"
  | "route"
  | "remind"
  | "map_context"
  | "risk_analysis"
  | "report_prepare"
  | "human_approval_required"
  | "audit";

export type WaterAISeverity =
  | "info"
  | "warning"
  | "high"
  | "critical";

export type WaterAIRouteTarget =
  | "field_worker"
  | "technician"
  | "supervisor"
  | "chief_supervisor"
  | "warehouse"
  | "accounting"
  | "management"
  | "founder_admin";

export type WaterAIActionKind =
  | "ask_missing_field"
  | "send_to_responsible"
  | "send_to_superior"
  | "send_to_founder_admin"
  | "remind_worker"
  | "remind_supervisor"
  | "open_map_context"
  | "request_photo"
  | "request_audio_or_note"
  | "request_materials"
  | "request_arrival_departure"
  | "request_signature"
  | "prepare_report"
  | "block_final_approval"
  | "allow_human_review";

export type WaterAIFaultInput = {
  recordNumber?: string;
  title?: string;
  description?: string;
  source?: string;
  faultType?: string;
  priority?: string;
  status?: string;
  createdByRole?: string;
  assignedToRole?: string;
  assignedToUserId?: string;
  areaLabel?: string;
  roadLabel?: string;
  zoneLabel?: string;
  nearestPipeId?: string;
  nearestValveId?: string;
  mapLinked?: boolean;
  materialsDeclared?: boolean;
  excavationDeclared?: boolean;
  arrivalAt?: string;
  departureAt?: string;
  deliveredAt?: string;
  photosBeforeCount?: number;
  photosAfterCount?: number;
  audioRefsCount?: number;
  transcriptText?: string;
  transcriptStatus?: string;
  signatureEventsCount?: number;
  repeatedFaultsNearbyCount?: number;
  possibleWaterLoss?: boolean;
  isFounderOnly?: boolean;
};

export type WaterAIMissingField = {
  key: string;
  label: string;
  severity: WaterAISeverity;
  askUser: string;
  requiredForFinalApproval: boolean;
};

export type WaterAIRiskHint = {
  key: string;
  severity: WaterAISeverity;
  message: string;
  suggestedAction: string;
};

export type WaterAIKernelAction = {
  kind: WaterAIActionKind;
  target: WaterAIRouteTarget;
  severity: WaterAISeverity;
  message: string;
  humanApprovalRequired: boolean;
};

export type WaterAIKernelDecision = {
  recordNumber: string;
  stages: WaterAIKernelStage[];
  missingFields: WaterAIMissingField[];
  riskHints: WaterAIRiskHint[];
  actions: WaterAIKernelAction[];
  suggestedRoute: WaterAIRouteTarget;
  canBeFinalApproved: boolean;
  founderAdminMustReview: boolean;
  auditRequired: boolean;
  summary: string;
};

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function count(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function missing(
  key: string,
  label: string,
  severity: WaterAISeverity,
  askUser: string,
  requiredForFinalApproval = true,
): WaterAIMissingField {
  return {
    key,
    label,
    severity,
    askUser,
    requiredForFinalApproval,
  };
}

function risk(
  key: string,
  severity: WaterAISeverity,
  message: string,
  suggestedAction: string,
): WaterAIRiskHint {
  return {
    key,
    severity,
    message,
    suggestedAction,
  };
}

function action(
  kind: WaterAIActionKind,
  target: WaterAIRouteTarget,
  severity: WaterAISeverity,
  message: string,
  humanApprovalRequired = true,
): WaterAIKernelAction {
  return {
    kind,
    target,
    severity,
    message,
    humanApprovalRequired,
  };
}

export function detectWaterAIMissingFields(input: WaterAIFaultInput): WaterAIMissingField[] {
  const fields: WaterAIMissingField[] = [];

  if (!hasText(input.title)) {
    fields.push(missing("title", "Τίτλος", "warning", "Γράψε σύντομο τίτλο για τη βλάβη."));
  }

  if (!hasText(input.description) && !hasText(input.transcriptText)) {
    fields.push(
      missing(
        "description_or_transcript",
        "Περιγραφή ή ηχητική μεταγραφή",
        "warning",
        "Γράψε περιγραφή ή μίλησε για να γίνει μεταγραφή.",
      ),
    );
  }

  if (!hasText(input.areaLabel) && !hasText(input.roadLabel) && !hasText(input.zoneLabel)) {
    fields.push(
      missing(
        "location",
        "Τοποθεσία",
        "high",
        "Λείπει τοποθεσία. Βάλε περιοχή, οδό, ζώνη ή GPS όταν υπάρχει.",
      ),
    );
  }

  if (!input.mapLinked) {
    fields.push(
      missing(
        "map_link",
        "Σύνδεση με χάρτη",
        "warning",
        "Δεν έχει συνδεθεί ακόμα η βλάβη με χάρτη, ζώνη, αγωγό ή βάνα.",
        false,
      ),
    );
  }

  if (!hasText(input.nearestValveId)) {
    fields.push(
      missing(
        "nearest_valve",
        "Κοντινή βάνα",
        "warning",
        "Δεν έχει δηλωθεί ποια κοντινή βάνα επηρεάζεται ή πρέπει να ελεγχθεί.",
        false,
      ),
    );
  }

  if (!input.arrivalAt && ["assigned", "in_progress", "completed", "delivered"].includes(input.status || "")) {
    fields.push(
      missing(
        "arrival_at",
        "Άφιξη συνεργείου",
        "high",
        "Πάτησες άφιξη; Αν πήγε συνεργείο, πρέπει να υπάρχει ώρα άφιξης.",
      ),
    );
  }

  if (!input.departureAt && ["completed", "delivered"].includes(input.status || "")) {
    fields.push(
      missing(
        "departure_at",
        "Αναχώρηση συνεργείου",
        "high",
        "Πάτησες αναχώρηση; Χρειάζεται ώρα αναχώρησης για χρόνο εργασίας.",
      ),
    );
  }

  if (input.materialsDeclared !== true && ["completed", "delivered"].includes(input.status || "")) {
    fields.push(
      missing(
        "materials",
        "Υλικά",
        "warning",
        "Έβαλες υλικά; Αν χρησιμοποιήθηκαν υλικά, πρέπει να καταχωρηθούν.",
      ),
    );
  }

  if (input.excavationDeclared !== true && ["completed", "delivered"].includes(input.status || "")) {
    fields.push(
      missing(
        "excavation",
        "Εκσκαφή",
        "warning",
        "Έβαλες αν έγινε εκσκαφή; Αν έγινε, χρειάζεται είδος/διαστάσεις.",
      ),
    );
  }

  if (count(input.photosBeforeCount) === 0 && ["in_progress", "completed", "delivered"].includes(input.status || "")) {
    fields.push(
      missing(
        "photo_before",
        "Φωτογραφία πριν",
        "warning",
        "Δεν υπάρχει φωτογραφία πριν το σκέπασμα.",
        false,
      ),
    );
  }

  if (count(input.signatureEventsCount) === 0 && ["delivered", "pending_final_approval"].includes(input.status || "")) {
    fields.push(
      missing(
        "signature",
        "Υπογραφή / επιβεβαίωση",
        "high",
        "Λείπει υπογραφή ή επιβεβαίωση παράδοσης.",
      ),
    );
  }

  return fields;
}

export function detectWaterAIRisks(input: WaterAIFaultInput): WaterAIRiskHint[] {
  const risks: WaterAIRiskHint[] = [];

  if (count(input.repeatedFaultsNearbyCount) >= 3) {
    risks.push(
      risk(
        "repeated_faults_nearby",
        "high",
        "Η περιοχή έχει επαναλαμβανόμενες βλάβες.",
        "Να ελεγχθεί ο αγωγός/ζώνη για πιθανή αντικατάσταση ή βαθύτερη αιτία.",
      ),
    );
  }

  if (input.possibleWaterLoss) {
    risks.push(
      risk(
        "possible_water_loss",
        "high",
        "Υπάρχει πιθανή απώλεια νερού.",
        "Να μπει προτεραιότητα και να καταγραφεί χρόνος απόκρισης/αποκατάστασης.",
      ),
    );
  }

  if (!hasText(input.nearestPipeId) && input.mapLinked) {
    risks.push(
      risk(
        "map_missing_pipe",
        "warning",
        "Η βλάβη έχει χάρτη αλλά δεν συνδέθηκε με αγωγό.",
        "Να γίνει AI/human map linkage πριν τον τελικό φάκελο.",
      ),
    );
  }

  if (input.isFounderOnly) {
    risks.push(
      risk(
        "founder_only_record",
        "critical",
        "Ο φάκελος έχει founder-only χαρακτήρα.",
        "Να μην εγκριθεί ή διανεμηθεί χωρίς founder/admin έλεγχο.",
      ),
    );
  }

  return risks;
}

export function suggestWaterAIRoute(input: WaterAIFaultInput, risks: WaterAIRiskHint[]): WaterAIRouteTarget {
  if (input.isFounderOnly) return "founder_admin";
  if (risks.some((item) => item.severity === "critical")) return "founder_admin";
  if (risks.some((item) => item.key === "repeated_faults_nearby")) return "chief_supervisor";
  if (input.faultType === "materials" || input.materialsDeclared === false) return "warehouse";
  if (input.status === "pending_final_approval") return "founder_admin";
  if (input.assignedToRole === "technician") return "technician";

  return "supervisor";
}

export function decideWaterAIKernel(input: WaterAIFaultInput): WaterAIKernelDecision {
  const recordNumber = hasText(input.recordNumber) ? String(input.recordNumber) : "pending-record";
  const missingFields = detectWaterAIMissingFields(input);
  const riskHints = detectWaterAIRisks(input);
  const suggestedRoute = suggestWaterAIRoute(input, riskHints);

  const blocksFinalApproval =
    missingFields.some((item) => item.requiredForFinalApproval && ["high", "critical"].includes(item.severity)) ||
    riskHints.some((item) => item.severity === "critical");

  const actions: WaterAIKernelAction[] = [];

  for (const field of missingFields) {
    actions.push(
      action(
        "ask_missing_field",
        input.createdByRole === "field_worker" ? "field_worker" : "supervisor",
        field.severity,
        field.askUser,
        false,
      ),
    );
  }

  for (const item of riskHints) {
    actions.push(
      action(
        item.severity === "critical" ? "send_to_founder_admin" : "send_to_superior",
        item.severity === "critical" ? "founder_admin" : "chief_supervisor",
        item.severity,
        `${item.message} ${item.suggestedAction}`,
        true,
      ),
    );
  }

  if (!input.mapLinked) {
    actions.push(
      action(
        "open_map_context",
        "supervisor",
        "warning",
        "Να ανοιχτεί map context για σύνδεση βλάβης με ζώνη, αγωγό ή βάνα.",
        true,
      ),
    );
  }

  if (blocksFinalApproval) {
    actions.push(
      action(
        "block_final_approval",
        "founder_admin",
        "high",
        "Δεν επιτρέπεται τελική έγκριση μέχρι να συμπληρωθούν κρίσιμα στοιχεία.",
        true,
      ),
    );
  } else {
    actions.push(
      action(
        "allow_human_review",
        "founder_admin",
        "info",
        "Ο φάκελος μπορεί να πάει για ανθρώπινη τελική αξιολόγηση.",
        true,
      ),
    );
  }

  return {
    recordNumber,
    stages: [
      "observe",
      "classify",
      "check_missing_data",
      "route",
      "remind",
      "map_context",
      "risk_analysis",
      "report_prepare",
      "human_approval_required",
      "audit",
    ],
    missingFields,
    riskHints,
    actions,
    suggestedRoute,
    canBeFinalApproved: !blocksFinalApproval,
    founderAdminMustReview: true,
    auditRequired: true,
    summary: `AI Kernel: ${missingFields.length} ελλείψεις, ${riskHints.length} ρίσκα, προώθηση προς ${suggestedRoute}.`,
  };
}

export const WATER_AI_OPERATIONS_KERNEL_DOCTRINE = {
  title: "Pantavion Water AI Operations Kernel",
  purpose:
    "Το Pantavion Water AI δεν είναι απλή φόρμα. Παρατηρεί, ελέγχει, ταξινομεί, προτείνει, υπενθυμίζει, συνδέει με χάρτη/ιστορικό και ζητά ανθρώπινη έγκριση.",
  hardLimits: [
    "Το AI δεν εγκρίνει τελικά βλάβη μόνο του.",
    "Το AI δεν αλλάζει master χάρτη, αγωγό, βάνα ή ζώνη μόνο του.",
    "Το AI δεν κάνει επίσημη αλήθεια χωρίς ανθρώπινη έγκριση.",
    "Το AI δεν εμφανίζει ιδιωτικά δεδομένα χωρίς σωστή ταυτότητα/ρόλο/session.",
    "Κάθε AI εισήγηση πρέπει να αφήνει audit trail.",
  ],
  operatingLoop: [
    "Observe",
    "Compare",
    "Detect missing data",
    "Route to correct person",
    "Remind responsible user",
    "Connect map and history",
    "Warn risk",
    "Prepare report",
    "Ask human approval",
    "Keep audit trail",
  ],
} as const;