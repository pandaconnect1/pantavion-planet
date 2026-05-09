"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

type AccessRequest = {
  id: string;
  requester: string;
  role: string;
  area: string;
  reason: string;
  requestedAccess: string;
  duration: string;
  status: "pending" | "approved" | "rejected";
};

const initialRequests: AccessRequest[] = [
  {
    id: "REQ-WATER-001",
    requester: "Συνεργείο Βλάβης 1",
    role: "Τεχνίτης / εργάτης πεδίου",
    area: "Τομέας ύδρευσης Λεμεσού",
    reason: "Πρόσβαση μόνο για υπόδειξη αγωγού πριν από εκσκαφή.",
    requestedAccess: "Προβολή layer χωρίς export και χωρίς λήψη KMZ/KML",
    duration: "Σήμερα / βάρδια εργασίας",
    status: "pending",
  },
  {
    id: "REQ-WATER-002",
    requester: "Επιστάτης βάρδιας",
    role: "Επιστάτης",
    area: "Περιοχή νέας ανάπτυξης",
    reason: "Έλεγχος θέσης παροχών και βανών για συνεργείο.",
    requestedAccess: "Προβολή + καταχώρηση παρατήρησης",
    duration: "24 ώρες",
    status: "pending",
  },
];

export default function FounderApprovalQueue() {
  const [requests, setRequests] = useState(initialRequests);

  function updateRequest(id: string, status: AccessRequest["status"]) {
    setRequests((current) =>
      current.map((request) => (request.id === id ? { ...request, status } : request))
    );
  }

  const pendingCount = requests.filter((request) => request.status === "pending").length;

  return (
    <section style={styles.panel}>
      <p style={styles.label}>ΑΙΤΗΜΑΤΑ ΠΡΟΣ ΕΣΕΝΑ</p>
      <h3 style={styles.title}>Έγκριση πρόσβασης από Αρχή</h3>
      <p style={styles.owner}>Αρχή / τελική έγκριση: Γιώργος</p>
      <p style={styles.summary}>
        Εκκρεμή αιτήματα: <strong>{pendingCount}</strong>
      </p>

      <div style={styles.list}>
        {requests.map((request) => (
          <article key={request.id} style={styles.card}>
            <div style={styles.cardTop}>
              <strong>{request.requester}</strong>
              <span
                style={{
                  ...styles.status,
                  ...(request.status === "approved"
                    ? styles.approved
                    : request.status === "rejected"
                      ? styles.rejected
                      : styles.pending),
                }}
              >
                {request.status === "approved"
                  ? "Εγκρίθηκε"
                  : request.status === "rejected"
                    ? "Απορρίφθηκε"
                    : "Σε αναμονή"}
              </span>
            </div>

            <span>Ρόλος: {request.role}</span>
            <span>Περιοχή: {request.area}</span>
            <span>Ζητά: {request.requestedAccess}</span>
            <span>Σκοπός: {request.reason}</span>
            <span>Διάρκεια: {request.duration}</span>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.approveButton}
                onClick={() => updateRequest(request.id, "approved")}
              >
                Έγκριση
              </button>
              <button
                type="button"
                style={styles.rejectButton}
                onClick={() => updateRequest(request.id, "rejected")}
              >
                Απόρριψη
              </button>
            </div>
          </article>
        ))}
      </div>

      <p style={styles.note}>
        Προσωρινό local approval UI. Στην παραγωγή συνδέεται με auth, database, audit log και πραγματικούς χρήστες.
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
    margin: "0 0 8px",
    color: "#9cffd2",
    fontWeight: 900,
  },
  summary: {
    margin: "0 0 14px",
    color: "#d8e0f4",
  },
  list: {
    display: "grid",
    gap: 12,
  },
  card: {
    display: "grid",
    gap: 7,
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,.045)",
    border: "1px solid rgba(216,224,244,.14)",
    color: "#d8e0f4",
    fontSize: 13,
    lineHeight: 1.35,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    color: "#fff8e7",
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
  },
  rejectButton: {
    flex: 1,
    borderRadius: 12,
    padding: "10px 12px",
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,73,91,.32)",
    color: "#ffb4bd",
    fontWeight: 1000,
  },
  note: {
    margin: "14px 0 0",
    color: "#d8e0f4",
    fontSize: 12,
    lineHeight: 1.45,
  },
};