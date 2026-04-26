import Link from "next/link";
import {
  kernelCompletionDoctrine,
  kernelCompletionItems,
  kernelCompletionStats,
  kernelNextActions
} from "@/core/pantavion/kernel-completion-spine";

export const metadata = {
  title: "Kernel Completion | Pantavion One",
  description:
    "Pantavion Kernel completion spine for gaps, blocked claims, provider sovereignty, legal gates, security gates and next actions."
};

const shell = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 72% 16%, rgba(243,196,84,.16), transparent 30rem), radial-gradient(circle at 18% 10%, rgba(57,214,255,.13), transparent 30rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)",
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
  background: "rgba(7,18,33,.78)",
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

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default function KernelCompletionPage() {
  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          ← Pantavion Home
        </Link>

        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".3em", fontWeight: 900, textTransform: "uppercase" }}>
          Kernel Completion Spine
        </p>

        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>
          The Kernel must finish, block, repair and prioritize the ecosystem.
        </h1>

        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          {kernelCompletionDoctrine.mission}
        </p>

        <section style={{ marginTop: 34, ...card }}>
          <h2 style={{ marginTop: 0, fontSize: 34 }}>{kernelCompletionDoctrine.title}</h2>
          <p style={{ color: "#fff7e8", lineHeight: 1.7 }}>{kernelCompletionDoctrine.rule}</p>
          <p style={{ color: "#dffbff", lineHeight: 1.7 }}>{kernelCompletionDoctrine.sovereignty}</p>
          <p style={{ color: "#ffd28a", lineHeight: 1.7 }}>{kernelCompletionDoctrine.reality}</p>
        </section>

        <section style={{ marginTop: 34, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
          {[
            ["Total", kernelCompletionStats.total],
            ["Foundation", kernelCompletionStats.foundation],
            ["In progress", kernelCompletionStats.inProgress],
            ["Blocked", kernelCompletionStats.blocked],
            ["Critical", kernelCompletionStats.critical]
          ].map(([label, value]) => (
            <article key={label} style={card}>
              <p style={gold}>{label}</p>
              <h2 style={{ fontSize: 44, margin: 0 }}>{value}</h2>
            </article>
          ))}
        </section>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42 }}>Completion registry</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
            {kernelCompletionItems.map((item) => (
              <article key={item.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={badge}>{item.domain}</span>
                  <span style={{ color: riskColor(item.risk), fontWeight: 900, textTransform: "uppercase", fontSize: 12 }}>
                    {item.risk}
                  </span>
                </div>

                <h3 style={{ fontSize: 28, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ color: "#f3c454", fontWeight: 900, textTransform: "uppercase" }}>
                  {statusLabel(item.status)}
                </p>

                <p style={{ color: "#c7d4df", lineHeight: 1.65 }}>{item.whyItMatters}</p>

                <p style={gold}>Current reality</p>
                <p style={{ color: "#fff7e8", lineHeight: 1.65 }}>{item.currentReality}</p>

                <p style={gold}>Kernel action</p>
                <p style={{ color: "#dffbff", lineHeight: 1.65 }}>{item.kernelAction}</p>

                <p style={gold}>Before public</p>
                <ul style={{ color: "#fff7e8", lineHeight: 1.65 }}>
                  {item.requiredBeforePublic.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>

                <p style={gold}>Blocked claims</p>
                <ul style={{ color: "#ffd7d7", lineHeight: 1.65 }}>
                  {item.blockedClaims.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ marginTop: 0, fontSize: 36 }}>Next Kernel actions</h2>
          <ol style={{ color: "#fff7e8", lineHeight: 1.8, fontSize: 18 }}>
            {kernelNextActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </section>

        <section style={{ marginTop: 34, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href="/infrastructure" style={{ ...badge, textDecoration: "none" }}>Infrastructure</Link>
          <Link href="/sovereignty" style={{ ...badge, textDecoration: "none" }}>Sovereignty</Link>
          <Link href="/deep-audit" style={{ ...badge, textDecoration: "none" }}>Deep Audit</Link>
          <Link href="/readiness" style={{ ...badge, textDecoration: "none" }}>Readiness</Link>
          <Link href="/kernel/audit" style={{ ...badge, textDecoration: "none" }}>Kernel Audit</Link>
        </section>
      </section>
    </main>
  );
}
