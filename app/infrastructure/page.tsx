import Link from "next/link";
import {
  pantavionInfrastructureStats,
  pantavionInternalInfrastructureRegistry,
  pantavionSovereigntyDoctrine
} from "@/core/pantavion/internal-infrastructure-registry";

export const metadata = {
  title: "Internal Infrastructure | Pantavion One",
  description:
    "Pantavion-owned infrastructure roadmap for AI, communication, memory, translation, maps, analytics, payments, security and media."
};

const shell = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 76% 14%, rgba(232,185,79,.18), transparent 31rem), radial-gradient(circle at 18% 12%, rgba(57,214,255,.14), transparent 31rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)",
  padding: "56px 20px"
};

const wrap = {
  width: "min(1180px, calc(100% - 20px))",
  margin: "0 auto"
};

const card = {
  border: "1px solid rgba(255,255,255,.13)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(7,18,33,.76)",
  boxShadow: "0 24px 80px rgba(0,0,0,.25)"
};

const smallCard = {
  ...card,
  padding: 20
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

const gold = {
  color: "#f3c454",
  fontWeight: 900
};

function riskColor(risk: string) {
  if (risk === "critical") return "#ffb3b3";
  if (risk === "high") return "#ffd28a";
  if (risk === "medium") return "#d7e7ff";
  return "#dffbff";
}

export default function InfrastructurePage() {
  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          ← Pantavion Home
        </Link>

        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".3em", fontWeight: 900, textTransform: "uppercase" }}>
          Internal Infrastructure
        </p>

        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>
          Pantavion-owned systems. Third parties reduced to controlled adapters.
        </h1>

        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          {pantavionSovereigntyDoctrine.summary}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 26 }}>
          <Link href="/sovereignty" style={{ ...badge, textDecoration: "none" }}>Sovereignty</Link>
          <Link href="/deep-audit" style={{ ...badge, textDecoration: "none" }}>Deep Audit</Link>
          <Link href="/readiness" style={{ ...badge, textDecoration: "none" }}>Readiness</Link>
          <Link href="/kernel/audit" style={{ ...badge, textDecoration: "none" }}>Kernel Audit</Link>
        </div>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ margin: 0, fontSize: 36 }}>Doctrine</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14, marginTop: 18 }}>
            <article style={smallCard}>
              <span style={badge}>User-facing rule</span>
              <p style={{ color: "#fff7e8", lineHeight: 1.7 }}>{pantavionSovereigntyDoctrine.visibleUserRule}</p>
            </article>
            <article style={smallCard}>
              <span style={badge}>Provider rule</span>
              <p style={{ color: "#fff7e8", lineHeight: 1.7 }}>{pantavionSovereigntyDoctrine.providerRule}</p>
            </article>
            <article style={smallCard}>
              <span style={badge}>Kernel rule</span>
              <p style={{ color: "#fff7e8", lineHeight: 1.7 }}>{pantavionSovereigntyDoctrine.kernelRule}</p>
            </article>
            <article style={smallCard}>
              <span style={badge}>Legal rule</span>
              <p style={{ color: "#fff7e8", lineHeight: 1.7 }}>{pantavionSovereigntyDoctrine.legalRule}</p>
            </article>
          </div>
        </section>

        <section style={{ marginTop: 42, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
          <article style={smallCard}>
            <p style={gold}>Total systems</p>
            <h2 style={{ fontSize: 44, margin: 0 }}>{pantavionInfrastructureStats.totalSystems}</h2>
          </article>
          <article style={smallCard}>
            <p style={gold}>Critical systems</p>
            <h2 style={{ fontSize: 44, margin: 0 }}>{pantavionInfrastructureStats.criticalSystems}</h2>
          </article>
          <article style={smallCard}>
            <p style={gold}>Pantavion-owned now</p>
            <h2 style={{ fontSize: 44, margin: 0 }}>{pantavionInfrastructureStats.pantavionOwnedNow}</h2>
          </article>
          <article style={smallCard}>
            <p style={gold}>Hybrid transition</p>
            <h2 style={{ fontSize: 44, margin: 0 }}>{pantavionInfrastructureStats.hybridTransition}</h2>
          </article>
          <article style={smallCard}>
            <p style={gold}>Blocked</p>
            <h2 style={{ fontSize: 44, margin: 0 }}>{pantavionInfrastructureStats.blockedSystems}</h2>
          </article>
        </section>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42 }}>Internal systems registry</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 16 }}>
            {pantavionInternalInfrastructureRegistry.map((system) => (
              <article key={system.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <span style={badge}>{system.layer}</span>
                  <span style={{ color: riskColor(system.risk), fontWeight: 900, textTransform: "uppercase", fontSize: 12 }}>
                    {system.risk}
                  </span>
                </div>

                <h3 style={{ fontSize: 28, marginBottom: 8 }}>{system.name}</h3>
                <p style={{ color: "#c7d4df", lineHeight: 1.65 }}>{system.mission}</p>

                <p style={gold}>Current dependency</p>
                <p style={{ color: "#fff7e8", lineHeight: 1.65 }}>{system.currentDependency}</p>

                <p style={gold}>Target owned system</p>
                <p style={{ color: "#fff7e8", lineHeight: 1.65 }}>{system.targetOwnedSystem}</p>

                <p style={gold}>Build now</p>
                <ul style={{ color: "#fff7e8", lineHeight: 1.65 }}>
                  {system.whatWeBuildNow.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <p style={gold}>Forbidden claims</p>
                <ul style={{ color: "#ffd7d7", lineHeight: 1.65 }}>
                  {system.forbiddenClaims.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div style={{ marginTop: 18, borderTop: "1px solid rgba(255,255,255,.13)", paddingTop: 16 }}>
                  <span style={badge}>{system.dependencyMode}</span>
                  <p style={{ color: "#dffbff", lineHeight: 1.65 }}>{system.sovereigntyRule}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
