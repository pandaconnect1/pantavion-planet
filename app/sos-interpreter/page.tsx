import Link from "next/link";
import type { CSSProperties } from "react";
import { pantavionSosInterpreter } from "@/core/pantavion/sos-interpreter";

export const metadata = {
  title: "SOS+Interpreter | Pantavion One",
  description:
    "Pantavion SOS+Interpreter: emergency assistance, multilingual interpretation, offline identity support and emergency-circle routing."
};

const shell: CSSProperties = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 78% 12%, rgba(232,185,79,.18), transparent 32rem), radial-gradient(circle at 10% 18%, rgba(57,214,255,.14), transparent 34rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)"
};

const wrap: CSSProperties = {
  width: "min(1180px, calc(100% - 40px))",
  margin: "0 auto",
  padding: "64px 0"
};

const card: CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(7,18,33,.76)",
  boxShadow: "0 24px 80px rgba(0,0,0,.25)"
};

const redCard: CSSProperties = {
  ...card,
  borderColor: "rgba(255,107,107,.38)",
  background: "linear-gradient(135deg,rgba(255,107,107,.12),rgba(7,18,33,.78))"
};

const gold: CSSProperties = {
  color: "#f3c454",
  letterSpacing: ".26em",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase"
};

const badge: CSSProperties = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(57,214,255,.12)",
  color: "#dffbff",
  border: "1px solid rgba(57,214,255,.35)",
  fontWeight: 900,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: ".1em"
};

const goldButton: CSSProperties = {
  display: "inline-flex",
  padding: "11px 17px",
  borderRadius: 999,
  background: "linear-gradient(135deg,#ffe48b,#b78322)",
  color: "#06111f",
  textDecoration: "none",
  fontWeight: 900
};

const blueButton: CSSProperties = {
  display: "inline-flex",
  padding: "11px 17px",
  borderRadius: 999,
  background: "rgba(57,214,255,.12)",
  color: "#dffbff",
  border: "1px solid rgba(57,214,255,.35)",
  textDecoration: "none",
  fontWeight: 900
};

export default function SosInterpreterPage() {
  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          ← Pantavion Home
        </Link>

        <p style={{ ...gold, marginTop: 34 }}>Pantavion SOS+Interpreter</p>

        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>
          Emergency clarity across every language.
        </h1>

        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          {pantavionSosInterpreter.summary}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          <Link href="/kernel/audit" style={goldButton}>Open Kernel Audit</Link>
          <Link href="/ai-feature-register" style={blueButton}>AI Feature Register</Link>
          <Link href="/legal" style={blueButton}>Legal Center</Link>
        </div>

        <section style={{ marginTop: 44, ...redCard }}>
          <p style={gold}>Supreme Rule</p>
          <h2 style={{ margin: 0, fontSize: "clamp(30px,4vw,52px)", lineHeight: 1.05 }}>
            SOS is life protection, not decoration.
          </h2>
          <p style={{ color: "#c7d4df", lineHeight: 1.75, fontSize: 18 }}>
            {pantavionSosInterpreter.supremeRule}
          </p>
        </section>

        <section style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 42, marginBottom: 18 }}>Core Modes</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 16 }}>
            {pantavionSosInterpreter.coreModes.map((mode) => (
              <article key={mode.key} style={card}>
                <span style={badge}>{mode.name} / {mode.risk}</span>
                <p style={{ color: "#c7d4df", lineHeight: 1.65 }}>{mode.description}</p>
                <p style={{ color: "#f3c454", fontWeight: 900 }}>Allowed</p>
                <p style={{ color: "#fff7e8", lineHeight: 1.6 }}>{mode.allowed.join(", ")}</p>
                <p style={{ color: "#ffb3b3", fontWeight: 900 }}>Boundaries</p>
                <p style={{ color: "#fff7e8", lineHeight: 1.6 }}>{mode.boundaries.join(", ")}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 42, marginBottom: 18 }}>Emergency Contexts</h2>
          <article style={card}>
            <p style={{ color: "#fff7e8", lineHeight: 1.8 }}>
              {pantavionSosInterpreter.emergencyContexts.join(" • ")}
            </p>
          </article>
        </section>

        <section style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 42, marginBottom: 18 }}>Fallback States</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 16 }}>
            {pantavionSosInterpreter.fallbackStates.map((item) => (
              <article key={item.state} style={card}>
                <span style={badge}>{item.state}</span>
                <p style={{ color: "#c7d4df", lineHeight: 1.65 }}>{item.behavior}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 44, ...redCard }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Blocked Claims</h2>
          <p style={{ color: "#fff7e8", lineHeight: 1.8 }}>
            {pantavionSosInterpreter.blockedClaims.join(" • ")}
          </p>
        </section>

        <section style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 42, marginBottom: 18 }}>Release Gates</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
            {pantavionSosInterpreter.releaseGates.map((gate, index) => (
              <article key={gate} style={card}>
                <span style={{ color: "#f3c454", fontWeight: 900 }}>Gate {index + 1}</span>
                <p style={{ color: "#fff7e8", lineHeight: 1.55 }}>{gate}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 44, ...card }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Locked Motto</h2>
          <p style={{ color: "#f3c454", lineHeight: 1.75, fontSize: 20, fontWeight: 900 }}>
            {pantavionSosInterpreter.motto}
          </p>
        </section>
      </section>
    </main>
  );
}
