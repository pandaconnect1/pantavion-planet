"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Lang = "el" | "en";

const copy = {
  el: {
    login: "Είσοδος",
    eyebrow: "PANTAVION ONE",
    titleA: "One Planet.",
    titleB: "One Living Screen.",
    titleC: "All Humanity Connected.",
    subtitle:
      "Ένα παγκόσμιο human-first οικοσύστημα για επικοινωνία, γνώση, μνήμη, εργασία, δημιουργία, ασφάλεια και AI-assisted execution — με ζωντανό SOS, Guardian Mode και emergency readiness για όλη την ανθρωπότητα.",
    open: "Enter Pantavion",
    sosNow: "Άνοιγμα SOS τώρα",
    guardian: "Guardian Mode",
    sosBadge: "ΖΩΝΤΑΝΟ SOS",
    sosTitle: "Pantavion LifeShield SOS",
    sosText:
      "Άμεση πρόσβαση από κινητό, tablet και desktop. Το SOS ανοίγει πραγματικές browser/PWA ενέργειες: τοποθεσία, offline ουρά, share, SMS, χάρτη, evidence capsule και Guardian check-in.",
    mobileTitle: "Mobile-first emergency layer",
    mobileText:
      "Η αρχική πλέον δεν είναι μισή σελίδα στο κινητό. Κυλάει κανονικά, δείχνει καθαρά το SOS και δίνει άμεση πρόσβαση στην ασφάλεια.",
  },
  en: {
    login: "Sign In",
    eyebrow: "PANTAVION ONE",
    titleA: "One Planet.",
    titleB: "One Living Screen.",
    titleC: "All Humanity Connected.",
    subtitle:
      "A human-first global ecosystem for communication, knowledge, memory, work, creation, safety and AI-assisted execution — with live SOS, Guardian Mode and emergency readiness for all humanity.",
    open: "Enter Pantavion",
    sosNow: "Open SOS now",
    guardian: "Guardian Mode",
    sosBadge: "LIVE SOS",
    sosTitle: "Pantavion LifeShield SOS",
    sosText:
      "Immediate access from phone, tablet and desktop. SOS opens real browser/PWA actions: location, offline queue, share, SMS, map, evidence capsule and Guardian check-in.",
    mobileTitle: "Mobile-first emergency layer",
    mobileText:
      "The homepage is no longer a half-screen mobile landing page. It scrolls fully, exposes SOS clearly and gives immediate access to safety.",
  },
};

