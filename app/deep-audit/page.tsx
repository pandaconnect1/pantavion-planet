import Link from "next/link";
import type { CSSProperties } from "react";
import { aiSovereigntyRoadmap } from "@/core/pantavion/ai-sovereignty-roadmap";
import { deepAuditLedger } from "@/core/pantavion/deep-audit-ledger";
import { globalJurisdictionMatrix } from "@/core/pantavion/global-jurisdiction-matrix";
import { importWorldConsentMatrix } from "@/core/pantavion/import-world-consent-matrix";
import { noDeadSurfacePolicy } from "@/core/pantavion/no-dead-surface-policy";
import { officialAlertAuthorityMatrix } from "@/core/pantavion/official-alert-authority-matrix";
import { realBackendClaimsRegistry } from "@/core/pantavion/real-backend-claims-registry";
import { securityControlLedger } from "@/core/pantavion/security-control-ledger";
import { translationSafetyLedger } from "@/core/pantavion/translation-safety-ledger";

export const metadata = {
  title: "Deep Audit Gate | Pantavion One",
  description:
    "Pantavion legal, security, AI, translation, import, alert and backend claims audit before Stripe and public launch."
};

const shell: CSSProperties = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 78% 12%, rgba(232,185,79,.16), transparent 30rem), radial-gradient(circle at 12% 10%, rgba(57,214,255,.12), transparent 28rem), linear-gradient(135deg,#020712,#06111f 54%,#071a2d)"
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
  borderColor: "rgba(255,107,107,.35)",
  background: "linear-gradient(135deg,rgba(255,107,107,.12),rgba(7,18,33,.78))"
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
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
  letterSpacing: ".08em"
};

const muted: CSSProperties = {
  color: "#c7d4df",
  lineHeight: 1.65
};

function list(items: readonly string[]) {
  return (
    <ul style={{ color: "#fff7e8", lineHeight: 1.75, paddingLeft: 20 }}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function DeepAuditPage() {
  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          Pantavion Home
        </Link>

        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".3em", fontWeight: 900, textTransform: "uppercase" }}>
          Deep Audit Gate v1
        </p>

        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>
          Steel discipline before Stripe, launch or real-world execution.
        </h1>

        <p style={{ maxWidth: 980, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          {deepAuditLedger.summary}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          <Link href="/readiness" style={{ color: "#06111f", background: "linear-gradient(135deg,#ffe48b,#b78322)", borderRadius: 999, padding: "12px 18px", textDecoration: "none", fontWeight: 900 }}>
            Open Readiness
          </Link>
          <Link href="/kernel/audit" style={{ color: "#dffbff", background: "rgba(57,214,255,.12)", borderRadius: 999, padding: "12px 18px", textDecoration: "none", fontWeight: 900, border: "1px solid rgba(57,214,255,.35)" }}>
            Open Kernel Audit
          </Link>
        </div>

        <section style={{ marginTop: 42, ...grid }}>
          <article style={card}>
            <span style={badge}>Green</span>
            <h2>What is already stable</h2>
            {list(deepAuditLedger.currentGreen)}
          </article>

          <article style={redCard}>
            <span style={badge}>Blocked</span>
            <h2>Blocked before next gate</h2>
            {list(deepAuditLedger.blockedBeforeNextGate)}
          </article>

          <article style={card}>
            <span style={badge}>Next</span>
            <h2>Implementation order</h2>
            {list(deepAuditLedger.nextOrder)}
          </article>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <span style={badge}>{aiSovereigntyRoadmap.title}</span>
          <h2 style={{ fontSize: 34 }}>Pantavion may build its own AI — but no fake claims.</h2>
          <p style={muted}>{aiSovereigntyRoadmap.summary}</p>
          <div style={grid}>
            {aiSovereigntyRoadmap.levels.map((level) => (
              <article key={level.level} style={card}>
                <p style={{ color: "#f3c454", fontWeight: 900 }}>{level.currentStatus}</p>
                <h3>{level.name}</h3>
                <p style={muted}>{level.meaning}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <span style={badge}>{officialAlertAuthorityMatrix.title}</span>
          <h2 style={{ fontSize: 34 }}>Users participate. Verified authorities alert.</h2>
          <p style={muted}>{officialAlertAuthorityMatrix.summary}</p>
          <div style={grid}>
            {officialAlertAuthorityMatrix.participationTypes.map((item) => (
              <article key={item.type} style={item.interruptsFlow ? redCard : card}>
                <p style={{ color: "#f3c454", fontWeight: 900 }}>{item.type}</p>
                <p style={muted}>Actor: {item.actor}</p>
                <p style={muted}>Interrupts flow: {item.interruptsFlow ? "yes" : "no"}</p>
                <p style={muted}>{item.allowedUse}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42, ...grid }}>
          <article style={card}>
            <span style={badge}>Security</span>
            <h2>{securityControlLedger.title}</h2>
            <p style={muted}>{securityControlLedger.doctrine}</p>
            {list(securityControlLedger.controls.map((control) => `${control.name}: ${control.status}`))}
          </article>

          <article style={card}>
            <span style={badge}>Jurisdiction</span>
            <h2>{globalJurisdictionMatrix.title}</h2>
            <p style={muted}>{globalJurisdictionMatrix.summary}</p>
            {list(globalJurisdictionMatrix.regions.map((region) => `${region.region}: ${region.status}`))}
          </article>
        </section>

        <section style={{ marginTop: 42, ...grid }}>
          <article style={card}>
            <span style={badge}>Translation</span>
            <h2>{translationSafetyLedger.title}</h2>
            <p style={muted}>{translationSafetyLedger.blockedClaim}</p>
            {list(translationSafetyLedger.requiredCapabilities)}
          </article>

          <article style={card}>
            <span style={badge}>Import</span>
            <h2>{importWorldConsentMatrix.title}</h2>
            <p style={muted}>{importWorldConsentMatrix.summary}</p>
            {list(importWorldConsentMatrix.consentRequirements)}
          </article>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <span style={badge}>{noDeadSurfacePolicy.title}</span>
          <h2 style={{ fontSize: 34 }}>No dead buttons, no fake live surfaces.</h2>
          <p style={muted}>{noDeadSurfacePolicy.summary}</p>
          {list(noDeadSurfacePolicy.blockedStates)}
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <span style={badge}>{realBackendClaimsRegistry.title}</span>
          <h2 style={{ fontSize: 34 }}>Every module must say what it really is.</h2>
          <div style={grid}>
            {realBackendClaimsRegistry.modules.map((module) => (
              <article key={module.module} style={card}>
                <p style={{ color: "#f3c454", fontWeight: 900 }}>{module.state}</p>
                <h3>{module.module}</h3>
                <p style={muted}>Allowed: {module.claimAllowed}</p>
                <p style={muted}>Blocked: {module.claimBlocked}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42, ...redCard }}>
          <span style={badge}>Locked rule</span>
          <h2 style={{ fontSize: 38 }}>Zero uncontrolled risk before Stripe.</h2>
          <p style={muted}>
            Pantavion is hardened by classification, policy, audit, legal gates and release controls. Real payments, real SOS dispatch,
            third-party imports, adult/restricted zones, media broadcasting and native AI claims remain blocked until their gates pass.
          </p>
        </section>
      </section>
    </main>
  );
}
