export type WaterFaultPriority =
  | "critical"
  | "high"
  | "normal"
  | "low";

export type WaterFaultStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "waiting_materials"
  | "waiting_supervisor"
  | "completed"
  | "needs_review"
  | "archived";

export type WaterFaultType =
  | "broken_pipe"
  | "service_leak"
  | "low_pressure"
  | "no_water"
  | "broken_valve"
  | "valve_not_found"
  | "valve_not_closing"
  | "tank_leak"
  | "suspected_loss"
  | "road_safety"
  | "after_works_fault"
  | "other";

export type WaterFaultRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  reportedBy: string;
  area: string;
  street: string;
  number: string;
  postal: string;
  zone: string;
  faultType: WaterFaultType;
  priority: WaterFaultPriority;
  status: WaterFaultStatus;
  assignedCrew: string;
  affectedConsumers: string;
  waterCutoff: boolean;
  valveProblem: boolean;
  materials: string;
  notes: string;
  supervisorDecision: string;
};

export const WATER_FAULT_TYPE_LABELS: Record<WaterFaultType, string> = {
  broken_pipe: "Σπασμένος αγωγός",
  service_leak: "ιαρροή παροχής",
  low_pressure: "αμηλή πίεση",
  no_water: "ωρίς νερό",
  broken_valve: "αλασμένη βάνα / ρεούλα",
  valve_not_found: "άνα / ρεούλα δεν βρέθηκε",
  valve_not_closing: "άνα / ρεούλα δεν κλείνει",
  tank_leak: "ιαρροή δεξαμενής",
  suspected_loss: "Ύποπτη απώλεια νερού",
  road_safety: "ίνδυνος δρόμου / ασφάλειας",
  after_works_fault: "λάβη μετά από έργο",
  other: "Άλλη βλάβη",
};

export const WATER_FAULT_PRIORITY_LABELS: Record<WaterFaultPriority, string> = {
  critical: "ρίσιμη",
  high: "ψηλή",
  normal: "ανονική",
  low: "αμηλή",
};

export const WATER_FAULT_STATUS_LABELS: Record<WaterFaultStatus, string> = {
  new: "έα",
  assigned: "νατέθηκε",
  in_progress: "Σε εξέλιξη",
  waiting_materials: "ναμονή υλικών",
  waiting_supervisor: "ναμονή επιστάτη",
  completed: "λοκληρώθηκε",
  needs_review: "ρειάζεται έλεγχο",
  archived: "ρχείο",
};

export const WATER_FAULT_PRIORITY_ORDER: Record<WaterFaultPriority, number> = {
  critical: 1,
  high: 2,
  normal: 3,
  low: 4,
};

export const WATER_FAULT_REGISTRY_DOCTRINE = {
  name: "ητρώο λαβών Ύδρευσης",
  purpose:
    "άθε βλάβη καταγράφεται με περιοχή, οδό, είδος, προτεραιότητα, συνεργείο, υλικά, αποκοπή νερού, βάνες/ρεούλες και κατάσταση.",
  safety:
    " καταχώρηση δεν αλλάζει το κύριο δίκτυο. ρώτα γίνεται αρχείο, μετά έλεγχος επιστάτη, μετά έγκριση και μόνο τότε μπορεί να ενημερώσει κοινό χάρτη ή κύριο μητρώο.",
  nextDatabaseStep:
    " πρώτη έκδοση αποθηκεύει στη συσκευή.  επόμενη έκδοση θα συνδεθεί με πραγματική βάση δεδομένων και API για μόνιμη οργανισμική χρήση.",
} as const;