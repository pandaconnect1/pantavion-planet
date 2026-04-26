import type { ReactNode } from "react";
import {
  BACKEND_CLAIM_STATUS_LABELS,
  REAL_BACKEND_CLAIMS_REGISTRY,
  getBackendClaimsSummary,
} from "@/core/pantavion/real-backend-claims-registry";

export default function BackendClaimsPage() {
  const summary = getBackendClaimsSummary();

  return (
    <main style={{ minHeight: "100vh", background: "#050711", color: "#f6e7b8", padding: "48px 20px" }}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <p style={{ margin: "0 0 12px", color: "#d6ad60", letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "12px" }}>
          Pantavion Governance Registry
        </p>

        <h1 style={{ margin: "0 0 16px", fontSize: "clamp(36px, 6vw, 72px)", lineHeight: 0.95 }}>
          Real Backend Claims Registry
        </h1>

        <p style={{ maxWidth: "860px", color: "#c9d3e7", fontSize: "18px", lineHeight: 1.7 }}>
          This registry prevents fake-live claims. Every Pantavion surface must be classified as doctrine,
          static, UI foundation, prototype, backend-connected, production-operational, or blocked until a gate passes.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "28px" }}>
          <Metric label="Total records" value={summary.total} />
          <Metric label="Claims allowed" value={summary.liveClaimAllowed} />
          <Metric label="Claims blocked" value={summary.liveClaimBlocked} />
          <Metric label="Operational" value={summary.statuses.production_operational} />
        </div>

        <div style={{ marginTop: "34px", display: "grid", gap: "16px" }}>
          {REAL_BACKEND_CLAIMS_REGISTRY.map((record) => (
            <article
              key={record.id}
              style={{
                border: "1px solid rgba(214, 173, 96, 0.28)",
                borderRadius: "22px",
                padding: "22px",
                background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "24px", color: "#fff7da" }}>{record.name}</h2>
                  <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>{record.productFamily}</p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-start" }}>
                  <Badge>{BACKEND_CLAIM_STATUS_LABELS[record.status]}</Badge>
                  <Badge>{record.risk.toUpperCase()} RISK</Badge>
                  <Badge>{record.liveClaimAllowed ? "LIVE CLAIM LIMITED" : "LIVE CLAIM BLOCKED"}</Badge>
                </div>
              </div>

              <div style={{ marginTop: "18px", display: "grid", gap: "14px" }}>
                <TextBlock title="Current truth" text={record.currentTruth} />
                <TextBlock title="Next safe step" text={record.nextSafeStep} />

                <div>
                  <h3 style={{ margin: "0 0 8px", color: "#d6ad60", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    Blocked claims
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#c9d3e7", lineHeight: 1.7 }}>
                    {record.blockedClaims.map((claim) => (
                      <li key={claim}>{claim}</li>
                    ))}
                  </ul>
                </div>

                <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
                  Route: {record.publicRoute ?? "No public route"} · Gates: {record.requiredGates.join(", ")}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid rgba(214, 173, 96, 0.26)",
        borderRadius: "20px",
        padding: "18px",
        background: "rgba(255,255,255,0.045)",
      }}
    >
      <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>{label}</p>
      <strong style={{ display: "block", marginTop: "8px", color: "#fff7da", fontSize: "32px" }}>{value}</strong>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        border: "1px solid rgba(214, 173, 96, 0.35)",
        borderRadius: "999px",
        padding: "7px 10px",
        color: "#f6e7b8",
        background: "rgba(214, 173, 96, 0.1)",
        fontSize: "12px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 style={{ margin: "0 0 6px", color: "#d6ad60", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: "#c9d3e7", lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}

