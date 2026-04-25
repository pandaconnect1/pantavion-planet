import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata = {
  title: "Deep Audit Gate | Pantavion One",
  description:
    "Pantavion Deep Audit Gate: legal, safety, security, translation, marketplace, media, payments and backend-claims readiness before public scale.",
};

const shell: CSSProperties = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 78% 12%, rgba(232,185,79,.18), transparent 32rem), radial-gradient(circle at 10% 18%, rgba(57,214,255,.14), transparent 34rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)",
};

const wrap: CSSProperties = {
  width: "min(1180px, calc(100% - 40px))",
  margin: "0 auto",
  padding: "64px 0",
};

const card: CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(7,18,33,.76)",
  boxShadow: "0 24px 80px rgba(0,0,0,.25)",
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
  letterSpacing: ".1em",
};

const gold: CSSProperties = {
  color: "#f3c454",
  fontWeight: 900,
};

const gates = [
  {
    title: "Global Jurisdiction Matrix",
    status: "Mandatory before scale",
    summary:
      "Country and region review for privacy, minors, adult/restricted zones, emergency use, marketplace, media and data-transfer boundaries.",
  },
  {
    title: "Security Control Ledger",
    status: "Mandatory before payments",
    summary:
      "RBAC, admin protection, rate limits, bot defense, audit logs, incident response, backup/restore, secret management and dependency scanning.",
  },
  {
    title: "No Dead Surface Audit",
    status: "Mandatory before public launch",
    summary:
      "Every button, card, CTA, navbar link, footer link and module entry must map to a real route, real action, disabled state or beta state.",
  },
  {
    title: "Translation Safety Ledger",
    status: "Mandatory before interpreter claims",
    summary:
      "Assistive translation only until confidence scoring, fallback phrases, emergency disclaimers, offline phrase packs and human-review lanes exist.",
  },
  {
    title: "Import World Consent Matrix",
    status: "Mandatory before growth imports",
    summary:
      "Contacts, CSV, email and third-party connectors require explicit consent, official APIs or user-provided files. No scraping or password collection.",
  },
  {
    title: "Stripe Readiness Gate",
    status: "Blocked until commercial/legal gate",
    summary:
      "Checkout-only first. No raw card handling. Marketplace payouts, connected accounts, KYC/KYB and restricted categories remain blocked until reviewed.",
  },
  {
    title: "Minors / Adult / Restricted Policy",
    status: "Mandatory before sensitive zones",
    summary:
      "Minors protection first. Adult/restricted content remains blocked until legal, age-verification, jurisdiction and provider approval are complete.",
  },
  {
    title: "Marketplace Fraud Policy",
    status: "Mandatory before marketplace payments",
    summary:
      "Blocked categories include weapons, drugs, adult services, counterfeit goods, stolen goods, scams, regulated medical goods and hazardous items.",
  },
  {
    title: "Media / Radio Rights Policy",
    status: "Mandatory before media monetization",
    summary:
      "News, opinion, ads, user submissions, official alerts, AI voice, human presenter and sponsored bulletins must be clearly separated and rights-cleared.",
  },
  {
    title: "Real Backend Claims Registry",
    status: "Mandatory before public claims",
    summary:
      "Every module must declare its real state: doctrine only, static page, UI foundation, local prototype, backend connected or production operational.",
  },
] as const;

export default function DeepAuditPage() {
  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          ← Pantavion Home
        </Link>

        <p
          style={{
            marginTop: 34,
            color: "#f3c454",
            letterSpacing: ".3em",
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          Deep Audit Gate
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(42px,7vw,86px)",
            lineHeight: .94,
            letterSpacing: "-.06em",
          }}
        >
          Steel before scale.
        </h1>

        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          Pantavion does not move to live charging, marketplace activity, institutional routes, public safety claims or global growth before the deep audit gates are visible, governed and reviewed.
        </p>

        <section style={{ marginTop: 42, ...card }}>
          <span style={badge}>Locked Rule</span>
          <h2 style={{ fontSize: 38, marginBottom: 8 }}>No Stripe before Deep Audit</h2>
          <p style={{ color: "#c7d4df", lineHeight: 1.7 }}>
            Current commercial status: <strong style={gold}>Stripe readiness foundation only</strong>. Live payments remain blocked until legal, commercial, security and restricted-category controls pass.
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: 16,
            marginTop: 38,
          }}
        >
          {gates.map((gate) => (
            <article key={gate.title} style={card}>
              <span style={badge}>{gate.status}</span>
              <h2 style={{ margin: "18px 0 10px", fontSize: 25 }}>{gate.title}</h2>
              <p style={{ color: "#c7d4df", lineHeight: 1.65 }}>{gate.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
