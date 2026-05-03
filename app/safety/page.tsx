
"use client";

import Link from "next/link";
import { PantavionLanguageSelect, usePantavionLanguage } from "@/components/pantavion/PantavionLanguageSelect";
import { explainActionState, pantavionButtonLaw } from "@/core/actions/pantavion-action-state";
import { humanSafetyScenarios } from "@/core/safety/human-safety-scenarios";

const copy = {
  el: {
    back: "← Πίσω στην αρχική",
    eyebrow: "PANTAVION HUMAN SAFETY",
    title: "Κέντρο Ανθρώπινης Ασφάλειας",
    intro: "Παιδιά, έφηβοι, ηλικιωμένοι, βία, bullying, ληστεία, πτώση, ταξίδι, καταστροφή και απομόνωση — όλα πρέπει να είναι απλά, αληθινά και προσβάσιμα.",
    language: "Γλώσσα",
    openSos: "Άνοιγμα SOS",
    guardian: "Guardian Mode",
    rule: "Κανόνας κουμπιών",
    scenarios: "Βασικά σενάρια ασφάλειας",
    actionState: "Κατάσταση ενέργειας",
    trusted: "Trusted contacts πρώτα",
    silent: "Silent option",
    yes: "Ναι",
    no: "Όχι",
    next: "Επόμενο: σύνδεση με πραγματικό onboarding ηλικίας, trusted contacts και consent.",
  },
  en: {
    back: "← Back home",
    eyebrow: "PANTAVION HUMAN SAFETY",
    title: "Human Safety Center",
    intro: "Children, teens, elders, violence, bullying, robbery, falls, travel, disasters and isolation must stay simple, real and accessible.",
    language: "Language",
    openSos: "Open SOS",
    guardian: "Guardian Mode",
    rule: "Button rule",
    scenarios: "Core safety scenarios",
    actionState: "Action state",
    trusted: "Trusted contacts first",
    silent: "Silent option",
    yes: "Yes",
    no: "No",
    next: "Next: connect to real age onboarding, trusted contacts and consent.",
  },
};

function localized(value: { el: string; en: string }, lang: string) {
  return lang === "el" ? value.el : value.en;
}

export default function SafetyPage() {
  const { lang } = usePantavionLanguage();
  const t = lang === "el" ? copy.el : copy.en;

  return (
    <main className="safetyShell">
      <section className="panel">
        <div className="top">
          <Link href="/" className="back">{t.back}</Link>
          <PantavionLanguageSelect label={t.language} />
        </div>

        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p className="intro">{t.intro}</p>

        <div className="actions">
          <Link href="/sos" className="red">{t.openSos}</Link>
          <Link href="/pantavion/emergency/guardian" className="gold">{t.guardian}</Link>
        </div>

        <article className="law">
          <h2>{t.rule}</h2>
          <p>{lang === "el" ? pantavionButtonLaw.el : pantavionButtonLaw.en}</p>
        </article>

        <h2 className="sectionTitle">{t.scenarios}</h2>
        <section className="grid">
          {humanSafetyScenarios.map((scenario) => (
            <article key={scenario.id} className="card">
              <h3>{localized(scenario.title, lang)}</h3>
              <p>{localized(scenario.description, lang)}</p>
              <small>{t.actionState}: {explainActionState(scenario.primaryAction, lang)}</small>
              <small>{t.trusted}: {scenario.trustedContactFirst ? t.yes : t.no}</small>
              <small>{t.silent}: {scenario.silentOption ? t.yes : t.no}</small>
            </article>
          ))}
        </section>

        <article className="next">{t.next}</article>
      </section>

      <style>{`
        .safetyShell {
          min-height: 100vh;
          background: radial-gradient(circle at 75% 10%, rgba(31, 81, 150, .35), transparent 34%), #040915;
          color: white;
          font-family: Arial, Helvetica, sans-serif;
          padding: 42px 18px 110px;
        }
        .panel {
          width: min(1180px, 100%);
          margin: 0 auto;
          border: 1px solid rgba(243,196,84,.35);
          border-radius: 28px;
          padding: clamp(22px, 5vw, 54px);
          background: rgba(8, 17, 34, .86);
        }
        .top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
        }
        .back, .gold, .red {
          text-decoration: none;
          font-weight: 900;
          border-radius: 999px;
        }
        .back {
          color: #fff2b8;
          border: 1px solid rgba(243,196,84,.45);
          padding: 10px 16px;
        }
        .eyebrow {
          color: #f3c454;
          letter-spacing: .35em;
          font-weight: 900;
          margin-top: 42px;
        }
        h1 {
          font-size: clamp(42px, 8vw, 82px);
          line-height: .96;
          margin: 14px 0 22px;
        }
        .intro {
          max-width: 980px;
          color: #d8e6ff;
          font-size: clamp(18px, 2.2vw, 24px);
          line-height: 1.65;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin: 30px 0;
        }
        .red, .gold {
          padding: 18px 24px;
          min-width: 220px;
          text-align: center;
        }
        .red {
          background: #ef2e37;
          color: white;
          box-shadow: 0 22px 55px rgba(239,46,55,.25);
        }
        .gold {
          background: linear-gradient(135deg, #f7d86b, #d9a82f);
          color: #080b12;
        }
        .law, .next {
          border: 1px solid rgba(243,196,84,.35);
          background: rgba(243,196,84,.08);
          border-radius: 22px;
          padding: 20px;
          margin: 28px 0;
        }
        .sectionTitle {
          color: #f7d86b;
          font-size: 34px;
          margin-top: 36px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        .card {
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 24px;
          padding: 22px;
          background: rgba(255,255,255,.045);
          min-height: 230px;
        }
        .card h3 {
          color: #f7d86b;
          font-size: 24px;
          margin: 0 0 16px;
        }
        .card p {
          color: #dbe7ff;
          line-height: 1.55;
        }
        .card small {
          display: block;
          color: #b7c8e8;
          margin-top: 9px;
          font-weight: 800;
        }
        @media (max-width: 700px) {
          .panel { border-radius: 0; border-left: 0; border-right: 0; }
          .red, .gold { width: 100%; }
        }
      `}</style>
    </main>
  );
}
