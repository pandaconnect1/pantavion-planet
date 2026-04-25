import Link from "next/link";
import type { CSSProperties } from "react";
import { pantavionAiFeatureRegister } from "@/core/pantavion/ai-feature-register";

export const metadata = { title: "AI Feature Register | Pantavion One", description: "Governed AI capabilities by module and risk zone." };

const shell: CSSProperties = { minHeight: "100vh", color: "#fff7e8", background: "radial-gradient(circle at 78% 12%, rgba(232,185,79,.18), transparent 32rem), radial-gradient(circle at 10% 18%, rgba(57,214,255,.14), transparent 34rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)" };
const wrap: CSSProperties = { width: "min(1180px, calc(100% - 40px))", margin: "0 auto", padding: "64px 0" };
const card: CSSProperties = { border: "1px solid rgba(255,255,255,.12)", borderRadius: 28, padding: 24, background: "rgba(7,18,33,.76)", boxShadow: "0 24px 80px rgba(0,0,0,.25)" };
const badge: CSSProperties = { display: "inline-flex", padding: "6px 10px", borderRadius: 999, background: "rgba(57,214,255,.12)", color: "#dffbff", border: "1px solid rgba(57,214,255,.35)", fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em" };

export default function AiFeatureRegisterPage() {
  const reg = pantavionAiFeatureRegister;
  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>← Pantavion Home</Link>
        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".3em", fontWeight: 900, textTransform: "uppercase" }}>AI Feature Register</p>
        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>AI everywhere. Chaos nowhere.</h1>
        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>{reg.summary}</p>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Supreme Rule</h2>
          <p style={{ color: "#f3c454", fontWeight: 900, lineHeight: 1.7 }}>{reg.supremeRule}</p>
        </section>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42 }}>Risk Zones</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
            {reg.zones.map((zone) => <article key={zone.key} style={card}><span style={badge}>{zone.name} / {zone.risk}</span><p style={{ color: "#c7d4df", lineHeight: 1.65 }}>{zone.rule}</p><p style={{ color: "#fff7e8", lineHeight: 1.7 }}>{zone.examples.join(", ")}</p></article>)}
          </div>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Module Register</h2>
          <p style={{ color: "#fff7e8", lineHeight: 1.8 }}>{reg.moduleRegister.join(" • ")}</p>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Motto</h2>
          <p style={{ color: "#f3c454", fontWeight: 900, lineHeight: 1.7 }}>{reg.motto}</p>
        </section>
      </section>
    </main>
  );
}
