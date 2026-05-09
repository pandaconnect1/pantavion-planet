import type { CSSProperties } from "react";
import WaterNetworkClient from "./water-network-client";

const copy = {
  kicker: "PANTAVION WATER INFRASTRUCTURE",
  title: "\u0394\u03af\u03ba\u03c4\u03c5\u03bf \u038e\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2",
  subtitle:
    "\u0393\u03c1\u03ac\u03c8\u03b5 \u03bf\u03b4\u03cc \u03ae \u03c0\u03b5\u03c1\u03b9\u03bf\u03c7\u03ae, \u03ae \u03c0\u03ac\u03c4\u03b7\u03c3\u03b5 \u03b5\u03bd\u03c4\u03bf\u03c0\u03b9\u03c3\u03bc\u03cc \u03b8\u03ad\u03c3\u03b7\u03c2. \u039f \u03c7\u03ac\u03c1\u03c4\u03b7\u03c2 \u03b1\u03bd\u03bf\u03af\u03b3\u03b5\u03b9 \u03c3\u03c4\u03bf \u03c3\u03b7\u03bc\u03b5\u03af\u03bf \u03ba\u03b1\u03b9 \u03b5\u03bc\u03c6\u03b1\u03bd\u03af\u03b6\u03b5\u03b9 \u03c4\u03bf \u03b9\u03b4\u03b9\u03c9\u03c4\u03b9\u03ba\u03cc \u03b4\u03af\u03ba\u03c4\u03c5\u03bf \u03cd\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2 \u03c0\u03ac\u03bd\u03c9 \u03c3\u03c4\u03bf\u03bd \u03c7\u03ac\u03c1\u03c4\u03b7.",
};

export default function WaterInfrastructurePage() {
  return (
    <main style={styles.shell}>
      <section style={styles.card}>
        <header style={styles.header}>
          <p style={styles.kicker}>{copy.kicker}</p>
          <h1 style={styles.title}>{copy.title}</h1>
          <p style={styles.subtitle}>{copy.subtitle}</p>
        </header>

        <WaterNetworkClient />
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    padding: 18,
    background: "#071020",
    color: "#fff8e7",
    fontFamily: "Arial, sans-serif",
    overflowX: "hidden",
  },
  card: {
    width: "100%",
    maxWidth: 1320,
    margin: "0 auto",
    borderRadius: 22,
    overflow: "hidden",
    border: "1px solid rgba(246,200,95,.32)",
    background: "#050c18",
  },
  header: {
    padding: "18px 20px 14px",
    borderBottom: "1px solid rgba(246,200,95,.18)",
  },
  kicker: {
    margin: "0 0 8px",
    color: "#f6c85f",
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: 2.8,
  },
  title: {
    margin: 0,
    fontSize: "clamp(34px, 5vw, 58px)",
    lineHeight: 1.05,
    letterSpacing: "-.8px",
  },
  subtitle: {
    margin: "10px 0 0",
    maxWidth: 980,
    color: "#d8e0f4",
    fontSize: 17,
    lineHeight: 1.45,
  },
};
