import type { CSSProperties } from "react";
import Link from "next/link";
import {
  getPantavionBlockedProviders,
  getPantavionCriticalProviderRisks,
  getPantavionNearOwnedTargets,
  getPantavionSovereigntyCounts,
  pantavionOwnedSystemTargets,
  pantavionProviderDependencies,
  pantavionSovereigntyDoctrine
} from "@/core/pantavion/provider-sovereignty-ledger";

export const metadata = {
  title: "Provider Sovereignty | Pantavion One",
  description:
    "Pantavion provider independence, AI sovereignty, cost-reduction and ownership transition ledger."
};

const shell: CSSProperties = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 78% 12%, rgba(232,185,79,.18), transparent 32rem), radial-gradient(circle at 10% 18%, rgba(57,214,255,.12), transparent 34rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)",
  padding: "56px 20px"
};

const wrap: CSSProperties = {
  width: "min(1180px, calc(100% - 20px))",
  margin: "0 auto"
};

const card: CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(7,18,33,.76)",
  boxShadow: "0 24px 80px rgba(0,0,0,.25)"
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 14
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

const gold: CSSProperties = {
  color: "#f3c454",
  fontWeight: 900,
  letterSpacing: ".22em",
  fontSize: 12,
  textTransform: "uppercase"
};

const softText: CSSProperties = {
  color: "#c7d4df",
  lineHeight: 1.7
};

const statusTone: Record<string, { label: string; style: CSSProperties }> = {
  pantavion_owned: {
    label: "Pantavion owned",
    style: {
      background: "rgba(44,255,172,.12)",
      color: "#baffdf",
      border: "1px solid rgba(44,255,172,.35)"
    }
  },
  allowed_temporary_bridge: {
    label: "Temporary bridge",
    style: {
      background: "rgba(57,214,255,.12)",
      color: "#dffbff",
      border: "1px solid rgba(57,214,255,.35)"
    }
  },
  foundation_only: {
    label: "Foundation only",
    style: {
      background: "rgba(243,196,84,.12)",
      color: "#ffe6a3",
      border: "1px solid rgba(243,196,84,.35)"
    }
  },
  blocked_until_gate: {
    label: "Blocked until gate",
    style: {
      background: "rgba(255,107,107,.12)",
      color: "#ffd0d0",
      border: "1px solid rgba(255,107,107,.35)"
    }
  },
  banned: {
    label: "Banned",
    style: {
      background: "rgba(255,255,255,.08)",
      color: "#ffffff",
      border: "1px solid rgba(255,255,255,.18)"
    }
  }
};

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status] ?? statusTone.foundation_only;
  return (
    <span
      style={{
        ...badge,
        ...tone.style
      }}
    >
      {tone.label}
    </span>
  );
}

