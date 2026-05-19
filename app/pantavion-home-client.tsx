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
    language: "Γλώσσα Pantavion",
    badge: "PANTAVION PLANET",
    languageSpineTitle: "Κεντρική επιλογή γλώσσας Pantavion",
    languageSpine:
      "Η γλώσσα που επιλέγεις εδώ αποθηκεύεται ως πρωταρχική γλώσσα Pantavion και θα ισχύει σε κάθε ενότητα: Water, SOS, Interpreter, PantaAI και μελλοντικά modules.",
    title: "Ο πλανήτης σε μία ζωντανή οθόνη.",
    subtitle:
      "Επικοινωνία, ασφάλεια SOS, PantaAI, άνθρωποι, εργασία, πολιτισμός, υπηρεσίες και προστατευμένες επαγγελματικές ενότητες σε ένα οργανωμένο οικοσύστημα.",
    water: "Δίκτυο Ύδρευσης",
    interpreter: "Universal Interpreter",
    pantaAI: "PantaAI",
    sos: "SOS Center",
    discoveryTitle: "Πραγματικές ενότητες Pantavion",
    discoveryText:
      "Κάθε κουμπί οδηγεί σε πραγματική διαδρομή ή προστατευμένη ενότητα. Δεν αφήνουμε σπασμένες σελίδες για επίσημη παρουσίαση.",
    waterTitle: "Προστατευμένο Δίκτυο Ύδρευσης",
    waterText:
      "Είσοδος στο καθαρό live module με αίτηση πρόσβασης, έγκριση και τμηματική φόρτωση αγωγών.",
    translateTitle: "Universal Interpreter",
    translateText:
      "Μελλοντικός καθολικός διερμηνέας για κείμενο, φωνή, ταξίδι, εργασία, δημόσιες υπηρεσίες και SOS.",
    aiTitle: "PantaAI Center",
    aiText:
      "Κέντρο τεχνητής νοημοσύνης, εργασίας, αναζήτησης, μνήμης και εκτέλεσης.",
    sosTitle: "SOS Center",
    sosText:
      "Ασφάλεια, trusted contacts, elder mode και σαφή όρια χωρίς ψεύτικες υποσχέσεις αποστολής αρχών.",
    languageNote:
      "Η λίστα 250+ γλωσσών είναι κοινή για όλο το Pantavion. Οι πλήρεις αυτόματες μεταφράσεις θα συνδεθούν μέσω Translation Kernel/provider.",
  },
  en: {
    language: "Pantavion Language",
    badge: "PANTAVION PLANET",
    languageSpineTitle: "Pantavion global language selection",
    languageSpine:
      "The language selected here is saved as the primary Pantavion language and will apply across Water, SOS, Interpreter, PantaAI, and future modules.",
    title: "The planet in one living screen.",
    subtitle:
      "Communication, SOS safety, PantaAI, people, work, culture, services, and protected professional modules in one governed ecosystem.",
    water: "Water Network",
    interpreter: "Universal Interpreter",
    pantaAI: "PantaAI",
    sos: "SOS Center",
    discoveryTitle: "Real Pantavion modules",
    discoveryText:
      "Every button points to a real route or protected module. Broken public pages are not acceptable for official presentation.",
    waterTitle: "Protected Water Network",
    waterText:
      "Entry to the clean live module with access request, approval, and segmented pipe loading.",
    translateTitle: "Universal Interpreter",
    translateText:
      "Future universal interpreter for text, voice, travel, work, public services, and SOS support.",
    aiTitle: "PantaAI Center",
    aiText:
      "AI center for help, work, search, memory, execution, and guided workflows.",
    sosTitle: "SOS Center",
    sosText:
      "Safety, trusted contacts, elder mode, and clear boundaries without false authority dispatch claims.",
    languageNote:
      "The 250+ language list is shared across Pantavion. Full automatic translations will be connected through the Translation Kernel/provider.",
  },
};

const modules = [
  { key: "water", href: "/professional/infrastructure/water" },
  { key: "translate", href: "/translate" },
  { key: "ai", href: "/panta-ai" },
  { key: "sos", href: "/sos" },
] as const;

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
            <Link href="/professional/infrastructure/water" className="rounded-full border border-[#f6c85f]/60 bg-[#f6c85f]/15 px-6 py-4 text-center text-base font-black text-[#fff8e7]">
              {t.water}
            </Link>

            <Link href="/translate" className="rounded-full bg-[#f6c85f] px-6 py-4 text-center text-base font-black text-[#071020]">
              {t.interpreter}
            </Link>

            <Link href="/panta-ai" className="rounded-full border border-[#f6c85f]/45 bg-white/5 px-6 py-4 text-center text-base font-black text-[#fff8e7]">
              {t.pantaAI}
            </Link>

            <Link href="/sos" className="rounded-full bg-[#ff2f3f] px-6 py-4 text-center text-base font-black text-white">
              {t.sos}
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-[#f6c85f]">
              PUBLIC DISCOVERY
            </p>
            <h2 className="text-3xl font-black sm:text-5xl">{t.discoveryTitle}</h2>
            <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-200">
              {t.discoveryText}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((module) => {
              const title =
                module.key === "water"
                  ? t.waterTitle
                  : module.key === "translate"
                    ? t.translateTitle
                    : module.key === "ai"
                      ? t.aiTitle
                      : t.sosTitle;

              const text =
                module.key === "water"
                  ? t.waterText
                  : module.key === "translate"
                    ? t.translateText
                    : module.key === "ai"
                      ? t.aiText
                      : t.sosText;

              return (
                <Link key={module.href} href={module.href} className="rounded-3xl border border-[#f6c85f]/25 bg-[#071020]/80 p-5 text-[#fff8e7] no-underline shadow-xl">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#f6c85f]">
                    PANTAVION MODULE
                  </p>
                  <h3 className="text-2xl font-black">{title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-200">{text}</p>
                  <p className="mt-4 text-sm font-black text-[#f6c85f]">{module.href}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
