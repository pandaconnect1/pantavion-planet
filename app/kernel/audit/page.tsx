import Link from "next/link";
import { kernelGapRegistry, kernelGapSummary } from "@/core/pantavion/kernel-gap-index";

export const metadata = {
  title: "Kernel Audit | Pantavion One",
  description:
    "Pantavion kernel gap audit covering doctrine, routes, risk, import law, translation, market, media, adult, elite, release gates, SEO, reports, minors and security."
};

const shell = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 75% 10%, rgba(232,185,79,.16), transparent 32rem), radial-gradient(circle at 15% 20%, rgba(57,214,255,.14), transparent 34rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)"
};

const wrap = {
  width: "min(1180px, calc(100% - 40px))",
  margin: "0 auto",
  padding: "64px 0"
};

const card = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(7,18,33,.74)",
  boxShadow: "0 24px 80px rgba(0,0,0,.25)"
};

const badge = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(57,214,255,.12)",
  color: "#dffbff",
  border: "1px solid rgba(57,214,255,.35)",
  fontWeight: 900,
  fontSize: 12,
  textTransform: "uppercase" as const,
  letterSpacing: ".1em"
};

export default function KernelAuditPage() {
  return (
    <main style={shell}>
      <section style={wrap}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>
          ← Pantavion Home
        </Link>

        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".34em", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
          Kernel Audit
        </p>

        <h1 style={{ margin: 0, fontSize: "clamp(42px,7vw,86px)", lineHeight: .94, letterSpacing: "-.06em" }}>
          {kernelGapSummary.total} critical foundations locked before Stripe.
        </h1>

        <p style={{ maxWidth: 900, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>
          {kernelGapSummary.nextRequiredAction}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 38 }}>
          {kernelGapRegistry.map((gap, index) => (
            <article key={`${gap.title}-${index}`} style={card}>
              <span style={badge}>{gap.priority}</span>
              <h2 style={{ margin: "18px 0 10px", fontSize: 25 }}>{gap.title}</h2>
              <p style={{ color: "#f3c454", fontWeight: 900 }}>{gap.status}</p>
              <p style={{ color: "#c7d4df", lineHeight: 1.65 }}>{gap.summary}</p>
              <ul style={{ color: "#fff7e8", lineHeight: 1.65, paddingLeft: 20 }}>
                {(((gap as any).gates ?? []) as string[]).slice(0, 5).map((gate: string) => (
                  <li key={gate}>{gate}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}


