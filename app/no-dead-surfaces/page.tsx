import {
  NO_DEAD_SURFACE_LEDGER,
  SURFACE_STATUS_LABELS,
  getNoDeadSurfaceSummary,
} from "@/core/pantavion/no-dead-surface-ledger";

export default function NoDeadSurfacesPage() {
  const summary = getNoDeadSurfaceSummary();

  return (
    <main style={{ minHeight: "100vh", background: "#050711", color: "#f6e7b8", padding: "48px 20px" }}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <p style={{ margin: "0 0 12px", color: "#d6ad60", letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "12px" }}>
          Pantavion Surface Integrity
        </p>

        <h1 style={{ margin: "0 0 16px", fontSize: "clamp(36px, 6vw, 72px)", lineHeight: 0.95 }}>
          No Dead Surface Audit
        </h1>

        <p style={{ maxWidth: "960px", color: "#c9d3e7", fontSize: "18px", lineHeight: 1.7 }}>
          Pantavion cannot look more live than it is. Every visible navigation item, hero action,
          governance link and product surface must have a real route, an honest foundation status,
          a disabled state, or a blocked gate. No empty buttons. No fake-live claims.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "28px" }}>
          <Metric label="Surfaces" value={summary.total} />
          <Metric label="Live routes" value={summary.liveRoutes} />
          <Metric label="Foundation routes" value={summary.foundationRoutes} />
          <Metric label="Blocked/disabled" value={summary.blockedOrDisabled} />
          <Metric label="Critical risk" value={summary.criticalRisk} />
        </div>

        <div style={{ marginTop: "28px", border: "1px solid rgba(255,96,96,0.45)", borderRadius: "22px", padding: "20px", background: "rgba(255,96,96,0.08)" }}>
          <strong style={{ color: "#ffd1d1" }}>Surface rule: every visible action needs truth.</strong>
          <p style={{ margin: "8px 0 0", color: "#f3c7c7", lineHeight: 1.6 }}>
            If a button has no route, no action, no disabled state and no gate, it must not be visible.
            Pantavion must stay premium, real and governed.
          </p>
        </div>

        <div style={{ marginTop: "34px", display: "grid", gap: "16px" }}>
          {NO_DEAD_SURFACE_LEDGER.map((surface) => (
            <article
              key={surface.id}
              style={{
                border: "1px solid rgba(214,173,96,0.28)",
                borderRadius: "22px",
                padding: "22px",
                background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "24px", color: "#fff7da" }}>{surface.label}</h2>
                  <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>{surface.href}</p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Badge text={SURFACE_STATUS_LABELS[surface.status]} />
                  <Badge text={`${surface.risk.toUpperCase()} RISK`} />
                  <Badge text={surface.type.replaceAll("_", " ").toUpperCase()} />
                </div>
              </div>

              <GridBlock title="Allowed claim" text={surface.allowedClaim} />
              <GridBlock title="Blocked claim" text={surface.blockedClaim} />
              <GridBlock title="Required next" text={surface.requiredNext} />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "1px solid rgba(214,173,96,0.26)", borderRadius: "20px", padding: "18px", background: "rgba(255,255,255,0.045)" }}>
      <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>{label}</p>
      <strong style={{ display: "block", marginTop: "8px", color: "#fff7da", fontSize: "32px" }}>{value}</strong>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span style={{ border: "1px solid rgba(214,173,96,0.35)", borderRadius: "999px", padding: "7px 10px", color: "#f6e7b8", background: "rgba(214,173,96,0.1)", fontSize: "12px", whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

function GridBlock({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ marginTop: "16px" }}>
      <h3 style={{ margin: "0 0 6px", color: "#d6ad60", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: "#c9d3e7", lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}
