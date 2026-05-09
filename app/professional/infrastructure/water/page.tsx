import type { CSSProperties } from "react";
import WaterNetworkClient from "./water-network-client";

export default function WaterInfrastructurePage() {
  return (
    <main style={styles.shell}>
      <header style={styles.header}>
        <p style={styles.kicker}>PANTAVION WATER INFRASTRUCTURE</p>
        <h1 style={styles.title}>Δίκτυο Ύδρευσης</h1>
        <p style={styles.subtitle}>
          Γράψε οδό ή περιοχή, ή πάτησε εντοπισμό θέσης. Ο χάρτης ανοίγει στο σημείο
          και εμφανίζει το ιδιωτικό δίκτυο ύδρευσης πάνω στον χάρτη.
        </p>
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
    padding: "24px",
    background: "#071020",
    color: "#fff8e7",
    fontFamily: "Arial, sans-serif",
    overflowX: "hidden",
  },
  header: {
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto 18px",
  },
  kicker: {
    margin: "0 0 10px",
    color: "#f6c85f",
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: 3,
  },
  title: {
    margin: 0,
    fontSize: "clamp(42px, 8vw, 84px)",
    lineHeight: 1,
    letterSpacing: "-1.5px",
  },
  subtitle: {
    margin: "12px 0 0",
    maxWidth: 980,
    color: "#d8e0f4",
    fontSize: 18,
    lineHeight: 1.45,
  },
  mapShell: {
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
    borderRadius: 22,
    overflow: "hidden",
    border: "1px solid rgba(246,200,95,.32)",
    background: "#050c18",
  },
};
