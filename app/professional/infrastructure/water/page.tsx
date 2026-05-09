import type { CSSProperties } from "react";
import WaterNetworkClient from "./water-network-client";
import FounderApprovalQueue from "./founder-approval-queue";
import PantaAIWaterSentinel from "./pantaai-water-sentinel";

const officialLayers = [
  "�Z�?~�Z³Ï�?��Z³�Z¿�Z¯ Ï�Z´Ï�ZµÏ�?�Ï�'�Z·Ï�?s",
  "�Zš�Zµ�Z½Ï�?zÏ�Z¹�Zº�Z¿�Z¯ �Z±�Z³Ï�?��Z³�Z¿�Z¯",
  "�Z�?T�Z¬�Z½�ZµÏ�?s",
  "�Z �Z±Ï�Z¿Ï�?��Z­Ï�?s",
  "�Z�"�ZµÏ�?zÏ�Z·Ï�?z�Z­Ï�?s Ï�'Ï�,��Z¿Ï�?� Ï�?�Ï�,��Z¬ÏÏ�?��Z¿Ï�?��Z½",
  "�Z�?��Z¾�Z±ÏÏ�?z�Z®�Z¼�Z±Ï�?z�Z±",
  "�Z �Z±�Z»�Z±�Z¹Ï�' / �Z±�Z½Ï�?z�Z¹�Zº�Z±Ï�?z�ZµÏ�'Ï�?z�Z·�Z¼�Z­�Z½�Z¿ �Z´�Z¯�ZºÏ�?zÏ�?��Z¿",
  "�Z£�Z·�Z¼�Zµ�Z¯�Z± Ï�?z�ZµÏ�?��Z½�Z¹�Zº�Z®Ï�?s �Z´�Z¹�ZµÏ�Z¸Ï�?��Z½Ï�'�Z·Ï�?s",
];

const fieldRules = [
  "�ZŸ Ï�?��Z¬ÏÏ�?z�Z·Ï�?s �Zµ�Z¯�Z½�Z±�Z¹ �Z· Ï�,�ÏÏŽÏ�?z�Z· �Z»�Zµ�Z¹Ï�?z�Z¿Ï�?�Ï�Z³�Z¯�Z±.",
  "�Z�?" �Zº�Z¯�Z½�Z·Ï�'�Z· �Z³�Z¯�Z½�ZµÏ�?z�Z±�Z¹ �Z¼�Zµ �Z±Ï�?��Z®, Ï�'ÏÏÏ�'�Z¹�Z¼�Z¿ �Zº�Z±�Z¹ Ï�?�Ï�?�Ï�'�Z¹�Zº�Z® Ï�,��Z»�Z¿�Z®�Z³�Z·Ï�'�Z·.",
  "�Z¤�Z¿ Ï�,�Ï�Z±�Z³�Z¼�Z±Ï�?z�Z¹�ZºÏ�' KMZ/KML �Z´�Zµ�Z½ �Zµ�ZºÏ�?z�Z¯�Z¸�ZµÏ�?z�Z±�Z¹ �Z´�Z·�Z¼Ï�'Ï�'�Z¹�Z±.",
  "�Zš�Z¬�Z¸�Zµ �ZµÏ�?��Z±�Z¯Ï�'�Z¸�Z·Ï�?z�Z· Ï�,�ÏÏ�'Ï�'�Z²�Z±Ï�'�Z· �Zµ�Z³�ZºÏ�Z¯�Z½�ZµÏ�?z�Z±�Z¹ �Z±Ï�,�Ï�' Ï�?z�Z·�Z½ �Z�?~ÏÏ�?��Z®.",
  "�Z¤�Z¿ �Z»�Z¿�Z³�Z¹Ï�'Ï�?z�Z®Ï�Z¹�Z¿, �Z· �Z±Ï�,��Z¿�Z¸�Z®�Zº�Z· �Zº�Z±�Z¹ Ï�?z�Z± Ï�'Ï�?��Z½�ZµÏ�Z³�Zµ�Z¯�Z± �Z¸�Z± Ï�'Ï�?��Z½�Z´�Zµ�Z¸�Z¿Ï�Z½ Ï�'�Zµ �ZµÏ�,�Ï�'�Z¼�Zµ�Z½�Z± Ï�'Ï�?z�Z¬�Z´�Z¹�Z±.",
];

