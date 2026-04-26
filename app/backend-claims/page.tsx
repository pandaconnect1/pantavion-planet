import { realBackendClaimsRegistry, BACKEND_CLAIM_STATUS_LABELS, getBackendClaimsSummary } from "@/core/pantavion/real-backend-claims-registry";

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
          This registry prevents fake-live claims. Every Pantavion surface must be classified as doctrine, static, foundation, backend-connected, or production-operational.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "28px" }}>
          <div style={{ border: "1px solid rgba(214,173,96,0.28)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontSize: "12px", color: "#d6ad60" }}>Total</div>
            <div style={{ fontSize: "32px", fontWeight: 900 }}>{realBackendClaimsRegistry.length}</div>
          </div>
          <div style={{ border: "1px solid rgba(214,173,96,0.28)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontSize: "12px", color: "#d6ad60" }}>Operational</div>
            <div style={{ fontSize: "32px", fontWeight: 900 }}>{summary.production_operational || 0}</div>
          </div>
          <div style={{ border: "1px solid rgba(214,173,96,0.28)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontSize: "12px", color: "#d6ad60" }}>Foundation</div>
            <div style={{ fontSize: "32px", fontWeight: 900 }}>{summary.foundation || 0}</div>
          </div>
          <div style={{ border: "1px solid rgba(214,173,96,0.28)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontSize: "12px", color: "#d6ad60" }}>Doctrine Only</div>
            <div style={{ fontSize: "32px", fontWeight: 900 }}>{summary.doctrine_only || 0}</div>
          </div>
        </div>

        <div style={{ marginTop: "34px", display: "grid", gap: "16px" }}>
          {realBackendClaimsRegistry.map((record) => (
            <div key={record.module} style={{ border: "1px solid rgba(214,173,96,0.2)", borderRadius: "16px", padding: "20px", background: "rgba(255,255,255,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "18px" }}>{record.module}</strong>
                <span style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "999px", background: "rgba(214,173,96,0.15)", color: "#d6ad60" }}>
                  {BACKEND_CLAIM_STATUS_LABELS[record.status]}
                </span>
              </div>
              <p style={{ margin: "8px 0 0", color: "#8899aa", fontSize: "14px" }}>{record.route}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