const navItems = [
  ["Planet", "/planet"],
  ["Language", "/language"],
  ["People", "/people"],
  ["Media", "/media"],
  ["PantaAI", "/ai"],
  ["Work", "/work"],
  ["Safety", "/safety"],
  ["SOS", "/sos"],
  ["Guardian", "/pantavion/emergency/guardian"],
  ["Dashboard", "/dashboard"],
] as const;

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("el");
  const t = copy[lang];

  useEffect(() => {
    try {
      if (navigator.language.toLowerCase().startsWith("en")) {
        setLang("en");
      }
    } catch {
      setLang("el");
    }
  }, []);

  return (
    <main className="pantavion-home">
      <nav className="topbar">
        <Link href="/" className="brand" aria-label="Pantavion home">
          <span className="brandOrb" />
          <span>pantavion.com</span>
        </Link>

        <div className="navScroll" aria-label="Pantavion navigation">
          {navItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={label === "SOS" ? "navPill sosNav" : "navPill"}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="languageControls">
          <button
            type="button"
            onClick={() => setLang("el")}
            className={lang === "el" ? "lang active" : "lang"}
          >
            ΕΛ
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={lang === "en" ? "lang active" : "lang"}
          >
            EN
          </button>
          <Link href="/pricing" className="login">
            {t.login}
          </Link>
        </div>
      </nav>

      <section className="liveSosBanner">
        <div>
          <p>{t.sosBadge}</p>
          <h2>{t.sosTitle}</h2>
          <span>{t.sosText}</span>
        </div>

        <div className="sosActions">
          <Link href="/sos" className="redAction">
            {t.sosNow}
          </Link>
          <Link href="/pantavion/emergency/guardian" className="goldAction">
            {t.guardian}
          </Link>
        </div>
      </section>

      <section className="hero">
        <div className="heroText">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>
            {t.titleA}
            <br />
            <strong>{t.titleB}</strong>
            <br />
            {t.titleC}
          </h1>
          <p className="subtitle">{t.subtitle}</p>

          <div className="ctaRow">
            <Link href="/pricing" className="primaryCta">
              {t.open} →
            </Link>
            <Link href="/sos" className="dangerCta">
              {t.sosNow}
            </Link>
            <Link href="/pantavion/emergency/guardian" className="ghostCta">
              {t.guardian}
            </Link>
          </div>
        </div>

        <div className="planetArea" aria-hidden="true">
          <div className="planetOrb">
            <span className="sun" />
            <span className="ring ring1" />
            <span className="ring ring2" />
            <span className="ring ring3" />
          </div>
        </div>
      </section>

      <section className="emergencyGrid" aria-label="Pantavion emergency systems">
        <Link href="/sos" className="emergencyCard critical">
          <strong>Live SOS</strong>
          <span>Real browser/PWA emergency command center</span>
        </Link>

        <Link href="/pantavion/emergency" className="emergencyCard">
          <strong>LifeShield</strong>
          <span>Emergency profile, device support and offline doctrine</span>
        </Link>

        <Link href="/pantavion/emergency/guardian" className="emergencyCard">
          <strong>Guardian Mode</strong>
          <span>Before travel, driving, child safety, hunting or isolation</span>
        </Link>

        <Link href="/pantavion/emergency/evidence" className="emergencyCard">
          <strong>Evidence Capsule</strong>
          <span>Photo, video and audio capture with permission boundaries</span>
        </Link>

        <Link href="/pantavion/emergency/extreme-offgrid" className="emergencyCard">
          <strong>Extreme Off-grid</strong>
          <span>Remote area, disaster, no-signal and satellite-aware doctrine</span>
        </Link>

        <Link href="/pantavion/emergency/partners" className="emergencyCard">
          <strong>Institution Gateway</strong>
          <span>Countries, agencies, rescue teams and providers can request review</span>
        </Link>
      </section>

      <section className="mobileProof">
        <strong>{t.mobileTitle}</strong>
        <span>{t.mobileText}</span>
      </section>

      <Link href="/sos" className="floatingSos" aria-label="Open Pantavion SOS">
        SOS
      </Link>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          background: #040c18;
        }

        .pantavion-home {
          min-height: 100svh;
          overflow-x: hidden;
          color: white;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          background: radial-gradient(
              circle at 76% 28%,
              rgba(48, 104, 190, 0.28),
              transparent 35%
            ),
            radial-gradient(
              circle at 12% 88%,
              rgba(212, 168, 67, 0.12),
              transparent 30%
            ),
            #040c18;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          padding: 12px clamp(14px, 3vw, 34px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(4, 8, 18, 0.94);
          backdrop-filter: blur(16px);
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: white;
          text-decoration: none;
          font-weight: 950;
          white-space: nowrap;
        }

        .brandOrb {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 35% 35%,
            #f6d66f,
            #4a9eff 58%,
            #030711 80%
          );
          box-shadow: 0 0 18px rgba(212, 168, 67, 0.55);
        }

        .navScroll {
          display: flex;
          justify-content: center;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 2px;
        }

        .navScroll::-webkit-scrollbar {
          display: none;
        }

        .navPill,
        .lang,
        .login {
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.025);
          color: white;
          text-decoration: none;
          font-size: 12px;
          font-weight: 850;
          white-space: nowrap;
        }

        .navPill {
          padding: 7px 13px;
        }

        .sosNav {
          background: rgba(220, 38, 38, 0.22);
          border-color: rgba(248, 113, 113, 0.72);
          box-shadow: 0 0 18px rgba(239, 68, 68, 0.18);
        }

        .languageControls {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
        }

        .lang {
          cursor: pointer;
          padding: 5px 10px;
          color: #8796ad;
        }

        .lang.active {
          color: #f3cf67;
          border-color: rgba(212, 168, 67, 0.75);
          background: rgba(212, 168, 67, 0.14);
        }

        .login {
          margin-left: 5px;
          padding: 7px 16px;
          color: #f3cf67;
          border-color: rgba(212, 168, 67, 0.5);
        }

        .liveSosBanner {
          width: calc(100% - 40px);
          max-width: 1320px;
          margin: 24px auto 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          padding: clamp(18px, 3vw, 28px);
          border-radius: 28px;
          border: 1px solid rgba(248, 113, 113, 0.34);
          background: linear-gradient(
            135deg,
            rgba(127, 29, 29, 0.38),
            rgba(15, 23, 42, 0.82)
          );
          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.28);
        }

        .liveSosBanner p,
        .eyebrow {
          margin: 0 0 8px;
          color: #f3cf67;
          font-size: 11px;
          letter-spacing: 0.36em;
          font-weight: 950;
          text-transform: uppercase;
        }

        .liveSosBanner h2 {
          margin: 0 0 10px;
          font-size: clamp(28px, 4vw, 54px);
          line-height: 1.05;
          letter-spacing: -0.045em;
        }

        .liveSosBanner span {
          color: #d8e4f6;
          line-height: 1.65;
        }

        .sosActions {
          display: grid;
          gap: 10px;
          min-width: 240px;
        }

        .redAction,
        .dangerCta,
        .floatingSos {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          box-shadow: 0 14px 42px rgba(239, 68, 68, 0.28);
        }

        .goldAction,
        .primaryCta {
          background: linear-gradient(135deg, #d4a843, #f0cf68);
          color: #080604;
          box-shadow: 0 12px 34px rgba(212, 168, 67, 0.28);
        }

        .redAction,
        .goldAction,
        .primaryCta,
        .dangerCta,
        .ghostCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
          border-radius: 16px;
          padding: 14px 22px;
          text-decoration: none;
          font-weight: 950;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .hero {
          max-width: 1380px;
          margin: 0 auto;
          padding: clamp(34px, 6vw, 86px) clamp(16px, 4vw, 60px) 34px;
          display: grid;
          grid-template-columns: minmax(0, 1.04fr) minmax(280px, 0.96fr);
          gap: clamp(24px, 5vw, 70px);
          align-items: center;
        }

        .hero h1 {
          margin: 12px 0 20px;
          font-size: clamp(44px, 7vw, 82px);
          line-height: 1.02;
          letter-spacing: -0.055em;
          font-weight: 1000;
        }

        .hero h1 strong {
          color: #d4a843;
        }

        .subtitle {
          max-width: 680px;
          color: #b8c8df;
          font-size: clamp(15px, 1.6vw, 19px);
          line-height: 1.75;
        }

        .ctaRow {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }

        .ghostCta {
          color: white;
          background: rgba(255, 255, 255, 0.035);
        }

        .planetArea {
          display: grid;
          place-items: center;
          min-height: 420px;
        }

        .planetOrb {
          position: relative;
          width: min(460px, 72vw);
          aspect-ratio: 1;
          border-radius: 999px;
          background: radial-gradient(
            circle at 50% 50%,
            #fff 0%,
            #f3cf67 6%,
            #123d78 16%,
            #0d2748 38%,
            #071426 64%,
            #000 100%
          );
          box-shadow: 0 0 90px 22px rgba(100, 160, 255, 0.18),
            0 0 200px 60px rgba(30, 80, 180, 0.1),
            inset 0 0 70px rgba(240, 200, 95, 0.08);
          overflow: hidden;
        }

        .sun {
          position: absolute;
          inset: 42%;
          border-radius: 999px;
          background: radial-gradient(circle, #fff, #d4a843 52%, transparent 74%);
          box-shadow: 0 0 46px 15px rgba(212, 168, 67, 0.58);
        }

        .ring {
          position: absolute;
          border-radius: 999px;
          border: 1px solid rgba(120, 170, 255, 0.16);
        }

        .ring1 {
          inset: 8%;
        }

        .ring2 {
          inset: 21%;
        }

        .ring3 {
          inset: 34%;
        }

        .emergencyGrid {
          width: calc(100% - 40px);
          max-width: 1320px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .emergencyCard {
          min-height: 150px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
          padding: 20px;
          border-radius: 22px;
          text-decoration: none;
          color: white;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.11);
        }

        .emergencyCard.critical {
          background: linear-gradient(
            135deg,
            rgba(220, 38, 38, 0.48),
            rgba(255, 255, 255, 0.04)
          );
          border-color: rgba(248, 113, 113, 0.55);
        }

        .emergencyCard strong {
          color: #f3cf67;
          font-size: 22px;
        }

        .emergencyCard span {
          color: #b8c8df;
          line-height: 1.58;
          font-size: 14px;
        }

        .mobileProof {
          width: calc(100% - 40px);
          max-width: 1320px;
          margin: 18px auto 100px;
          padding: 22px;
          border-radius: 22px;
          border: 1px solid rgba(212, 168, 67, 0.2);
          background: rgba(255, 255, 255, 0.04);
          color: #bed0ee;
          line-height: 1.6;
        }

        .mobileProof strong {
          display: block;
          margin-bottom: 6px;
          color: #f3cf67;
        }

        .floatingSos {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 90;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 86px;
          height: 56px;
          padding: 0 18px;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 1000;
          letter-spacing: 0.02em;
          border: 1px solid rgba(255, 255, 255, 0.24);
        }

        @media (max-width: 940px) {
          .topbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-start;
            gap: 10px;
          }

          .brand {
            width: 100%;
          }

          .navScroll {
            order: 3;
            justify-content: flex-start;
            width: 100%;
          }

          .languageControls {
            margin-left: auto;
          }

          .liveSosBanner {
            grid-template-columns: 1fr;
          }

          .sosActions {
            min-width: 0;
          }

          .hero {
            grid-template-columns: 1fr;
          }

          .planetArea {
            order: -1;
            min-height: 260px;
          }

          .planetOrb {
            width: min(340px, 86vw);
          }

          .emergencyGrid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 620px) {
          .pantavion-home {
            padding-bottom: 86px;
          }

          .topbar {
            padding: 10px 12px;
          }

          .brand span:last-child {
            font-size: 14px;
          }

          .languageControls {
            display: none;
          }

          .liveSosBanner {
            width: calc(100% - 24px);
            margin-top: 12px;
            border-radius: 22px;
            padding: 18px;
          }

          .liveSosBanner h2 {
            font-size: 32px;
          }

          .hero {
            padding: 30px 14px 24px;
          }

          .hero h1 {
            font-size: clamp(40px, 13vw, 54px);
          }

          .subtitle {
            font-size: 16px;
          }

          .ctaRow {
            display: grid;
            grid-template-columns: 1fr;
          }

          .primaryCta,
          .dangerCta,
          .ghostCta,
          .redAction,
          .goldAction {
            width: 100%;
          }

          .emergencyGrid {
            width: calc(100% - 24px);
            grid-template-columns: 1fr;
          }

          .mobileProof {
            width: calc(100% - 24px);
            margin-bottom: 110px;
          }

          .floatingSos {
            left: 14px;
            right: 14px;
            bottom: 14px;
            width: auto;
            height: 58px;
            border-radius: 18px;
            font-size: 20px;
          }
        }
      `}</style>
    </main>
  );
}