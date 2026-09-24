export const WATER_SECOND_NETWORK_SOURCE = {
  id: "limassol-dwg-master-2025-2026",
  title: "Δεύτερη προστατευμένη πηγή δικτύου ύδρευσης",
  fileName: "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
  storageLabel: "Pantavion private source vault",
  blobStore: "Supabase personal-media / protected source-master target",
  approximateSize: "205.565.159 bytes",
  statusLabel: "Αυθεντικό binary ανακτήθηκε και επαληθεύτηκε — production storage transfer pending",
  visibilityLabel: "Μόνο ιδρυτής / εξουσιοδοτημένοι",
  sourceType: "DWG / AC1032",
  purpose:
    "Να χρησιμοποιηθεί ως προστατευμένη πηγή Map B για σύγκριση, έλεγχο και παραγωγή ελαφριών viewport layers χωρίς αλλοίωση του master.",
  notYet:
    "Δεν φορτώνεται raw DWG στον browser και δεν αντικαθιστά τον Map A.",
  requiredNextSteps: [
    "Μεταφορά του αυθεντικού binary στο ιδιωτικό Supabase source vault.",
    "Επαλήθευση ακριβούς byte-size και SHA-256 μετά τη μεταφορά.",
    "Παραγωγή ελεγχόμενων derived viewport layers.",
    "Σύγκριση με τα άλλα recovered masters χωρίς αυτόματη συγχώνευση.",
    "Δημοσίευση μόνο σε εγκεκριμένους χρήστες μέσω protected MapServer layer.",
  ],
  protectionRules: [
    "Ο Map A δεν αγγίζεται.",
    "Κανένα recovered master δεν αντικαθιστά άλλο master.",
    "Raw DWG δεν εκτίθεται δημόσια.",
    "Δεν γίνεται αυτόματη γεωμετρική συγχώνευση.",
    "Κάθε derived layer διατηρεί provenance προς το αυθεντικό source.",
  ],
} as const;

export const WATER_RECOVERED_MASTER_SOURCES = [
  {
    id: "map-b-canonical",
    role: "canonical_map_b",
    fileName: "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
    sizeBytes: 205565159,
    sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
    dwgHeader: "AC1032",
    state: "authentic_binary_recovered",
    classification: "Map B canonical source",
  },
  {
    id: "map-a-original",
    role: "canonical_map_a_owner_confirmed",
    fileName: "GEORGE_MAP_MASTER_B_C_FINAL.dwg",
    sizeBytes: 205877448,
    sha256: "0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9",
    dwgHeader: "AC1032",
    state: "authentic_binary_recovered_owner_confirmed",
    classification: "Map A authentic original — owner-confirmed; historical filename retained unchanged",
  },
  {
    id: "legacy-master-2025-09-22",
    role: "legacy_candidate_master",
    fileName: "MASTER 2025_Μ_15.1.2025_ANDREASPAP.dwg 22-9-2025",
    sizeBytes: 218850248,
    sha256: "9555d17904ceae39a14482db228c5d5fe3e0a961e7bb78b89418896d68eb3ebb",
    dwgHeader: "AC1032",
    state: "authentic_binary_recovered",
    classification: "Recovered older master — Map A relationship not yet proven",
  },
] as const;

export const WATER_NETWORK_LAYER_PLAN = [
  {
    layer: "Δίκτυο A",
    status: "Authentic original recovered / owner-confirmed / storage transfer pending",
    meaning:
      "Το αυθεντικό Map A έχει ταυτοποιηθεί από τον ιδιοκτήτη ως GEORGE_MAP_MASTER_B_C_FINAL.dwg και διατηρείται byte-for-byte χωρίς μετατροπή. Η μεταφορά στο private source vault και η live σύνδεση παραμένουν ξεχωριστά verification gates.",
  },
  {
    layer: "Map B",
    status: "Αυθεντικό DWG recovered / hash-verified",
    meaning:
      "Ο canonical Map B master έχει ανακτηθεί χωρίς αλλοίωση και παραμένει ξεχωριστός από το A.",
  },
  {
    layer: "Other recovered masters",
    status: "Recovered / isolated / comparison pending",
    meaning:
      "Ο canonical Map B και ο παλαιότερος 2025 master παραμένουν ξεχωριστοί από το owner-confirmed Map A, χωρίς merge ή geometry mutation.",
  },
] as const;
