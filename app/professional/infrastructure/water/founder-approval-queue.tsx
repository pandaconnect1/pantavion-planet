"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

type AccessStatus = "pending" | "approved" | "rejected" | "needs_identity_review";

type IdentityCheck = {
  verified: boolean;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  supervisor: string;
  deviceName: string;
  deviceFingerprint: string;
  lastKnownLocation: string;
  lastLogin: string;
  identityMethod: string;
};

type AccessRequest = {
  id: string;
  submittedAt: string;
  requester: IdentityCheck;
  role: string;
  area: string;
  assetScope: string;
  reason: string;
  requestedAccess: string;
  duration: string;
  exportAllowed: boolean;
  downloadAllowed: boolean;
  riskLevel: "low" | "medium" | "high";
  status: AccessStatus;
};

const initialRequests: AccessRequest[] = [
  {
    id: "REQ-WATER-001",
    submittedAt: "09/05/2026 06:18",
    requester: {
      verified: true,
      employeeId: "EMP-FIELD-014",
      fullName: "Ανδρέας Γεωργίου",
      email: "andreas.georgiou@example.local",
      phone: "+357 XX XXX014",
      department: "Τεχνική Υπηρεσία / Συνεργείο Βλαβών",
      supervisor: "Επιστάτης βάρδιας",
      deviceName: "Samsung Android field phone",
      deviceFingerprint: "DEV-WATER-A7F2-014",
      lastKnownLocation: "Κάτω Πολεμίδια / κοντά στο δηλωμένο σημείο",
      lastLogin: "09/05/2026 06:11",
      identityMethod: "Επαληθευμένος λογαριασμός + εγκεκριμένη συσκευή",
    },
    role: "Τεχνίτης / εργάτης πεδίου",
    area: "Τομέας ύδρευσης Λεμεσού",
    assetScope: "Αγωγοί + βάνες μόνο για την περιοχή εργασίας",
    reason: "Υπόδειξη αγωγού πριν από εκσκαφή.",
    requestedAccess: "Προβολή layer χωρίς export και χωρίς λήψη KMZ/KML",
    duration: "Σήμερα / βάρδια εργασίας",
    exportAllowed: false,
    downloadAllowed: false,
    riskLevel: "medium",
    status: "pending",
  },
  {
    id: "REQ-WATER-002",
    submittedAt: "09/05/2026 06:24",
    requester: {
      verified: true,
      employeeId: "EMP-SUP-003",
      fullName: "Μάριος Νικολάου",
      email: "marios.nikolaou@example.local",
      phone: "+357 XX XXX003",
      department: "Τεχνική Υπηρεσία / Επιστάτες",
      supervisor: "Αρχιεπιστάτης",
      deviceName: "iPad supervisor tablet",
      deviceFingerprint: "DEV-WATER-IPAD-003",
      lastKnownLocation: "Λεμεσός / περιοχή νέας ανάπτυξης",
      lastLogin: "09/05/2026 06:17",
      identityMethod: "Επαληθευμένος λογαριασμός + εγκεκριμένη συσκευή",
    },
    role: "Επιστάτης",
    area: "Περιοχή νέας ανάπτυξης",
    assetScope: "Παροχές, βάνες, σημειώσεις συνεργείου",
    reason: "Έλεγχος θέσης παροχών και βανών για συνεργείο.",
    requestedAccess: "Προβολή + καταχώρηση παρατήρησης",
    duration: "24 ώρες",
    exportAllowed: false,
    downloadAllowed: false,
    riskLevel: "medium",
    status: "pending",
  },
  {
    id: "REQ-WATER-003",
    submittedAt: "09/05/2026 06:31",
    requester: {
      verified: false,
      employeeId: "UNKNOWN",
      fullName: "Άγνωστος χρήστης",
      email: "unknown@example.local",
      phone: "Δεν επιβεβαιώθηκε",
      department: "Δεν επιβεβαιώθηκε",
      supervisor: "Δεν επιβεβαιώθηκε",
      deviceName: "Άγνωστη συσκευή",
      deviceFingerprint: "UNVERIFIED-DEVICE",
      lastKnownLocation: "Άγνωστη / εκτός δηλωμένης περιοχής",
      lastLogin: "Δεν υπάρχει επιβεβαιωμένο login",
      identityMethod: "Ανεπαρκής ταυτοποίηση",
    },
    role: "Άγνωστος ρόλος",
    area: "Ιδιωτικό layer ύδρευσης",
    assetScope: "Μη επιτρεπτό μέχρι επαλήθευση",
    reason: "Δεν δηλώθηκε επαρκής σκοπός.",
    requestedAccess: "Προβολή δικτύου",
    duration: "Άγνωστη",
    exportAllowed: false,
    downloadAllowed: false,
    riskLevel: "high",
    status: "needs_identity_review",
  },
];

