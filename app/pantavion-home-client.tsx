"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PANTAVION_LANGUAGE_CATALOG,
  getPantavionUiLanguage,
  getSupportedPantavionLanguage,
} from "@/core/language/pantavion-language-catalog";

type Lang = string;

const UI = {
  el: {
    language: "λώσσα Pantavion",
    badge: "PANTAVION PLANET",
    languageSpineTitle: "εντρική επιλογή γλώσσας Pantavion",
    languageSpine:
      " γλώσσα που επιλέγεις εδώ αποθηκεύεται ως πρωταρχική γλώσσα Pantavion και θα ισχύει στις δημόσιες και προστατευμένες ενότητες.",
    title: " πλανήτης σε μία ζωντανή οθόνη.",
    subtitle:
      "πικοινωνία, ασφάλεια SOS, τεχνητή νοημοσύνη, εργασία, υπηρεσίες και προστατευμένες επαγγελματικές ενότητες σε ένα οργανωμένο οικοσύστημα.",
    sos: "SOS Center",
    requestAccess: "ίτηση προστατευμένης πρόσβασης",
    interpreter: "Universal Interpreter",
    pantaAI: "PantaAI Center",
    accessEyebrow: "PROTECTED ACCESS",
    accessTitle: "παγγελματικές ενότητες με έγκριση",
    accessText:
      "ι ευαίσθητες υποδομές και οι επαγγελματικές λειτουργίες του Pantavion εμφανίζονται μόνο μετά από έγκριση, ρόλο και καταγραφή πρόσβασης.",
    infrastructureTitle: "ροστατευμένες υποδομές",
    infrastructureText:
      "ι χάρτες, τα τεχνικά αρχεία και τα επιχειρησιακά δεδομένα δεν προβάλλονται δημόσια.",
    rolesTitle: "ρόσβαση ανά ρόλο",
    rolesText:
      "άθε εγκεκριμένος χρήστης βλέπει μόνο τις ενότητες που αντιστοιχούν στην ευθύνη του.",
    auditTitle: "Έλεγχος και καταγραφή",
    auditText:
      "ι ευαίσθητες ενέργειες πρέπει να περνούν από έλεγχο, έγκριση και audit trail.",
    waterEntry: "ίσοδος / αίτηση πρόσβασης υποδομών",
    languageNote:
      " πλήρης αυτόματη μετάφραση και η φωνητική λειτουργία θα συνδεθούν σταδιακά μέσω του Translation Kernel/provider.",
  },
  en: {
    language: "Pantavion Language",
    badge: "PANTAVION PLANET",
    languageSpineTitle: "Pantavion global language selection",
    languageSpine:
      "The language selected here is saved as the primary Pantavion language and will apply across public and protected sections.",
    title: "The planet in one living screen.",
    subtitle:
      "Communication, SOS safety, artificial intelligence, work, services, and protected professional sections in one governed ecosystem.",
    sos: "SOS Center",
    requestAccess: "Request protected access",
    interpreter: "Universal Interpreter",
    pantaAI: "PantaAI Center",
    accessEyebrow: "PROTECTED ACCESS",
    accessTitle: "Professional sections with approval",
    accessText:
      "Sensitive infrastructure and professional Pantavion operations are shown only after approval, role assignment, and access logging.",
    infrastructureTitle: "Protected infrastructure",
    infrastructureText:
      "Maps, technical files, and operational data are not exposed publicly.",
    rolesTitle: "Role-based access",
    rolesText:
      "Each approved user sees only the sections that match their responsibility.",
    auditTitle: "Control and audit",
    auditText:
      "Sensitive actions must pass through review, approval, and audit trail.",
    waterEntry: "Infrastructure access / request",
    languageNote:
      "Full automatic translation and voice operation will be connected gradually through the Translation Kernel/provider.",
  },
};

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "el";

  const saved = window.localStorage.getItem("pantavion-language");

  return getSupportedPantavionLanguage(saved)?.code ?? "el";
}

export default function HomePage() {
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const t = UI[getPantavionUiLanguage(lang)];

  useEffect(() => {
    window.localStorage.setItem("pantavion-language", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#192b55_0,#071020_48%,#02040b_100%)] px-4 py-6 text-[#fff8e7] sm:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border border-[#f6c85f]/25 bg-[#071020]/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#f6c85f]">{t.languageSpineTitle}</p>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-200 sm:text-base">
                {t.languageSpine}
              </p>
              <p className="mt-2 text-xs font-bold text-slate-400">
                {t.languageNote}
              </p>
            </div>

            <label className="flex min-w-[240px] flex-col gap-2 text-sm font-black text-[#f6c85f]">
              {t.language}
              <select
                value={lang}
                onChange={(event) => setLang(event.target.value)}
                className="rounded-2xl border border-[#f6c85f]/50 bg-[#071020] px-4 py-3 text-white outline-none"
              >
                {PANTAVION_LANGUAGE_CATALOG.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <section className="rounded-[2rem] border border-[#f6c85f]/20 bg-[#0d1a2d]/70 p-5 shadow-2xl sm:p-8 lg:p-10">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-[#f6c85f]">
            {t.badge}
          </p>

          <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl leading-8 text-slate-200 sm:text-2xl sm:leading-10">
            {t.subtitle}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
            <Link
              href="/sos"
              className="rounded-full bg-[#ff2f3f] px-6 py-4 text-center text-base font-black text-white"
            >
              {t.sos}
            </Link>

            <Link
              href="/professional/infrastructure/water"
              className="rounded-full border border-[#f6c85f]/60 bg-[#f6c85f]/15 px-6 py-4 text-center text-base font-black text-[#fff8e7]"
            >
              {t.requestAccess}
            </Link>

            <Link
              href="/translate"
              className="rounded-full bg-[#f6c85f] px-6 py-4 text-center text-base font-black text-[#071020]"
            >
              {t.interpreter}
            </Link>

            <Link
              href="/panta-ai"
              className="rounded-full border border-[#f6c85f]/45 bg-white/5 px-6 py-4 text-center text-base font-black text-[#fff8e7]"
            >
              {t.pantaAI}
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#f6c85f]/20 bg-[#071020]/80 p-5 shadow-2xl sm:p-8">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-[#f6c85f]">
            {t.accessEyebrow}
          </p>

          <h2 className="max-w-4xl text-3xl font-black sm:text-5xl">
            {t.accessTitle}
          </h2>

          <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-200">
            {t.accessText}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[#f6c85f]/20 bg-[#0d1a2d]/70 p-5">
              <h3 className="text-xl font-black text-[#fff8e7]">{t.infrastructureTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{t.infrastructureText}</p>
            </article>

            <article className="rounded-3xl border border-[#f6c85f]/20 bg-[#0d1a2d]/70 p-5">
              <h3 className="text-xl font-black text-[#fff8e7]">{t.rolesTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{t.rolesText}</p>
            </article>

            <article className="rounded-3xl border border-[#f6c85f]/20 bg-[#0d1a2d]/70 p-5">
              <h3 className="text-xl font-black text-[#fff8e7]">{t.auditTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{t.auditText}</p>
            </article>
          </div>

          <Link
            href="/professional/infrastructure/water"
            className="mt-6 inline-flex rounded-full border border-[#f6c85f]/60 bg-[#f6c85f]/15 px-6 py-4 text-center text-base font-black text-[#fff8e7]"
          >
            {t.waterEntry}
          </Link>
        </section>
      </section>
    </main>
  );
}
