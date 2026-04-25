import Link from "next/link";
import { primeKernelLaw } from "@/core/pantavion/prime-kernel-law";

export const metadata = {
  title: "Prime Kernel Law | Pantavion One",
  description:
    "The supreme Pantavion Kernel law: no request, route, capability, section, button, user need, risk or missing function remains dead, empty or unclassified."
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

const goldButton = {
  display: "inline-flex",
  padding: "11px 17px",
  borderRadius: 999,
  background: "linear-gradient(135deg,#ffe48b,#b78322)",
  color: "#06111f",
  textDecoration: "none",
  fontWeight: 900
};

const blueButton = {
  display: "inline-flex",
  padding: "11px 17px",
  borderRadius: 999,
  background: "rgba(57,214,255,.12)",
  color: "#dffbff",
  border: "1px solid rgba(57,214,255,.35)",
  textDecoration: "none",
  fontWeight: 900
};

export default function PrimeKernelLawPage() {
  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          ← Pantavion Home
        </Link>

        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".34em", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
          Prime Kernel Law
        </p>

        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,88px)", lineHeight: .94, letterSpacing: "-.06em" }}>
          No dead ends. Every gap becomes a governed path.
        </h1>

        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 21, lineHeight: 1.65 }}>
          {primeKernelLaw.summary}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
          <Link href="/kernel/audit" style={goldButton}>Open Kernel Audit</Link>
          <Link href="/ecosystem" style={blueButton}>Open Ecosystem</Link>
          <Link href="/legal" style={blueButton}>Legal Center</Link>
        </div>

        <section style={{ marginTop: 46, ...card }}>
          <p style={{ color: "#f3c454", fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase" }}>
            Supreme Command
          </p>
          <h2 style={{ margin: "12px 0 0", fontSize: "clamp(30px,4vw,54px)", lineHeight: 1.05 }}>
            If it exists, execute. If it does not exist, create the path. If it is restricted, classify and route safely.
          </h2>
          <p style={{ color: "#c7d4df", lineHeight: 1.75, fontSize: 18 }}>
            {primeKernelLaw.command}
          </p>
        </section>

        <section style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 16 }}>
          {primeKernelLaw.responseStates.map((state) => (
            <article key={state} style={card}>
              <span style={{ color: "#39d6ff", fontWeight: 900 }}>Response State</span>
              <h3 style={{ fontSize: 24, marginBottom: 0 }}>{state}</h3>
            </article>
          ))}
        </section>

        <section style={{ marginTop: 46 }}>
          <h2 style={{ fontSize: 42, marginBottom: 18 }}>Execution Doctrine</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 16 }}>
            {primeKernelLaw.executionDoctrine.map((rule) => (
              <article key={rule} style={card}>
                <p style={{ color: "#fff7e8", lineHeight: 1.65, margin: 0 }}>{rule}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 46 }}>
          <h2 style={{ fontSize: 42, marginBottom: 18 }}>Creation Path</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {primeKernelLaw.creationPath.map((step, index) => (
              <article key={step} style={card}>
                <span style={{ color: "#f3c454", fontWeight: 900 }}>Step {index + 1}</span>
                <p style={{ color: "#fff7e8", lineHeight: 1.5 }}>{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 46, ...card, borderColor: "rgba(255,107,107,.35)", background: "rgba(255,107,107,.08)" }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Hard Boundaries</h2>
          <ul style={{ lineHeight: 1.75, fontSize: 17 }}>
            {primeKernelLaw.boundaries.map((boundary) => (
              <li key={boundary}>{boundary}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