function statusLabel(status: AccessStatus) {
  if (status === "approved") return "Εγκρίθηκε";
  if (status === "rejected") return "Απορρίφθηκε";
  if (status === "needs_identity_review") return "Θέλει ταυτοποίηση";
  return "Σε αναμονή";
}

function riskLabel(risk: AccessRequest["riskLevel"]) {
  if (risk === "high") return "Υψηλό ρίσκο";
  if (risk === "medium") return "Μεσαίο ρίσκο";
  return "Χαμηλό ρίσκο";
}

export default function FounderApprovalQueue() {
  const [requests, setRequests] = useState(initialRequests);
  const [openRequestId, setOpenRequestId] = useState<string | null>(initialRequests[0]?.id || null);

  function updateRequest(id: string, status: AccessStatus) {
    setRequests((current) =>
      current.map((request) => {
        if (request.id !== id) return request;

        if (status === "approved" && !request.requester.verified) {
          return { ...request, status: "needs_identity_review" };
        }

        return { ...request, status };
      })
    );
  }

  const selectedRequest = useMemo(() => {
    return requests.find((request) => request.id === openRequestId) || requests[0] || null;
  }, [requests, openRequestId]);

  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const identityReviewCount = requests.filter(
    (request) => request.status === "needs_identity_review"
  ).length;

  return (
    <section style={styles.panel}>
      <p style={styles.label}>ΑΙΤΗΜΑΤΑ ΠΡΟΣ ΕΣΕΝΑ</p>
      <h3 style={styles.title}>Έλεγχος πρόσβασης από Αρχή</h3>
      <p style={styles.owner}>Αρχή / τελική έγκριση: Γιώργος</p>

      <div style={styles.summaryGrid}>
        <span>
          Εκκρεμή: <strong>{pendingCount}</strong>
        </span>
        <span>
          Θέλουν ταυτοποίηση: <strong>{identityReviewCount}</strong>
        </span>
      </div>

      <div style={styles.list}>
        {requests.map((request) => {
          const canApprove = request.requester.verified && request.status !== "approved";
          const isOpen = selectedRequest?.id === request.id;

          return (
            <article
              key={request.id}
              style={{
                ...styles.card,
                ...(isOpen ? styles.cardOpen : {}),
              }}
            >
              <button
                type="button"
                style={styles.cardHeaderButton}
                onClick={() => setOpenRequestId(request.id)}
              >
                <span style={styles.cardTitleGroup}>
                  <strong>{request.requester.fullName}</strong>
                  <small>{request.id}</small>
                </span>

                <span
                  style={{
                    ...styles.status,
                    ...(request.status === "approved"
                      ? styles.approved
                      : request.status === "rejected"
                        ? styles.rejected
                        : request.status === "needs_identity_review"
                          ? styles.identityReview
                          : styles.pending),
                  }}
                >
                  {statusLabel(request.status)}
                </span>
              </button>

              <div style={styles.miniMeta}>
                <span>Ρόλος: {request.role}</span>
                <span>Υπάλληλος: {request.requester.employeeId}</span>
                <span>Ρίσκο: {riskLabel(request.riskLevel)}</span>
              </div>

              {isOpen ? (
                <div style={styles.details}>
                  <div style={request.requester.verified ? styles.identityOk : styles.identityBad}>
                    {request.requester.verified
                      ? "Ταυτότητα επαληθευμένη"
                      : "ΜΗ ΕΠΑΛΗΘΕΥΜΕΝΟΣ ΧΡΗΣΤΗΣ - δεν επιτρέπεται έγκριση"}
                  </div>

                  <div style={styles.detailGrid}>
                    <span>Ονοματεπώνυμο</span>
                    <strong>{request.requester.fullName}</strong>

                    <span>Email</span>
                    <strong>{request.requester.email}</strong>

                    <span>Τηλέφωνο</span>
                    <strong>{request.requester.phone}</strong>

                    <span>Τμήμα</span>
                    <strong>{request.requester.department}</strong>

                    <span>Προϊστάμενος</span>
                    <strong>{request.requester.supervisor}</strong>

                    <span>Συσκευή</span>
                    <strong>{request.requester.deviceName}</strong>

                    <span>Device ID</span>
                    <strong>{request.requester.deviceFingerprint}</strong>

                    <span>Τελευταία θέση</span>
                    <strong>{request.requester.lastKnownLocation}</strong>

                    <span>Τελευταία είσοδος</span>
                    <strong>{request.requester.lastLogin}</strong>

                    <span>Μέθοδος ταυτοποίησης</span>
                    <strong>{request.requester.identityMethod}</strong>

                    <span>Περιοχή</span>
                    <strong>{request.area}</strong>

                    <span>Layer / στοιχεία</span>
                    <strong>{request.assetScope}</strong>

                    <span>Ζητά</span>
                    <strong>{request.requestedAccess}</strong>

                    <span>Σκοπός</span>
                    <strong>{request.reason}</strong>

                    <span>Διάρκεια</span>
                    <strong>{request.duration}</strong>

                    <span>Export</span>
                    <strong>{request.exportAllowed ? "Ναι" : "Όχι"}</strong>

                    <span>Λήψη KMZ/KML</span>
                    <strong>{request.downloadAllowed ? "Ναι" : "Όχι"}</strong>
                  </div>

                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={{
                        ...styles.approveButton,
                        ...(!canApprove ? styles.disabledButton : {}),
                      }}
                      disabled={!canApprove}
                      onClick={() => updateRequest(request.id, "approved")}
                    >
                      {canApprove ? "Έγκριση επαληθευμένου" : "Κλειδωμένο μέχρι ταυτοποίηση"}
                    </button>

                    <button
                      type="button"
                      style={styles.rejectButton}
                      onClick={() => updateRequest(request.id, "rejected")}
                    >
                      Απόρριψη
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <p style={styles.note}>
        Κανόνας παραγωγής: καμία έγκριση χωρίς επαληθευμένο χρήστη, ρόλο, συσκευή,
        σκοπό, περιοχή, διάρκεια και audit log. Το σημερινό UI είναι προσωρινό local
        prototype μέχρι να συνδεθεί με πραγματικό auth, database και ιστορικό εγκρίσεων.
      </p>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    padding: 18,
    borderRadius: 24,
    background: "rgba(5,12,24,.86)",
    border: "1px solid rgba(246,200,95,.24)",
    color: "#fff8e7",
  },
  label: {
    margin: "0 0 8px",
    color: "#f6c85f",
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: 1.4,
  },
  title: {
    margin: "0 0 8px",
    fontSize: 22,
  },
  owner: {
    margin: "0 0 10px",
    color: "#9cffd2",
    fontWeight: 900,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 6,
    marginBottom: 14,
    color: "#d8e0f4",
    fontSize: 13,
  },
  list: {
    display: "grid",
    gap: 12,
  },
  card: {
    display: "grid",
    gap: 9,
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,.045)",
    border: "1px solid rgba(216,224,244,.14)",
    color: "#d8e0f4",
    fontSize: 13,
    lineHeight: 1.35,
  },
  cardOpen: {
    border: "1px solid rgba(246,200,95,.45)",
    boxShadow: "0 0 0 1px rgba(246,200,95,.08)",
  },
  cardHeaderButton: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "flex-start",
    border: 0,
    padding: 0,
    background: "transparent",
    color: "#fff8e7",
    textAlign: "left",
    cursor: "pointer",
  },
  cardTitleGroup: {
    display: "grid",
    gap: 3,
  },
  miniMeta: {
    display: "grid",
    gap: 4,
    color: "#d8e0f4",
  },
  status: {
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },
  pending: {
    background: "rgba(255,180,72,.12)",
    color: "#ffd89a",
    border: "1px solid rgba(255,180,72,.32)",
  },
  approved: {
    background: "rgba(69,255,172,.12)",
    color: "#9cffd2",
    border: "1px solid rgba(69,255,172,.32)",
  },
  rejected: {
    background: "rgba(255,73,91,.12)",
    color: "#ff9aa6",
    border: "1px solid rgba(255,73,91,.32)",
  },
  identityReview: {
    background: "rgba(255,73,91,.12)",
    color: "#ffb4bd",
    border: "1px solid rgba(255,73,91,.42)",
  },
  details: {
    display: "grid",
    gap: 11,
    paddingTop: 6,
  },
  identityOk: {
    padding: "8px 10px",
    borderRadius: 12,
    background: "rgba(69,255,172,.1)",
    border: "1px solid rgba(69,255,172,.28)",
    color: "#9cffd2",
    fontWeight: 1000,
  },
  identityBad: {
    padding: "8px 10px",
    borderRadius: 12,
    background: "rgba(255,73,91,.1)",
    border: "1px solid rgba(255,73,91,.35)",
    color: "#ffb4bd",
    fontWeight: 1000,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "120px minmax(0, 1fr)",
    gap: "7px 9px",
    alignItems: "start",
  },
  actions: {
    display: "flex",
    gap: 8,
    marginTop: 5,
  },
  approveButton: {
    flex: 1,
    border: 0,
    borderRadius: 12,
    padding: "10px 12px",
    background: "#f6c85f",
    color: "#071020",
    fontWeight: 1000,
    cursor: "pointer",
  },
  disabledButton: {
    background: "rgba(255,255,255,.08)",
    color: "#d8e0f4",
    cursor: "not-allowed",
  },
  rejectButton: {
    flex: 1,
    borderRadius: 12,
    padding: "10px 12px",
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,73,91,.32)",
    color: "#ffb4bd",
    fontWeight: 1000,
    cursor: "pointer",
  },
  note: {
    margin: "14px 0 0",
    color: "#d8e0f4",
    fontSize: 12,
    lineHeight: 1.45,
  },
};