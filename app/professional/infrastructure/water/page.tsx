import type { CSSProperties } from "react";
import WaterNetworkClient from "./water-network-client";
import FounderApprovalQueue from "./founder-approval-queue";
import PantaAIWaterSentinel from "./pantaai-water-sentinel";

const officialLayers = [
  "γωγοί ύδρευσης",
  "εντρικοί αγωγοί",
  "εξαμενές",
  "αροχές",
  "ετρητές και τεχνικά σημεία",
  "δροληψίες",
  "αλαιά / ανενεργά τμήματα δικτύου",
  "ημεία τεχνικής διεύθυνσης",
];

const fieldRules = [
  " χάρτης είναι η πρώτη λειτουργία.",
  " κίνηση γίνεται με απλή, γρήγορη και φυσική πλοήγηση.",
  "ο πραγματικό KMZ/KML δεν εκτίθεται δημόσια.",
  "άθε ευαίσθητη πρόσβαση εγκρίνεται από την ρχή.",
  "ο λογιστήριο, η αποθήκη και τα συνεργεία θα συνδεθούν σε επόμενα στάδια.",
];

export default function WaterInfrastructurePage() {
  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <div style={styles.lockBadge}>
             
        </div>

        <p style={styles.kicker}>Pantavion επαγγελματική υποδομή</p>

        <h1 style={styles.title}>Έλεγχος ικτύου Ύδρευσης</h1>

        <p style={styles.subtitle}>
          ραγματικός χάρτης εργασίας για αγωγούς, βάνες, παροχές, τεχνικές διευθύνσεις,
          βλάβες, φωτογραφίες, συνεργεία και ελεγχόμενη πρόσβαση.  παραγωγή στο
          Pantavion.com χρειάζεται ιδιωτικό cloud source και όχι τοπικό αρχείο από PC.
        </p>

        <div style={styles.securityStrip}>
          <span>αμία δημόσια λήψη KMZ/KML</span>
          <span>διωτική αποθήκευση</span>
          <span>Έγκριση από ρχή / ιώργο</span>
          <span>Audit-ready</span>
          <span>Mobile-first</span>
        </div>
      </section>

      <section style={styles.workspace}>
        <aside style={styles.leftPanel}>
          <section style={styles.panel}>
            <p style={styles.panelLabel}>πίπεδα δικτύου</p>

            <div style={styles.layerList}>
              {officialLayers.map((layer) => (
                <span key={layer} style={styles.layerItem}>
                  {layer}
                </span>
              ))}
            </div>
          </section>

          <section style={styles.panel}>
            <p style={styles.panelLabel}>ανόνες πεδίου</p>

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

          <PantaAIWaterSentinel />

          <section style={styles.panel}>
            <p style={styles.panelLabel}>εχνικό αποτέλεσμα</p>

            <p style={styles.panelText}>
              ο module πρέπει να ανοίγει γρήγορα σε PC, tablet και κινητό. οπικά
              πρέπει να προτιμά το mobile GeoJSON preview. το Pantavion.com πρέπει
              να χρησιμοποιεί private cloud/object storage μέσω
              PANTAVION_WATER_NETWORK_GEOJSON_URL. ο πλήρες αρχείο 152 MB δεν πρέπει
              να φορτώνεται στο κινητό ως τελική λύση.
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