export default function SovereigntyPage() {
  const counts = getPantavionSovereigntyCounts();
  const blocked = getPantavionBlockedProviders();
  const critical = getPantavionCriticalProviderRisks();
  const nearTargets = getPantavionNearOwnedTargets();

  return (
    <main style={shell}>
      <section style={wrap}>
        <Link
          href="/"
          style={{
            color: "#f3c454",
            textDecoration: "none",
            fontWeight: 900
          }}
        >
          ← Pantavion Home
        </Link>

        <p style={{ ...gold, marginTop: 34 }}>Sovereignty Gate</p>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(42px,7vw,86px)",
            lineHeight: .94,
            letterSpacing: "-.06em"
          }}
        >
          Pantavion Kernel first. Providers never own the brain.
        </h1>

        <p
          style={{
            ...softText,
            maxWidth: 980,
            fontSize: 20,
            marginTop: 22
          }}
        >
          This ledger protects Pantavion from strategic provider dependence.
          OpenAI, Claude, Gemini, Stripe, maps, SMS, email and other services
          can only exist as governed, replaceable bridges. The user sees
          PantaAI and Pantavion Kernel — not third-party brands as the brain.
        </p>

        <section style={{ marginTop: 32, ...card }}>
          <span style={badge}>Supreme Rule</span>
          <h2 style={{ fontSize: 34, marginBottom: 10 }}>
            {pantavionSovereigntyDoctrine.title}
          </h2>
          <p style={{ ...softText, fontSize: 19 }}>
            {pantavionSovereigntyDoctrine.supremeRule}
          </p>
          <p style={{ ...softText }}>
            {pantavionSovereigntyDoctrine.dataFirewallRule}
          </p>
        </section>

        <section style={{ marginTop: 24, ...grid }}>
          <article style={card}>
            <p style={gold}>Total dependencies</p>
            <h2 style={{ fontSize: 46, margin: 0 }}>{counts.total}</h2>
            <p style={softText}>Tracked third-party or infrastructure surfaces.</p>
          </article>

          <article style={card}>
            <p style={gold}>Temporary bridges</p>
            <h2 style={{ fontSize: 46, margin: 0 }}>
              {counts.allowed_temporary_bridge}
            </h2>
            <p style={softText}>Allowed only through hidden, replaceable adapters.</p>
          </article>

          <article style={card}>
            <p style={gold}>Blocked gates</p>
            <h2 style={{ fontSize: 46, margin: 0 }}>
              {counts.blocked_until_gate}
            </h2>
            <p style={softText}>Cannot go live before legal, cost or safety review.</p>
          </article>

          <article style={card}>
            <p style={gold}>Near-owned targets</p>
            <h2 style={{ fontSize: 46, margin: 0 }}>{nearTargets.length}</h2>
            <p style={softText}>Systems the Kernel must build first.</p>
          </article>
        </section>

        <section style={{ marginTop: 34 }}>
          <h2 style={{ fontSize: 42 }}>Provider Dependency Ledger</h2>
          <div style={grid}>
            {pantavionProviderDependencies.map((item) => (
              <article key={item.id} style={card}>
                <StatusBadge status={item.currentStatus} />
                <h3 style={{ fontSize: 25, marginBottom: 8 }}>{item.name}</h3>
                <p style={softText}>{item.currentRole}</p>

                <p style={gold}>Public surface</p>
                <p style={{ color: "#fff7e8", lineHeight: 1.6 }}>
                  {item.publicName}
                </p>

                <p style={gold}>Sovereignty target</p>
                <p style={softText}>{item.sovereigntyTarget}</p>

                <p style={gold}>Blocked data</p>
                <ul style={{ color: "#ffd0d0", lineHeight: 1.7, paddingLeft: 20 }}>
                  {item.blockedData.slice(0, 5).map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 34, ...card }}>
          <span style={badge}>Build Direction</span>
          <h2 style={{ fontSize: 42, marginBottom: 12 }}>
            Pantavion-owned systems to build
          </h2>

          <div style={grid}>
            {pantavionOwnedSystemTargets.map((target) => (
              <article
                key={target.id}
                style={{
                  border: "1px solid rgba(255,255,255,.10)",
                  borderRadius: 22,
                  padding: 18,
                  background: "rgba(255,255,255,.045)"
                }}
              >
                <p style={gold}>{target.phase}</p>
                <h3 style={{ fontSize: 24, margin: "8px 0" }}>
                  {target.name}
                </h3>
                <p style={softText}>{target.description}</p>
                <p style={{ color: "#f3c454", fontWeight: 900 }}>
                  Owner: {target.kernelOwner}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 34, ...grid }}>
          <article style={card}>
            <span style={badge}>Critical risks</span>
            <h2>{critical.length} critical dependencies</h2>
            <p style={softText}>
              These are not failures. They are Kernel priorities that must be
              reduced, replaced or tightly governed.
            </p>
          </article>

          <article style={card}>
            <span style={badge}>Blocked before launch</span>
            <h2>{blocked.length} blocked surfaces</h2>
            <p style={softText}>
              Payments, SMS and surveillance-style analytics stay blocked until
              their legal, safety and cost gates pass.
            </p>
          </article>
        </section>

        <section style={{ marginTop: 34, ...card }}>
          <p style={gold}>Locked claim</p>
          <h2 style={{ fontSize: 34 }}>
            Pantavion is not a wrapper. It is a sovereign execution ecosystem.
          </h2>
          <p style={{ ...softText, fontSize: 18 }}>
            Providers may help temporarily, but they do not own the user
            experience, the memory, the Kernel, the graph, the communication
            layer, the interpreter, the roadmap or the strategic intelligence.
          </p>
        </section>
      </section>
    </main>
  );
}
