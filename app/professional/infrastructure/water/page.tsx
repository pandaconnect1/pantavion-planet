import type { CSSProperties } from "react";
import WaterNetworkClient from "./water-network-client";
import FounderApprovalQueue from "./founder-approval-queue";

const officialLayers = [
  "Αγωγοί ύδρευσης",
  "Κεντρικοί αγωγοί",
  "Βάνες",
  "Παροχές",
  "Μετρητές όπου υπάρχουν",
  "Εξαρτήματα",
  "Παλαιό / αντικατεστημένο δίκτυο",
  "Σημεία τεχνικής διεύθυνσης",
];

const fieldRules = [
  "Ο χάρτης είναι η πρώτη λειτουργία.",
  "Η κίνηση γίνεται με αφή, σύρσιμο και φυσική πλοήγηση.",
  "Το πραγματικό KMZ/KML δεν εκτίθεται δημόσια.",
  "Κάθε ευαίσθητη πρόσβαση εγκρίνεται από την Αρχή.",
  "Το λογιστήριο, η αποθήκη και τα συνεργεία θα συνδεθούν σε επόμενα στάδια.",
];

export default function WaterInfrastructurePage() {
  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <div style={styles.lockBadge}>ΠΡΟΣΤΑΤΕΥΜΕΝΗ ΕΠΑΓΓΕΛΜΑΤΙΚΗ ΕΝΟΤΗΤΑ · ΥΔΡΕΥΣΗ</div>
        <p style={styles.kicker}>Pantavion επαγγελματική υποδομή</p>
        <h1 style={styles.title}>Έλεγχος Δικτύου Ύδρευσης</h1>
        <p style={styles.subtitle}>
          Πραγματικός χάρτης εργασίας για αγωγούς, βάνες, παροχές, τεχνικές διευθύνσεις,
          βλάβες, φωτογραφίες, συνεργεία και ελεγχόμενη πρόσβαση.
        </p>

        <div style={styles.securityStrip}>
          <span>Καμία δημόσια λήψη KMZ/KML</span>
          <span>Ιδιωτική αποθήκευση</span>
          <span>Έγκριση από Γιώργο</span>
          <span>Audit-ready</span>
          <span>Mobile-first</span>
        </div>
      </section>

      <section style={styles.workspace}>
        <aside style={styles.leftPanel}>
          <section style={styles.panel}>
            <p style={styles.panelLabel}>Επίπεδα δικτύου</p>
            <div style={styles.layerList}>
              {officialLayers.map((layer) => (
                <span key={layer} style={styles.layerItem}>
                  {layer}
                </span>
              ))}
            </div>
          </section>

          <section style={styles.panel}>
            <p style={styles.panelLabel}>Κανόνες πεδίου</p>
            <ul style={styles.ruleList}>
              {fieldRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        </aside>

        <section style={styles.mapPanel}>
          <WaterNetworkClient />
        </section>

        <aside style={styles.rightPanel}>
          <FounderApprovalQueue />

          <section style={styles.panel}>
            <p style={styles.panelLabel}>Τεχνικό αποτέλεσμα</p>
            <p style={styles.panelText}>
              Το module πρέπει να ανοίγει γρήγορα σε PC, tablet και κινητό. Η πλήρης παραγωγή
              χρειάζεται στη συνέχεια vector tiles, πραγματικό auth, audit log, offline cache και
              καταχώρηση εργασιών με φωτογραφίες.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    padding: 24,
    background: "radial-gradient(circle at top, #172b55 0, #071020 48%, #02040b 100%)",
    color: "#fff8e7",
    fontFamily: "Arial, sans-serif",
  },
  hero: {
    maxWidth: 1420,
    margin: "0 auto 22px",
  },
  lockBadge: {
    display: "inline-flex",
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(246,200,95,.36)",
    background: "rgba(246,200,95,.1)",
    color: "#f6c85f",
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: 1.4,
  },
  kicker: {
    margin: "18px 0 10px",
    color: "#f6c85f",
    letterSpacing: 4,
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: 1000,
  },
  title: {
    margin: 0,
    fontSize: "clamp(42px, 7vw, 92px)",
    lineHeight: 0.92,
  },
  subtitle: {
    color: "#d8e0f4",
    maxWidth: 980,
    fontSize: 19,
    lineHeight: 1.5,
  },
  securityStrip: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    color: "#fff8e7",
    fontSize: 14,
    fontWeight: 900,
  },
  workspace: {
    maxWidth: 1420,
    margin: "0 auto",
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "stretch",
  },
  leftPanel: {
    flex: "1 1 260px",
    maxWidth: 340,
    display: "grid",
    gap: 16,
    alignContent: "start",
  },
  mapPanel: {
    flex: "3 1 620px",
    minWidth: 0,
    borderRadius: 26,
    overflow: "hidden",
    border: "1px solid rgba(246,200,95,.28)",
    background: "rgba(5,12,24,.86)",
  },
  rightPanel: {
    flex: "1 1 300px",
    maxWidth: 390,
    display: "grid",
    gap: 16,
    alignContent: "start",
  },
  panel: {
    padding: 18,
    borderRadius: 24,
    background: "rgba(5,12,24,.86)",
    border: "1px solid rgba(246,200,95,.24)",
  },
  panelLabel: {
    margin: "0 0 14px",
    color: "#f6c85f",
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  layerList: {
    display: "grid",
    gap: 9,
  },
  layerItem: {
    padding: "9px 10px",
    borderRadius: 12,
    background: "rgba(255,255,255,.045)",
    color: "#d8e0f4",
    fontSize: 14,
    fontWeight: 800,
  },
  ruleList: {
    margin: 0,
    paddingLeft: 18,
    color: "#d8e0f4",
    lineHeight: 1.55,
  },
  panelText: {
    margin: 0,
    color: "#d8e0f4",
    lineHeight: 1.55,
  },
};