export default function WaterInfrastructurePage() {
  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <div style={styles.lockBadge}>�Z �Z¡�ZŸ�Z£�Z¤�Z�?~�Z¤�Z�?��Z¥�Z�"�Z�?��Z�Z�?" �Z�?��Z �Z�?~�Z�?o�Z�?o�Z�?��Z�?��Z�"�Z�?~�Z¤�Z�"��Zš�Z�?" �Z�?��Z�ZŸ�Z¤�Z�?"�Z¤�Z�?~ �,· �Z¥�Z�?��Z¡�Z�?��Z¥�Z£�Z�?"</div>
        <p style={styles.kicker}>Pantavion �ZµÏ�,��Z±�Z³�Z³�Zµ�Z»�Z¼�Z±Ï�?z�Z¹�Zº�Z® Ï�?�Ï�,��Z¿�Z´�Z¿�Z¼�Z®</p>
        <h1 style={styles.title}>�Z�?�Z»�Zµ�Z³Ï�?��Z¿Ï�?s �Z�?��Z¹�ZºÏ�?zÏ�Z¿Ï�?� �ZŽ�Z´Ï�ZµÏ�?�Ï�'�Z·Ï�?s</h1>
        <p style={styles.subtitle}>
          �Z Ï�Z±�Z³�Z¼�Z±Ï�?z�Z¹�ZºÏ�'Ï�?s Ï�?��Z¬ÏÏ�?z�Z·Ï�?s �ZµÏ�Z³�Z±Ï�'�Z¯�Z±Ï�?s �Z³�Z¹�Z± �Z±�Z³Ï�?��Z³�Z¿ÏÏ�?s, �Z²�Z¬�Z½�ZµÏ�?s, Ï�,��Z±Ï�Z¿Ï�?��Z­Ï�?s, Ï�?z�ZµÏ�?��Z½�Z¹�Zº�Z­Ï�?s �Z´�Z¹�ZµÏ�?��Z¸Ï�Z½Ï�'�Zµ�Z¹Ï�?s,
          �Z²�Z»�Z¬�Z²�ZµÏ�?s, Ï�?�Ï�?�Ï�?z�Z¿�Z³Ï�Z±Ï�?��Z¯�ZµÏ�?s, Ï�'Ï�?��Z½�ZµÏ�Z³�Zµ�Z¯�Z± �Zº�Z±�Z¹ �Zµ�Z»�Zµ�Z³Ï�?�Ï�'�Z¼�Zµ�Z½�Z· Ï�,�ÏÏ�'Ï�'�Z²�Z±Ï�'�Z·.
        </p>

        <div style={styles.securityStrip}>
          <span>�Zš�Z±�Z¼�Z¯�Z± �Z´�Z·�Z¼Ï�'Ï�'�Z¹�Z± �Z»�Z®Ï�?�Z· KMZ/KML</span>
          <span>�Z�"��Z´�Z¹Ï�?�Ï�?z�Z¹�Zº�Z® �Z±Ï�,��Z¿�Z¸�Z®�Zº�ZµÏ�?�Ï�'�Z·</span>
          <span>�Z�?�Z³�ZºÏ�Z¹Ï�'�Z· �Z±Ï�,�Ï�' �Z�?o�Z¹ÏŽÏ�Z³�Z¿</span>
          <span>Audit-ready</span>
          <span>Mobile-first</span>
        </div>
      </section>

      <section style={styles.workspace}>
        <aside style={styles.leftPanel}>
          <section style={styles.panel}>
            <p style={styles.panelLabel}>�Z�?�Ï�,��Z¯Ï�,��Zµ�Z´�Z± �Z´�Z¹�ZºÏ�?zÏ�Z¿Ï�?�</p>
            <div style={styles.layerList}>
              {officialLayers.map((layer) => (
                <span key={layer} style={styles.layerItem}>
                  {layer}
                </span>
              ))}
            </div>
          </section>

          <section style={styles.panel}>
            <p style={styles.panelLabel}>�Zš�Z±�Z½Ï�'�Z½�ZµÏ�?s Ï�,��Zµ�Z´�Z¯�Z¿Ï�?�</p>
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
            <p style={styles.panelLabel}>�Z¤�ZµÏ�?��Z½�Z¹�ZºÏ�' �Z±Ï�,��Z¿Ï�?z�Z­�Z»�ZµÏ�'�Z¼�Z±</p>
            <p style={styles.panelText}>
              �Z¤�Z¿ module Ï�,�Ï�Z­Ï�,��Zµ�Z¹ �Z½�Z± �Z±�Z½�Z¿�Z¯�Z³�Zµ�Z¹ �Z³Ï�Z®�Z³�Z¿Ï�Z± Ï�'�Zµ PC, tablet �Zº�Z±�Z¹ �Zº�Z¹�Z½�Z·Ï�?zÏ�'. �Z�?" Ï�,��Z»�Z®Ï�Z·Ï�?s Ï�,��Z±Ï�Z±�Z³Ï�?��Z³�Z®
              Ï�?�Ï�Zµ�Z¹�Z¬�Z¶�ZµÏ�?z�Z±�Z¹ Ï�'Ï�?z�Z· Ï�'Ï�?��Z½�Z­Ï�?��Zµ�Z¹�Z± vector tiles, Ï�,�Ï�Z±�Z³�Z¼�Z±Ï�?z�Z¹�ZºÏ�' auth, audit log, offline cache �Zº�Z±�Z¹
              �Zº�Z±Ï�?z�Z±Ï�?�ÏŽÏ�Z·Ï�'�Z· �ZµÏ�Z³�Z±Ï�'�Z¹ÏŽ�Z½ �Z¼�Zµ Ï�?�Ï�?�Ï�?z�Z¿�Z³Ï�Z±Ï�?��Z¯�ZµÏ�?s.
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