import Link from "next/link";
import { pantavionCompetitiveIntelligenceLayer } from "@/core/pantavion/competitive-intelligence-layer";

export const metadata = {
  title: "Competitive Intelligence Layer | Pantavion One",
  description:
    "The Pantavion competitive intelligence layer converts lawful global signals into Pantavion-owned capabilities, routes, policies and priorities."
};

const shell = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 76% 12%, rgba(232,185,79,.18), transparent 32rem), radial-gradient(circle at 12% 18%, rgba(57,214,255,.14), transparent 34rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)"
};

const wrap = {
  width: "min(1180px, calc(100% - 40px))",
  margin: "0 auto",
  padding: "64px 0"
};

const card = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(7,18,33,.76)",
  boxShadow: "0 24px 80px rgba(0,0,0,.25)"
};

const badge = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(57,214,255,.12)",
  color: "#dffbff",
  border: "1px solid rgba(57,214,255,.35)",
  fontWeight: 900,
  fontSize: 12,
  textTransform: "uppercase" as const,
  letterSpacing: ".1em"
};

export default function CompetitiveIntelligencePage() {
  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          ← Pantavion Home
        </Link>

        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".34em", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
          Competitive Intelligence Layer
        </p>

        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>
          Watch the world. Convert signals into Pantavion power.
        </h1>

        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          {pantavionCompetitiveIntelligenceLayer.summary}
        </p>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42, marginBottom: 18 }}>Intelligence Families</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
            {pantavionCompetitiveIntelligenceLayer.intelligenceFamilies.map((family) => (
              <article key={family.key} style={card}>
                <span style={badge}>{family.key}</span>
                <h3 style={{ fontSize: 26, margin: "16px 0 8px" }}>{family.name}</h3>
                <p style={{ color: "#c7d4df", lineHeight: 1.65 }}>{family.output}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42, marginBottom: 18 }}>Processing Path</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {pantavionCompetitiveIntelligenceLayer.processingPath.map((step, index) => (
              <article key={step} style={card}>
                <span style={{ color: "#f3c454", fontWeight: 900 }}>Step {index + 1}</span>
                <p style={{ color: "#fff7e8", lineHeight: 1.5 }}>{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Hard Rule</h2>
          <p style={{ color: "#c7d4df", lineHeight: 1.75, fontSize: 18 }}>
            {pantavionCompetitiveIntelligenceLayer.motto}
          </p>
        </section>
      </section>
    </main>
  );
}
