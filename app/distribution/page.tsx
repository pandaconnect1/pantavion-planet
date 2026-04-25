import Link from "next/link";
import type { CSSProperties } from "react";
import { pantavionGlobalDistributionLedger, pantavionGlobalDistributionVerdict } from "@/core/pantavion/global-distribution-ledger";
import { pantavionPlatformDiscoveryMatrix } from "@/core/pantavion/platform-discovery-matrix";
import { pantavionIndexingPolicy } from "@/core/pantavion/public-indexing-policy";
import { pantavionPublicClaimsRegistry } from "@/core/pantavion/public-claims-registry";

export const metadata = {
  title: "Global Distribution Gate | Pantavion One",
  description: "Pantavion global discovery, SEO, social preview, PWA and public/private indexing readiness gate."
};

const shell: CSSProperties = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 78% 12%, rgba(232,185,79,.18), transparent 32rem), radial-gradient(circle at 10% 18%, rgba(57,214,255,.14), transparent 34rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
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
  letterSpacing: ".08em",
  textTransform: "uppercase",
  fontSize: 12
};

function statusColor(status: string): string {
  if (status.includes("ready")) return "#6ef7b7";
  if (status.includes("manual")) return "#f3c454";
  if (status.includes("blocked")) return "#ff8b8b";
  return "#c7d4df";
}

export default function DistributionPage() {
  const gate = pantavionGlobalDistributionLedger;

  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          Pantavion Home
        </Link>

        <p style={{ ...gold, marginTop: 34 }}>Global Distribution Gate</p>

        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>
          Search, social, mobile and public claims under one governed gate.
        </h1>

        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          {gate.doctrine}
        </p>

        <section style={{ marginTop: 42, ...card }}>
          <span style={badge}>{gate.status}</span>
          <h2 style={{ fontSize: 38, marginBottom: 8 }}>Distribution Verdict</h2>
          <p style={{ color: "#fff7e8", fontSize: 20, lineHeight: 1.7, fontWeight: 900 }}>
            {pantavionGlobalDistributionVerdict.decision}
          </p>
          <p style={{ color: "#c7d4df", lineHeight: 1.7 }}>
            Primary target: {gate.primaryDomainTarget}. Current fallback: {gate.currentDeploymentFallback}.
          </p>
        </section>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42 }}>Public Signals</h2>
          <div style={grid}>
            {gate.publicSignals.map((item) => (
              <article key={item} style={card}>
                <span style={badge}>Signal</span>
                <p style={{ marginBottom: 0, color: "#fff7e8", fontWeight: 900 }}>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42 }}>Platform Discovery Matrix</h2>
          <div style={grid}>
            {pantavionPlatformDiscoveryMatrix.map((platform) => (
              <article key={platform.id} style={card}>
                <span style={{ ...badge, color: statusColor(platform.status) }}>{platform.status}</span>
                <h3 style={{ fontSize: 24, marginBottom: 8 }}>{platform.name}</h3>
                <p style={{ color: "#c7d4df", lineHeight: 1.65 }}>{platform.purpose}</p>
                <p style={{ color: "#f3c454", fontWeight: 900 }}>Gate: {platform.ownerGate}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42 }}>Indexing Policy</h2>
          <div style={grid}>
            {pantavionIndexingPolicy.map((item) => (
              <article key={item.route} style={card}>
                <span style={{ ...badge, color: statusColor(item.decision) }}>{item.decision}</span>
                <h3 style={{ fontSize: 24, marginBottom: 8 }}>{item.route}</h3>
                <p style={{ color: "#c7d4df", lineHeight: 1.65 }}>{item.reason}</p>
                <p style={{ color: "#fff7e8", lineHeight: 1.6 }}>{item.claimBoundary}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42 }}>Public Claims Registry</h2>
          <div style={grid}>
            {pantavionPublicClaimsRegistry.map((claim) => (
              <article key={claim.id} style={card}>
                <span style={{ ...badge, color: statusColor(claim.allowedStatus) }}>{claim.allowedStatus}</span>
                <h3 style={{ fontSize: 24, marginBottom: 8 }}>{claim.surface}</h3>
                <p style={{ color: "#fff7e8", lineHeight: 1.65, fontWeight: 900 }}>{claim.publicClaim}</p>
                <p style={{ color: "#ffb3b3", lineHeight: 1.65 }}>Blocked: {claim.blockedClaim}</p>
                <p style={{ color: "#f3c454", lineHeight: 1.65 }}>Next gate: {claim.nextGate}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ fontSize: 38, marginTop: 0 }}>Manual Actions Before Global Push</h2>
          <ol style={{ color: "#fff7e8", lineHeight: 1.85 }}>
            {gate.manualActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ fontSize: 38, marginTop: 0 }}>Blocked Until Later</h2>
          <p style={{ color: "#c7d4df", lineHeight: 1.7 }}>
            These items stay blocked until their own legal, backend, payment, rights or operational gates pass.
          </p>
          <div style={grid}>
            {gate.blockedUntilLater.map((item) => (
              <article key={item} style={{ ...card, background: "rgba(255,107,107,.08)", borderColor: "rgba(255,107,107,.28)" }}>
                <span style={{ ...badge, color: "#ffb3b3" }}>Blocked</span>
                <p style={{ color: "#fff7e8", fontWeight: 900 }}>{item}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
