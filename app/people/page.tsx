
"use client";

import Link from "next/link";
import { PantavionLanguageSelect, usePantavionLanguage } from "@/components/pantavion/PantavionLanguageSelect";

export default function PantavionRoutePage() {
  const { lang } = usePantavionLanguage();
  const isEl = lang === "el";

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 78% 18%, rgba(31,81,150,.32), transparent 34%), #040915",
      color: "white",
      fontFamily: "Arial, Helvetica, sans-serif",
      padding: "34px 18px 100px"
    }}>
      <section style={{
        width: "min(1080px, 100%)",
        margin: "0 auto",
        border: "1px solid rgba(243,196,84,.35)",
        borderRadius: 28,
        padding: "clamp(22px, 5vw, 54px)",
        background: "rgba(8,17,34,.86)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/" style={{ color: "#fff2b8", textDecoration: "none", fontWeight: 900, border: "1px solid rgba(243,196,84,.45)", borderRadius: 999, padding: "10px 16px" }}>
            {isEl ? "← Πίσω στην αρχική" : "← Back home"}
          </Link>
          <PantavionLanguageSelect label={isEl ? "Γλώσσα" : "Language"} />
        </div>

        <p style={{ color: "#f3c454", letterSpacing: ".35em", fontWeight: 900, marginTop: 42 }}>PANTAVION PEOPLE</p>
        <h1 style={{ fontSize: "clamp(44px, 8vw, 84px)", lineHeight: .96, margin: "14px 0 22px" }}>
          {isEl ? "Άνθρωποι / Trusted Circles" : "People / Trusted Circles"}
        </h1>
        <p style={{ maxWidth: 900, color: "#d8e6ff", fontSize: "clamp(18px, 2.2vw, 24px)", lineHeight: 1.65 }}>
          {isEl ? "Εδώ θα χτιστεί η ανθρώπινη σύνδεση: οικογένεια, φίλοι, trusted contacts, γονείς, κηδεμόνες και κύκλοι προστασίας." : "This surface will hold human connection: family, friends, trusted contacts, parents, guardians and protection circles."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 34 }}>
          <Link href="/sos" style={button("#ef2e37", "white")}>SOS</Link>
          <Link href="/safety" style={button("linear-gradient(135deg,#f7d86b,#d9a82f)", "#080b12")}>
            {isEl ? "Κέντρο ασφάλειας" : "Safety Center"}
          </Link>
          <Link href="/language" style={button("#101828", "white")}>
            {isEl ? "Γλώσσες" : "Languages"}
          </Link>
        </div>
      </section>
    </main>
  );
}

function button(background: string, color: string) {
  return {
    display: "block",
    textAlign: "center" as const,
    textDecoration: "none",
    background,
    color,
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 18,
    padding: "18px 20px",
    fontWeight: 900,
  };
}
