import Link from "next/link";
import type { CSSProperties } from "react";
import { productFamilySummary, productFamilyTaxonomy } from "@/core/pantavion/product-family-taxonomy";
import { productionReadinessGates, readinessSummary } from "@/core/pantavion/production-readiness-gates";
import { routeStatusRegistry, routeStatusSummary } from "@/core/pantavion/route-status-registry";

export const metadata = {
  title: "Production Readiness | Pantavion One",
  description: "Pantavion production classification, route status and release gates before payments.",
};

const shell: CSSProperties = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 78% 12%, rgba(232,185,79,.16), transparent 30rem), radial-gradient(circle at 12% 10%, rgba(57,214,255,.12), transparent 28rem), linear-gradient(135deg,#020712,#06111f 54%,#071a2d)",
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

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 12,
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
  letterSpacing: ".08em",
};

const goldLink: CSSProperties = {
  color: "#06111f",
  background: "linear-gradient(135deg,#ffe48b,#b78322)",
  borderRadius: 999,
  padding: "12px 18px",
  textDecoration: "none",
  fontWeight: 900,
};

const muted: CSSProperties = {
  color: "#c7d4df",
  lineHeight: 1.65,
};

const statuses = ["LIVE", "FOUNDATION", "BETA", "RESTRICTED", "LEGAL_REVIEW", "FUTURE", "BLOCKED"] as const;

export default function ReadinessPage() {
  const statusCounts = statuses.map((status) => ({
    status,
    count: routeStatusRegistry.filter((route) => route.status === status).length,
  }));

  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          Pantavion Home
        </Link>

        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".3em", fontWeight: 900, textTransform: "uppercase" }}>
          Production Readiness
        </p>

        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>
          No fake live. No dead buttons. No payments before gates.
        </h1>

        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          Pantavion now classifies every public surface by status, risk and launch boundary before Stripe, banking, imports,
          SOS operations, adult zones, media/radio operations or institutional channels move beyond foundation.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          <Link href="/kernel/audit" style={goldLink}>Open Kernel Audit</Link>
          <Link href="/architecture" style={{ ...goldLink, background: "rgba(57,214,255,.12)", color: "#dffbff", border: "1px solid rgba(57,214,255,.35)" }}>
            Open Architecture
          </Link>
        </div>

        <section style={{ marginTop: 42, ...grid }}>
          <article style={card}>
            <span style={badge}>Families</span>
            <h2>{productFamilySummary.total}</h2>
            <p style={muted}>Live: {productFamilySummary.live} | Foundation: {productFamilySummary.foundation} | Critical: {productFamilySummary.critical}</p>
          </article>
          <article style={card}>
            <span style={badge}>Routes</span>
            <h2>{routeStatusSummary.total}</h2>
            <p style={muted}>Live: {routeStatusSummary.live} | Foundation: {routeStatusSummary.foundation} | Legal Review: {routeStatusSummary.legalReview}</p>
          </article>
          <article style={card}>
            <span style={badge}>Release Gates</span>
            <h2>{readinessSummary.total}</h2>
            <p style={muted}>Pass: {readinessSummary.pass} | Partial: {readinessSummary.partial} | Blocked: {readinessSummary.blocked}</p>
          </article>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Route Status Registry</h2>
          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {routeStatusRegistry.map((route) => (
              <article key={route.path} style={{ borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 14 }}>
                <p style={{ margin: 0, color: "#f3c454", fontWeight: 900 }}>{route.status} / {route.riskClass}</p>
                <h3 style={{ margin: "4px 0" }}>
                  <Link href={route.path} style={{ color: "#fff7e8" }}>{route.label}</Link>
                </h3>
                <p style={muted}>{route.path} — {route.notes}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42 }}>Status Counts</h2>
          <div style={grid}>
            {statusCounts.map((item) => (
              <article key={item.status} style={card}>
                <span style={badge}>{item.status}</span>
                <h3 style={{ fontSize: 34, margin: "12px 0 0" }}>{item.count}</h3>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 42 }}>Release Gates Before Stripe</h2>
          <div style={grid}>
            {productionReadinessGates.map((gate) => (
              <article key={gate.id} style={card}>
                <span style={badge}>{gate.state}</span>
                <h3 style={{ fontSize: 26 }}>{gate.title}</h3>
                <p style={muted}>{gate.summary}</p>
                <p style={{ color: "#f3c454", fontWeight: 900 }}>Required evidence</p>
                <p style={muted}>{gate.requiredEvidence.join(" / ")}</p>
                {gate.blocks.length > 0 ? (
                  <>
                    <p style={{ color: "#ffb3b3", fontWeight: 900 }}>Blocks</p>
                    <p style={muted}>{gate.blocks.join(" / ")}</p>
                  </>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ fontSize: 38, margin: 0 }}>Product Families</h2>
          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {productFamilyTaxonomy.map((family) => (
              <article key={family.id} style={{ borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 14 }}>
                <p style={{ margin: 0, color: "#f3c454", fontWeight: 900 }}>{family.status} / {family.riskClass}</p>
                <h3 style={{ margin: "4px 0" }}>
                  <Link href={family.publicRoute} style={{ color: "#fff7e8" }}>{family.title}</Link>
                </h3>
                <p style={muted}>{family.summary}</p>
                <p style={muted}>Modules: {family.modules.join(" / ")}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <span style={badge}>Locked Rule</span>
          <h2 style={{ fontSize: 38 }}>Stripe remains blocked until readiness gates pass.</h2>
          <p style={muted}>
            Payments, paid subscriptions, adult restricted access, authority SOS integrations, external imports and media/radio operations
            must not be presented as fully live until their specific legal, safety and operational gates are complete.
          </p>
        </section>
      </section>
    </main>
  );
}
