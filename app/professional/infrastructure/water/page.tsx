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

const securityRules = [
  "αμία δημόσια λήψη KMZ/KML",
  "διωτική αποθήκευση",
  "Έγκριση από ρχή / ιώργο",
  "Audit-ready",
  "Mobile-first",
];

export default function WaterInfrastructurePage() {
  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <div style={styles.lockBadge}>   </div>

        <p style={styles.kicker}>PANTAVION  </p>

        <h1 style={styles.title}>Έλεγχος ικτύου Ύδρευσης</h1>

        <p style={styles.subtitle}>
          ραγματικός χάρτης εργασίας για αγωγούς, βάνες, παροχές, τεχνικές
          διευθύνσεις, βλάβες, φωτογραφίες, συνεργεία και ελεγχόμενη πρόσβαση.
           παραγωγή στο Pantavion.com χρειάζεται ιδιωτικό cloud source και όχι
          τοπικό αρχείο από PC.
        </p>

        <div style={styles.securityStrip}>
          {securityRules.map((rule) => (
            <div key={rule} style={styles.securityTag}>
              {rule}
            </div>
          ))}
        </div>
      </section>

      <section style={styles.workspace}>
        <aside style={styles.leftPanel}>
          <section style={styles.panel}>
            <p style={styles.panelLabel}> </p>

            <div style={styles.layerList}>
              {officialLayers.map((layer) => (
                <button key={layer} type="button" style={styles.layerItem}>
                  {layer}
                </button>
              ))}
            </div>
          </section>

          <section style={styles.panel}>
            <p style={styles.panelLabel}> </p>

            <div style={styles.ruleList}>
              {fieldRules.map((rule) => (
                <p key={rule} style={styles.ruleItem}>
                  {rule}
                </p>
              ))}
            </div>
          </section>
        </aside>

        <section style={styles.mapPanel}>
          <WaterNetworkClient />
        </section>

        <aside style={styles.rightPanel}>
          <FounderApprovalQueue />

          <PantaAIWaterSentinel />

          <section style={styles.panel}>
            <p style={styles.panelLabel}> </p>

            <p style={styles.panelText}>
              ο module πρέπει να ανοίγει γρήγορα σε PC, tablet και κινητό.
              οπικά πρέπει να προτιμά το mobile GeoJSON preview. το Pantavion.com
              πρέπει να χρησιμοποιεί private cloud/object storage μέσω
              PANTAVION_WATER_NETWORK_GEOJSON_URL. ο πλήρες αρχείο 152 MB δεν
              πρέπει να φορτώνεται στο κινητό ως τελική λύση.
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
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    overflowX: "auto",
    padding: "32px 28px 32px 52px",
    background: "radial-gradient(circle at top, #172b55 0, #071020 48%, #02040b 100%)",
    color: "#fff8e7",
    fontFamily: "Arial, sans-serif",
  },
  hero: {
    width: "100%",
    maxWidth: 1420,
    margin: "0 auto 22px",
    boxSizing: "border-box",
    paddingLeft: 0,
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
    whiteSpace: "normal",
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
    letterSpacing: "-2px",
  },
  subtitle: {
    margin: "14px 0 0",
    color: "#e8eefc",
    maxWidth: 980,
    fontSize: 19,
    lineHeight: 1.55,
  },
  securityStrip: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
    color: "#fff8e7",
    fontSize: 14,
    fontWeight: 900,
  },
  securityTag: {
    padding: "4px 0",
    color: "#fff8e7",
    whiteSpace: "nowrap",
  },
  workspace: {
    width: "100%",
    maxWidth: 1420,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "280px minmax(520px, 1fr) minmax(340px, 390px)",
    gap: 16,
    alignItems: "start",
    boxSizing: "border-box",
  },
  leftPanel: {
    minWidth: 0,
    display: "grid",
    gap: 16,
    alignContent: "start",
  },
  mapPanel: {
    minWidth: 0,
    borderRadius: 26,
    overflow: "hidden",
    border: "1px solid rgba(246,200,95,.28)",
    background: "rgba(5,12,24,.86)",
  },
  rightPanel: {
    minWidth: 0,
    display: "grid",
    gap: 16,
    alignContent: "start",
  },
  panel: {
    padding: 18,
    borderRadius: 24,
    background: "rgba(5,12,24,.86)",
    border: "1px solid rgba(246,200,95,.24)",
    boxSizing: "border-box",
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
    width: "100%",
    minHeight: 42,
    display: "block",
    padding: "11px 16px",
    border: 0,
    borderRadius: 12,
    background: "rgba(255,255,255,.055)",
    color: "#e8eefc",
    fontSize: 14,
    fontWeight: 800,
    textAlign: "left",
    textIndent: 0,
    overflow: "visible",
    boxSizing: "border-box",
    whiteSpace: "normal",
  },
  ruleList: {
    display: "grid",
    gap: 8,
  },
  ruleItem: {
    margin: 0,
    color: "#e8eefc",
    lineHeight: 1.55,
    fontSize: 15,
  },
  panelText: {
    margin: 0,
    color: "#e8eefc",
    lineHeight: 1.55,
  },
};

