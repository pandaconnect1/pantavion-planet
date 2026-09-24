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
  service_leak: "Διαρροή παροχής",
  low_pressure: "ΧΧαμηλή πίεση",
  no_water: "Χωρίς νερό",
  broken_valve: "Χαλασμένη βάνα / ρεούλα",
  valve_not_found: "Βάνα / ρεούλα δεν βρέθηκε",
  valve_not_closing: "Βάνα / ρεούλα δεν κλείνει",
  tank_leak: "Διαρροή δεξαμενής",
  suspected_loss: "Ύποπτη απώλεια νερού",
  road_safety: "Κίνδυνος δρόμου / ασφάλειας",
  after_works_fault: "Βλάβη μετά από έργο",
  other: "Άλλη βλάβη",
};

export const WATER_FAULT_PRIORITY_LABELS: Record<WaterFaultPriority, string> = {
  critical: "Κρίσιμη",
  high: "Υψηλή",
  normal: "Κανονική",
  low: "Χαμηλή",
};

export const WATER_FAULT_STATUS_LABELS: Record<WaterFaultStatus, string> = {
  new: "Νέα",
  assigned: "Ανατέθηκε",
  in_progress: "Σε εξέλιξη",
  waiting_materials: "Αναμονή υλικών",
  waiting_supervisor: "Αναμονή επιστάτη",
  completed: "Ολοκληρώθηκε",
  needs_review: "Χρειάζεται έλεγχο",
  archived: "Αρχείο",
};

export const WATER_FAULT_PRIORITY_ORDER: Record<WaterFaultPriority, number> = {
  critical: 1,
  high: 2,
  normal: 3,
  low: 4,
};

export const WATER_FAULT_REGISTRY_DOCTRINE = {
  name: "Μητρώο Βλαβών Ύδρευσης",
  purpose:
    "Κάθε βλάβη καταγράφεται με περιοχή, οδό, είδος, προτεραιότητα, συνεργείο, υλικά, αποκοπή νερού, βάνες/ρεούλες και κατάσταση.",
  safety:
    "Η καταχώρηση δεν αλλάζει το κύριο δίκτυο. ρώτα γίνεται αΑρχείο, μετά έλεγχος επιστάτη, μετά έγκριση και μόνο τότε μπορεί να ενημερώσει κοινό χάρτη ή κύριο μητρώο.",
  nextDatabaseStep:
    "Η πρώτη έκδοση αποθηκεύει στη συσκευή. Η επόμενη έκδοση θα συνδεθεί με πραγματική βάση δεδομένων και API για μόνιμη οργανισμική χρήση.",
} as const;