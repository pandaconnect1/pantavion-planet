import { getPantavionAgentRunDashboard } from "../../../../core/agents/pantavion-agent-run-dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Agent Dashboard",
  description: "Pantavion controlled agent runtime dashboard."
};

export default function PantavionAgentDashboardPage() {
  const dashboard = getPantavionAgentRunDashboard();

  return (
    <main style={{
      minHeight: "100vh",
      background: "#050814",
      color: "white",
      padding: "32px",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    }}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <p style={{
          color: "#f6d37a",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 900
        }}>
          Pantavion Agent Runtime
        </p>

        <h1 style={{ fontSize: "42px", margin: "10px 0" }}>
          Agent Run Dashboard
        </h1>

        <p style={{ color: "#b7c7e6", maxWidth: "850px", lineHeight: 1.7 }}>
          Real runtime visibility for safe patch loop, safe writer, selected slice,
          receipts, audit tail and founder approval boundaries.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginTop: "28px"
        }}>
          {dashboard.cards.map((card) => (
            <article
              key={card.id}
              style={{
                border: "1px solid rgba(246, 211, 122, 0.3)",
                borderRadius: "20px",
                padding: "20px",
                background: "rgba(255,255,255,0.04)"
              }}
            >
              <strong style={{ color: card.ok ? "#8ff0b5" : "#ff8181" }}>
                {card.ok ? "OK" : "NEEDS ATTENTION"}
              </strong>

              <h2 style={{ fontSize: "20px", margin: "12px 0 8px" }}>
                {card.title}
              </h2>

              <p style={{ color: "#f6d37a", fontWeight: 800 }}>
                {card.status}
              </p>

              <p style={{ color: "#b7c7e6", lineHeight: 1.6 }}>
                {card.detail}
              </p>
            </article>
          ))}
        </div>

        <section style={{
          marginTop: "28px",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "24px",
          padding: "22px",
          background: "rgba(0,0,0,0.28)"
        }}>
          <h2>Runtime Snapshot</h2>

          <pre style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: "#dbe7ff",
            fontSize: "13px",
            lineHeight: 1.55
          }}>
            {JSON.stringify({
              ok: dashboard.ok,
              generatedAt: dashboard.generatedAt,
              route: dashboard.route,
              page: dashboard.page,
              truthRule: dashboard.truthRule
            }, null, 2)}
          </pre>
        </section>
      </section>
    </main>
  );
}
