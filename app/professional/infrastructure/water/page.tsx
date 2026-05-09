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
      <header style={styles.header}>
        <p style={styles.kicker}>{copy.kicker}</p>
        <h1 style={styles.title}>{copy.title}</h1>
        <p style={styles.subtitle}>{copy.subtitle}</p>
      </header>

      <section style={styles.mapShell}>
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
    padding: 14,
    background: "#071020",
    color: "#fff8e7",
    fontFamily: "Arial, sans-serif",
    overflowX: "hidden",
  },
  header: {
    width: "100%",
    maxWidth: 1320,
    margin: "0 auto 10px",
    boxSizing: "border-box",
  },
  kicker: {
    margin: "0 0 6px",
    color: "#f6c85f",
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: 2.6,
  },
  title: {
    margin: 0,
    fontSize: "clamp(30px, 4.4vw, 54px)",
    lineHeight: 1.05,
    letterSpacing: "-.6px",
  },
  subtitle: {
    margin: "8px 0 0",
    maxWidth: 1040,
    color: "#d8e0f4",
    fontSize: 15,
    lineHeight: 1.35,
  },
  mapShell: {
    width: "100%",
    maxWidth: 1320,
    margin: "0 auto",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(246,200,95,.32)",
    background: "#050c18",
  },
};
