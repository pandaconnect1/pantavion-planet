import Link from "next/link";
import { capabilityRegistry } from "@/core/pantavion/capability-registry";
import { masterEcosystemDoctrine } from "@/core/pantavion/master-ecosystem-doctrine";
import { routeRegistry } from "@/core/pantavion/route-registry";

export const metadata = {
  title: "Pantavion Ecosystem | Pantavion One",
  description:
    "Pantavion master ecosystem doctrine, capability families and route foundations."
};

const shell = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 75% 10%, rgba(232,185,79,.16), transparent 32rem), radial-gradient(circle at 15% 20%, rgba(57,214,255,.14), transparent 34rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)"
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
  background: "rgba(7,18,33,.74)",
  boxShadow: "0 24px 80px rgba(0,0,0,.25)"
};

const button = {
  display: "inline-flex",
  padding: "11px 17px",
  borderRadius: 999,
  background: "linear-gradient(135deg,#ffe48b,#b78322)",
  color: "#06111f",
  textDecoration: "none",
  fontWeight: 900
};

export default function EcosystemPage() {
  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          ← Pantavion Home
        </Link>

        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".34em", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
          Master Ecosystem
        </p>

        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>
          One governed global ecosystem. Not scattered features.
        </h1>

        <p style={{ maxWidth: 900, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          {masterEcosystemDoctrine.summary}
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <Link href="/kernel/audit" style={button}>Open Kernel Audit</Link>
          <Link href="/pricing" style={{ ...button, background: "rgba(255,255,255,.06)", color: "#fff7e8", border: "1px solid rgba(255,255,255,.16)" }}>Pricing Gate</Link>
          <Link href="/legal" style={{ ...button, background: "rgba(57,214,255,.12)", color: "#dffbff", border: "1px solid rgba(57,214,255,.35)" }}>Legal Center</Link>
        </div>

        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 42, marginBottom: 18 }}>Pillars</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
            {masterEcosystemDoctrine.pillars.map((pillar) => (
              <article key={pillar} style={card}>
                <strong style={{ color: "#f3c454" }}>{pillar}</strong>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 42, marginBottom: 18 }}>Capability Families</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {capabilityRegistry.families.map((family) => (
              <article key={family} style={card}>
                <span style={{ color: "#39d6ff", fontWeight: 900 }}>Capability</span>
                <p style={{ color: "#fff7e8", lineHeight: 1.55 }}>{family}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 42, marginBottom: 18 }}>Public Route Foundation</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {routeRegistry.routes.map((route) => (
              <Link key={route.path} href={route.path} style={{ ...card, textDecoration: "none", color: "inherit" }}>
                <strong>{route.label}</strong>
                <p style={{ color: "#c7d4df" }}>{route.path}</p>
                <p style={{ color: "#f3c454", fontWeight: 900 }}>{route.status} / {route.risk}</p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
