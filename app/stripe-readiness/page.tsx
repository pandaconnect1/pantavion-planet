import {
  STRIPE_READINESS_LEDGER,
  getStripeReadinessSummary,
} from "@/core/pantavion/stripe-readiness-ledger";

const statusLabels = {
  ready_foundation: "Ready foundation",
  blocked_until_business_setup: "Blocked until business setup",
  blocked_until_policy: "Blocked until policy",
  blocked_until_provider_approval: "Blocked until provider approval",
  not_started: "Not started",
} as const;

export default function StripeReadinessPage() {
  const summary = getStripeReadinessSummary();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050711",
        color: "#f6e7b8",
        padding: "48px 20px",
      }}
    >
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <p
          style={{
            margin: "0 0 12px",
            color: "#d6ad60",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontSize: "12px",
          }}
        >
          Pantavion Commercial Gate
        </p>

        <h1
          style={{
            margin: "0 0 16px",
            fontSize: "clamp(36px, 6vw, 72px)",
            lineHeight: 0.95,
          }}
        >
          Stripe Readiness Gate
        </h1>

        <p
          style={{
            maxWidth: "900px",
            color: "#c9d3e7",
            fontSize: "18px",
            lineHeight: 1.7,
          }}
        >
          Pantavion can prepare subscription architecture, commercial terms,
          hosted checkout readiness, and billing policy foundations. Live
          charging remains blocked until business identity, legal terms,
          restricted categories, tax handling, customer cancellation, and
          server-side entitlement verification are complete.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginTop: "28px",
          }}
        >
          <Metric label="Total checks" value={summary.total} />
          <Metric label="Critical checks" value={summary.critical} />
          <Metric label="Ready foundation" value={summary.readyFoundation} />
          <Metric label="Blocked before live" value={summary.blocked} />
        </div>

        <div
          style={{
            marginTop: "28px",
            border: "1px solid rgba(255, 96, 96, 0.45)",
            borderRadius: "22px",
            padding: "20px",
            background: "rgba(255, 96, 96, 0.08)",
          }}
        >
          <strong style={{ color: "#ffd1d1" }}>
            Live charging status: BLOCKED
          </strong>
          <p style={{ margin: "8px 0 0", color: "#f3c7c7", lineHeight: 1.6 }}>
            This page is a readiness gate, not a payment checkout. Pantavion
            must not charge customers until the commercial, legal, tax, refund,
            cancellation, restricted-category, and webhook gates pass.
          </p>
        </div>

        <div style={{ marginTop: "34px", display: "grid", gap: "16px" }}>
          {STRIPE_READINESS_LEDGER.map((item) => (
            <article
              key={item.id}
              style={{
                border: "1px solid rgba(214, 173, 96, 0.28)",
                borderRadius: "22px",
                padding: "22px",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: "24px", color: "#fff7da" }}>
                    {item.title}
                  </h2>
                  <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>
                    {item.id}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Badge text={statusLabels[item.status]} />
                  <Badge text={`${item.risk.toUpperCase()} RISK`} />
                </div>
              </div>

              <p style={{ margin: "18px 0 0", color: "#c9d3e7", lineHeight: 1.7 }}>
                {item.truth}
              </p>

              <h3
                style={{
                  margin: "18px 0 8px",
                  color: "#d6ad60",
                  fontSize: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Required before live
              </h3>

              <ul style={{ margin: 0, paddingLeft: "20px", color: "#c9d3e7", lineHeight: 1.7 }}>
                {item.requiredBeforeLive.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
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
      <strong
        style={{
          display: "block",
          marginTop: "8px",
          color: "#fff7da",
          fontSize: "32px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function Badge({ text }: { text: string }) {
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
      {text}
    </span>
  );
}
