import Link from "next/link";

export const metadata = {
  title: "Deep Audit Gate | Pantavion One",
  description: "Pantavion Deep Audit Gate before Stripe, public launch, live payments and real-world execution."
};

export default function DeepAuditPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "64px 20px",
        color: "#fff7e8",
        background:
          "radial-gradient(circle at 78% 12%, rgba(232,185,79,.16), transparent 30rem), linear-gradient(135deg,#020712,#06111f 54%,#071a2d)"
      }}
    >
      <section style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          Pantavion Home
        </Link>

        <p
          style={{
            marginTop: 36,
            color: "#f3c454",
            letterSpacing: ".28em",
            fontWeight: 900,
            textTransform: "uppercase"
          }}
        >
          Deep Audit Gate v1
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(42px,7vw,84px)",
            lineHeight: .95,
            letterSpacing: "-.06em"
          }}
        >
          Zero uncontrolled risk before Stripe.
        </h1>

        <p style={{ maxWidth: 900, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          Pantavion must pass legal, security, AI, translation, import, marketplace,
          media/radio, backend-claims and no-dead-surface gates before live charging,
          public launch or real-world execution.
        </p>

        <section
          style={{
            marginTop: 42,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 14
          }}
        >
          {[
            "Global Jurisdiction Matrix",
            "Security Control Ledger",
            "No Dead Surface Policy",
            "Translation Safety Ledger",
            "Import World Consent Matrix",
            "Real Backend Claims Registry",
            "Official Alert Authority Matrix",
            "AI Sovereignty Roadmap",
            "Stripe Readiness Block",
            "Marketplace Restricted Goods Policy"
          ].map((item) => (
            <article
              key={item}
              style={{
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 24,
                padding: 22,
                background: "rgba(7,18,33,.76)"
              }}
            >
              <p style={{ margin: 0, color: "#f3c454", fontWeight: 900 }}>
                {item}
              </p>
              <p style={{ color: "#c7d4df", lineHeight: 1.6 }}>
                Required before uncontrolled public, payment or emergency execution.
              </p>
            </article>
          ))}
        </section>

        <section
          style={{
            marginTop: 42,
            border: "1px solid rgba(255,107,107,.35)",
            borderRadius: 28,
            padding: 26,
            background: "linear-gradient(135deg,rgba(255,107,107,.12),rgba(7,18,33,.78))"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Locked Rule</h2>
          <p style={{ color: "#c7d4df", fontSize: 18, lineHeight: 1.7 }}>
            Stripe live payments, marketplace payouts, adult/restricted payments,
            real SOS authority dispatch, third-party scraping, unlicensed media/radio
            broadcasting and fake native-AI claims remain blocked until their gates pass.
          </p>
        </section>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
          <Link href="/readiness" style={{ color: "#06111f", background: "#f3c454", padding: "12px 18px", borderRadius: 999, fontWeight: 900, textDecoration: "none" }}>
            Readiness
          </Link>
          <Link href="/kernel/audit" style={{ color: "#dffbff", border: "1px solid rgba(57,214,255,.35)", padding: "12px 18px", borderRadius: 999, fontWeight: 900, textDecoration: "none" }}>
            Kernel Audit
          </Link>
          <Link href="/architecture" style={{ color: "#dffbff", border: "1px solid rgba(57,214,255,.35)", padding: "12px 18px", borderRadius: 999, fontWeight: 900, textDecoration: "none" }}>
            Architecture
          </Link>
        </div>
      </section>
    </main>
  );
}
