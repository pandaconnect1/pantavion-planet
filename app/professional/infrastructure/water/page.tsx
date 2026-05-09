import type { CSSProperties } from "react";
import WaterNetworkClient from "./water-network-client";
import FounderApprovalQueue from "./founder-approval-queue";
import PantaAIWaterSentinel from "./pantaai-water-sentinel";

const officialLayers = [
  "Î‘Î³Ï‰Î³Î¿Î¯ ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚",
  "ÎšÎµÎ½Ï„ÏÎ¹ÎºÎ¿Î¯ Î±Î³Ï‰Î³Î¿Î¯",
  "Î’Î¬Î½ÎµÏ‚",
  "Î Î±ÏÎ¿Ï‡Î­Ï‚",
  "ÎœÎµÏ„ÏÎ·Ï„Î­Ï‚ ÏŒÏ€Î¿Ï… Ï…Ï€Î¬ÏÏ‡Î¿Ï…Î½",
  "Î•Î¾Î±ÏÏ„Î®Î¼Î±Ï„Î±",
  "Î Î±Î»Î±Î¹ÏŒ / Î±Î½Ï„Î¹ÎºÎ±Ï„ÎµÏƒÏ„Î·Î¼Î­Î½Î¿ Î´Î¯ÎºÏ„Ï…Î¿",
  "Î£Î·Î¼ÎµÎ¯Î± Ï„ÎµÏ‡Î½Î¹ÎºÎ®Ï‚ Î´Î¹ÎµÏÎ¸Ï…Î½ÏƒÎ·Ï‚",
];

const fieldRules = [
  "ÎŸ Ï‡Î¬ÏÏ„Î·Ï‚ ÎµÎ¯Î½Î±Î¹ Î· Ï€ÏÏŽÏ„Î· Î»ÎµÎ¹Ï„Î¿Ï…ÏÎ³Î¯Î±.",
  "Î— ÎºÎ¯Î½Î·ÏƒÎ· Î³Î¯Î½ÎµÏ„Î±Î¹ Î¼Îµ Î±Ï†Î®, ÏƒÏÏÏƒÎ¹Î¼Î¿ ÎºÎ±Î¹ Ï†Ï…ÏƒÎ¹ÎºÎ® Ï€Î»Î¿Î®Î³Î·ÏƒÎ·.",
  "Î¤Î¿ Ï€ÏÎ±Î³Î¼Î±Ï„Î¹ÎºÏŒ KMZ/KML Î´ÎµÎ½ ÎµÎºÏ„Î¯Î¸ÎµÏ„Î±Î¹ Î´Î·Î¼ÏŒÏƒÎ¹Î±.",
  "ÎšÎ¬Î¸Îµ ÎµÏ…Î±Î¯ÏƒÎ¸Î·Ï„Î· Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ· ÎµÎ³ÎºÏÎ¯Î½ÎµÏ„Î±Î¹ Î±Ï€ÏŒ Ï„Î·Î½ Î‘ÏÏ‡Î®.",
  "Î¤Î¿ Î»Î¿Î³Î¹ÏƒÏ„Î®ÏÎ¹Î¿, Î· Î±Ï€Î¿Î¸Î®ÎºÎ· ÎºÎ±Î¹ Ï„Î± ÏƒÏ…Î½ÎµÏÎ³ÎµÎ¯Î± Î¸Î± ÏƒÏ…Î½Î´ÎµÎ¸Î¿ÏÎ½ ÏƒÎµ ÎµÏ€ÏŒÎ¼ÎµÎ½Î± ÏƒÏ„Î¬Î´Î¹Î±.",
];

