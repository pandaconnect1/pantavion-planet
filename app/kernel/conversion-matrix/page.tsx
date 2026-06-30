import {
  getConversionFormatMatrix,
  summarizeConversionFormatMatrix,
} from "../../../core/kernel/conversion-format-matrix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cents(value: number) {
  if (value <= 0) return "manual/free";
  return `€${(value / 100).toFixed(2)}`;
}

function badgeColor(level: string) {
  if (level === "supported_local") return "#bbf7d0";
  if (level === "provider_required") return "#fde68a";
  if (level === "manual_quote") return "#fed7aa";
  if (level === "blocked_sensitive") return "#fecaca";
  return "#cbd5e1";
}

export default function ConversionMatrixPage() {
  const rows = getConversionFormatMatrix();
  const summary = summarizeConversionFormatMatrix(rows);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050814",
        color: "#f8fafc",
        padding: "32px",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <section style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <p
          style={{
            color: "#f6d37a",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontSize: "12px",
            marginBottom: "12px",
          }}
        >
          Pantavion Professional
        </p>

        <h1 style={{ fontSize: "34px", lineHeight: 1.1, margin: "0 0 12px" }}>
          Conversion Format Matrix
        </h1>

        <p
          style={{
            maxWidth: "940px",
            color: "#cbd5e1",
            fontSize: "16px",
            lineHeight: 1.7,
            marginBottom: "24px",
          }}
        >
          Αναλυτικός πίνακας για το τι μπορεί να δεχτεί και τι μπορεί να
          μετατρέψει το Pantavion. Κάθε output είναι derivative copy. Το original
          μένει preserved και δεν αντικαθίσταται ποτέ.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "26px",
          }}
        >
          {[
            ["Total", summary.totalRows],
            ["Local", summary.supportedLocal],
            ["Provider", summary.providerRequired],
            ["Adapter needed", summary.requiresAdapter],
            ["Manual quote", summary.manualQuote],
            ["Blocked", summary.blockedSensitive],
          ].map(([label, value]) => (
            <article
              key={label}
              style={{
                border: "1px solid rgba(246,211,122,0.25)",
                borderRadius: "18px",
                padding: "16px",
                background: "rgba(15,23,42,0.72)",
              }}
            >
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                {label}
              </p>
              <strong style={{ fontSize: "28px", color: "#f6d37a" }}>
                {value}
              </strong>
            </article>
          ))}
        </div>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid rgba(148,163,184,0.22)",
            borderRadius: "18px",
            background: "rgba(2,6,23,0.72)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "1100px",
            }}
          >
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.95)" }}>
                {[
                  "From",
                  "To",
                  "Status",
                  "Adapter",
                  "License",
                  "Cost",
                  "Zone",
                  "Devices",
                  "User message",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: "left",
                      padding: "14px",
                      color: "#f6d37a",
                      fontSize: "13px",
                      borderBottom: "1px solid rgba(148,163,184,0.18)",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: "14px", borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                    <strong>{row.sourceExtension}</strong>
                    <br />
                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                      {row.sourceLabel}
                    </span>
                  </td>
                  <td style={{ padding: "14px", borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                    <strong>{row.targetExtension}</strong>
                    <br />
                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                      {row.targetLabel}
                    </span>
                  </td>
                  <td style={{ padding: "14px", borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                    <span
                      style={{
                        borderRadius: "999px",
                        padding: "5px 10px",
                        background: "rgba(255,255,255,0.08)",
                        color: badgeColor(row.supportLevel),
                        fontSize: "12px",
                        fontWeight: 800,
                      }}
                    >
                      {row.supportLevel}
                    </span>
                  </td>
                  <td style={{ padding: "14px", borderTop: "1px solid rgba(148,163,184,0.12)", color: "#cbd5e1" }}>
                    {row.adapterName}
                  </td>
                  <td style={{ padding: "14px", borderTop: "1px solid rgba(148,163,184,0.12)", color: "#cbd5e1" }}>
                    {row.licenseStatus}
                  </td>
                  <td style={{ padding: "14px", borderTop: "1px solid rgba(148,163,184,0.12)", color: "#cbd5e1" }}>
                    {row.costBand}
                    <br />
                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                      starts {cents(row.estimatedBaseCostCents)}
                    </span>
                  </td>
                  <td style={{ padding: "14px", borderTop: "1px solid rgba(148,163,184,0.12)", color: "#cbd5e1" }}>
                    {row.riskZone}
                  </td>
                  <td style={{ padding: "14px", borderTop: "1px solid rgba(148,163,184,0.12)", color: "#cbd5e1" }}>
                    mobile: {row.mobile}
                    <br />
                    web: {row.web}
                  </td>
                  <td style={{ padding: "14px", borderTop: "1px solid rgba(148,163,184,0.12)", color: "#cbd5e1", lineHeight: 1.5 }}>
                    {row.userMessage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
