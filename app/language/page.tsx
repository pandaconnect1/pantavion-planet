
"use client";

import Link from "next/link";
import { PantavionLanguageSelect, usePantavionLanguage } from "@/components/pantavion/PantavionLanguageSelect";
import { pantavionLanguageDoctrine, pantavionLanguages } from "@/core/i18n/pantavion-global-language";

export default function LanguagePage() {
  const { lang } = usePantavionLanguage();
  const isEl = lang === "el";

  return (
    <main style={{
      minHeight: "100vh",
      background: "#040915",
      color: "white",
      fontFamily: "Arial, Helvetica, sans-serif",
      padding: "34px 18px 100px"
    }}>
      <section style={{
        width: "min(1180px, 100%)",
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

        <p style={{ color: "#f3c454", letterSpacing: ".35em", fontWeight: 900, marginTop: 42 }}>PANTAVION GLOBAL LANGUAGE GRID</p>
        <h1 style={{ fontSize: "clamp(44px, 8vw, 84px)", lineHeight: .96, margin: "14px 0 22px" }}>
          {isEl ? "Παγκόσμιο γλωσσικό σύστημα" : "Global language system"}
        </h1>
        <p style={{ maxWidth: 980, color: "#d8e6ff", fontSize: "clamp(18px, 2.2vw, 24px)", lineHeight: 1.65 }}>
          {isEl ? pantavionLanguageDoctrine.rule : "One language selection follows the user across every Pantavion surface."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginTop: 34 }}>
          {pantavionLanguages.map((language) => (
            <article key={language.code} style={{
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 18,
              padding: 16,
              background: "rgba(255,255,255,.045)"
            }}>
              <strong style={{ color: "#f7d86b", fontSize: 18 }}>{language.label}</strong>
              <p style={{ color: "#c9d7ef", marginBottom: 0 }}>{language.englishName} · {language.continent}</p>
              <small style={{ color: "#93a7c8" }}>{language.tier}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
