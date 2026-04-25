import Link from "next/link";
import type { CSSProperties } from "react";
import { pantavionSosInterpreter } from "@/core/pantavion/sos-interpreter";

export const metadata = { title: "SOS+Interpreter | Pantavion One", description: "Emergency assistance and multilingual interpretation foundation." };

const shell: CSSProperties = { minHeight: "100vh", color: "#fff7e8", background: "radial-gradient(circle at 78% 12%, rgba(232,185,79,.18), transparent 32rem), radial-gradient(circle at 10% 18%, rgba(57,214,255,.14), transparent 34rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)" };
const wrap: CSSProperties = { width: "min(1180px, calc(100% - 40px))", margin: "0 auto", padding: "64px 0" };
const card: CSSProperties = { border: "1px solid rgba(255,255,255,.12)", borderRadius: 28, padding: 24, background: "rgba(7,18,33,.76)", boxShadow: "0 24px 80px rgba(0,0,0,.25)" };
const redCard: CSSProperties = { ...card, borderColor: "rgba(255,107,107,.38)", background: "linear-gradient(135deg,rgba(255,107,107,.12),rgba(7,18,33,.78))" };
const badge: CSSProperties = { display: "inline-flex", padding: "6px 10px", borderRadius: 999, background: "rgba(57,214,255,.12)", color: "#dffbff", border: "1px solid rgba(57,214,255,.35)", fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em" };

export default function SosInterpreterPage() {
  const sos = pantavionSosInterpreter;
  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>← Pantavion Home</Link>
        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".3em", fontWeight: 900, textTransform: "uppercase" }}>Pantavion SOS+Interpreter</p>
        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>Emergency clarity across every language.</h1>
        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>{sos.summary}</p>

        <section style={{ marginTop: 42, ...redCard }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Supreme Rule</h2>
          <p style={{ color: "#fff7e8", lineHeight: 1.75 }}>{sos.supremeRule}</p>
        </section>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42 }}>Core Modes</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
            {sos.coreModes.map((item) => <article key={item} style={card}><span style={badge}>{item}</span></article>)}
          </div>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Emergency Contexts</h2>
          <p style={{ color: "#fff7e8", lineHeight: 1.8 }}>{sos.emergencyContexts.join(" • ")}</p>
        </section>

        <section style={{ marginTop: 42, ...redCard }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Blocked Claims</h2>
          <p style={{ color: "#fff7e8", lineHeight: 1.8 }}>{sos.blockedClaims.join(" • ")}</p>
        </section>
      </section>
    </main>
  );
}
