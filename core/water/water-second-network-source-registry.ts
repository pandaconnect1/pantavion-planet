export const WATER_SECOND_NETWORK_SOURCE = {
  id: "limassol-dwg-master-2025-2026",
  title: "εύτερη προστατευμένη πηγή δικτύου ύδρευσης",
  fileName: "MASTER 2025_M_15.1.2026_ANDREASPAP-01-02-014.dwg",
  storageLabel: "Vercel Blob",
  blobStore: "pantavion-water-network",
  approximateSize: "205 MB",
  statusLabel: "νέβηκε — αναμονή επεξεργασίας",
  visibilityLabel: "όνο ιδρυτής / εξουσιοδοτημένοι",
  sourceType: "DWG",
  purpose:
    "α χρησιμοποιηθεί ως δεύτερη προστατευμένη πηγή δικτύου για σύγκριση, συμπλήρωση, έλεγχο και μελλοντική παραγωγή ελαφριών layers.",
  notYet:
    "εν είναι ακόμη live χάρτης και δεν πρέπει να φορτωθεί απευθείας στον browser ως DWG.",
  requiredNextSteps: [
    "αταχώρηση ασφαλούς Blob URL σε founder-only source vault.",
    "ετατροπή DWG/DXF σε ελεγχόμενο ενδιάμεσο αρχείο.",
    "ξαγωγή ελαφριών layers για browser.",
    "ύγκριση με το υπάρχον live δίκτυο.",
    "μφάνιση ως ίκτυο 2 μόνο με toggle και founder approval.",
    "αμία αντικατάσταση του υπάρχοντος live map χωρίς έλεγχο.",
  ],
  protectionRules: [
    "ο υπάρχον live map δεν αγγίζεται.",
    "ο DWG master δεν αλλάζει από το Pantavion.",
    "εν δημοσιεύεται raw DWG σε χρήστες.",
    "εν γίνεται αυτόματη συγχώνευση στο κύριο δίκτυο.",
    "Όλες οι διαφορές μπαίνουν σε pending approval.",
    " ιδρυτής εγκρίνει τι γίνεται κοινό.",
  ],
} as const;

export const WATER_NETWORK_LAYER_PLAN = [
  {
    layer: "ίκτυο 1",
    status: "πάρχον εγκεκριμένο live δίκτυο",
    meaning: "ο υπάρχον εγκεκριμένο live δίκτυο που ήδη λειτουργεί.",
  },
  {
    layer: "ίκτυο 2",
    status: "DWG ανεβασμένο — αναμονή μετατροπής",
    meaning:
      "ο DWG master source στο Vercel Blob. πάρχει ως πηγή, αλλά δεν είναι ακόμη ελαφρύ live layer.",
  },
  {
    layer: "ύγκριση",
    status: "ελλοντική λειτουργία σύγκρισης",
    meaning:
      "ελλοντική λειτουργία που θα δείχνει διαφορές, ελλείψεις, πιθανές βάνες, σωλήνες, οδούς και διορθώσεις.",
  },
] as const;