export default function WaterInfrastructurePage() {
  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <div style={styles.lockBadge}>Î Î¡ÎŸÎ£Î¤Î‘Î¤Î•Î¥ÎœÎ•ÎÎ— Î•Î Î‘Î“Î“Î•Î›ÎœÎ‘Î¤Î™ÎšÎ— Î•ÎÎŸÎ¤Î—Î¤Î‘ Â· Î¥Î”Î¡Î•Î¥Î£Î—</div>
        <p style={styles.kicker}>Pantavion ÎµÏ€Î±Î³Î³ÎµÎ»Î¼Î±Ï„Î¹ÎºÎ® Ï…Ï€Î¿Î´Î¿Î¼Î®</p>
        <h1 style={styles.title}>ÎˆÎ»ÎµÎ³Ï‡Î¿Ï‚ Î”Î¹ÎºÏ„ÏÎ¿Ï… ÎŽÎ´ÏÎµÏ…ÏƒÎ·Ï‚</h1>
        <p style={styles.subtitle}>
          Î ÏÎ±Î³Î¼Î±Ï„Î¹ÎºÏŒÏ‚ Ï‡Î¬ÏÏ„Î·Ï‚ ÎµÏÎ³Î±ÏƒÎ¯Î±Ï‚ Î³Î¹Î± Î±Î³Ï‰Î³Î¿ÏÏ‚, Î²Î¬Î½ÎµÏ‚, Ï€Î±ÏÎ¿Ï‡Î­Ï‚, Ï„ÎµÏ‡Î½Î¹ÎºÎ­Ï‚ Î´Î¹ÎµÏ…Î¸ÏÎ½ÏƒÎµÎ¹Ï‚,
          Î²Î»Î¬Î²ÎµÏ‚, Ï†Ï‰Ï„Î¿Î³ÏÎ±Ï†Î¯ÎµÏ‚, ÏƒÏ…Î½ÎµÏÎ³ÎµÎ¯Î± ÎºÎ±Î¹ ÎµÎ»ÎµÎ³Ï‡ÏŒÎ¼ÎµÎ½Î· Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ·.
        </p>

        <div style={styles.securityStrip}>
          <span>ÎšÎ±Î¼Î¯Î± Î´Î·Î¼ÏŒÏƒÎ¹Î± Î»Î®ÏˆÎ· KMZ/KML</span>
          <span>Î™Î´Î¹Ï‰Ï„Î¹ÎºÎ® Î±Ï€Î¿Î¸Î®ÎºÎµÏ…ÏƒÎ·</span>
          <span>ÎˆÎ³ÎºÏÎ¹ÏƒÎ· Î±Ï€ÏŒ Î“Î¹ÏŽÏÎ³Î¿</span>
          <span>Audit-ready</span>
          <span>Mobile-first</span>
        </div>
      </section>

      <section style={styles.workspace}>
        <aside style={styles.leftPanel}>
          <section style={styles.panel}>
            <p style={styles.panelLabel}>Î•Ï€Î¯Ï€ÎµÎ´Î± Î´Î¹ÎºÏ„ÏÎ¿Ï…</p>
            <div style={styles.layerList}>
              {officialLayers.map((layer) => (
                <span key={layer} style={styles.layerItem}>
                  {layer}
                </span>
              ))}
            </div>
          </section>

          <section style={styles.panel}>
            <p style={styles.panelLabel}>ÎšÎ±Î½ÏŒÎ½ÎµÏ‚ Ï€ÎµÎ´Î¯Î¿Ï…</p>
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
            <p style={styles.panelLabel}>Î¤ÎµÏ‡Î½Î¹ÎºÏŒ Î±Ï€Î¿Ï„Î­Î»ÎµÏƒÎ¼Î±</p>
            <p style={styles.panelText}>
              Î¤Î¿ module Ï€ÏÎ­Ï€ÎµÎ¹ Î½Î± Î±Î½Î¿Î¯Î³ÎµÎ¹ Î³ÏÎ®Î³Î¿ÏÎ± ÏƒÎµ PC, tablet ÎºÎ±Î¹ ÎºÎ¹Î½Î·Ï„ÏŒ. Î— Ï€Î»Î®ÏÎ·Ï‚ Ï€Î±ÏÎ±Î³Ï‰Î³Î®
              Ï‡ÏÎµÎ¹Î¬Î¶ÎµÏ„Î±Î¹ ÏƒÏ„Î· ÏƒÏ…Î½Î­Ï‡ÎµÎ¹Î± vector tiles, Ï€ÏÎ±Î³Î¼Î±Ï„Î¹ÎºÏŒ auth, audit log, offline cache ÎºÎ±Î¹
              ÎºÎ±Ï„Î±Ï‡ÏŽÏÎ·ÏƒÎ· ÎµÏÎ³Î±ÏƒÎ¹ÏŽÎ½ Î¼Îµ Ï†Ï‰Ï„Î¿Î³ÏÎ±Ï†Î¯ÎµÏ‚.
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