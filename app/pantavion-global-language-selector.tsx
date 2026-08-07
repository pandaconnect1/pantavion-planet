"use client";

import { useEffect, useState } from "react";

type PantavionLanguageOption = {
  code: "auto" | "el" | "en";
  label: string;
  htmlLang: string;
};

const STORAGE_KEY = "pantavion.ui.language";

const LANGUAGE_OPTIONS: PantavionLanguageOption[] = [
  { code: "auto", label: "Αυτόματα / Auto", htmlLang: "en" },
  { code: "el", label: "Ελληνικά", htmlLang: "el" },
  { code: "en", label: "English", htmlLang: "en" },
];

function isKnownLanguage(value: string): value is PantavionLanguageOption["code"] {
  return LANGUAGE_OPTIONS.some((option) => option.code === value);
}

export default function PantavionGlobalLanguageSelector() {
  const [language, setLanguage] = useState<PantavionLanguageOption["code"]>("auto");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isKnownLanguage(stored)) setLanguage(stored);
    } catch {
      setLanguage("auto");
    }
  }, []);

  useEffect(() => {
    const selected = LANGUAGE_OPTIONS.find((option) => option.code === language) || LANGUAGE_OPTIONS[0];

    try {
      window.localStorage.setItem(STORAGE_KEY, language);
      window.dispatchEvent(
        new CustomEvent("pantavion:language-change", {
          detail: {
            language,
            htmlLang: selected.htmlLang,
            label: selected.label,
          },
        }),
      );
      document.documentElement.lang = selected.htmlLang;
      document.documentElement.dataset.pantavionLanguage = language;
    } catch {
      // The selector remains usable even if browser storage is unavailable.
    }
  }, [language]);

  return (
    <aside
      aria-label="Pantavion language"
      className="fixed right-3 top-3 z-[90]"
    >
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[#f6c85f]/35 bg-[#06111f]/95 px-3 py-2 text-xs font-black text-[#f6c85f] shadow-lg backdrop-blur-md">
          <span aria-hidden="true">🌐</span>
          <span>Γλώσσα</span>
        </summary>

        <div className="mt-2 w-56 rounded-2xl border border-[#f6c85f]/30 bg-[#06111f]/98 p-3 shadow-2xl">
          <label className="block text-xs font-bold text-slate-300" htmlFor="pantavion-ui-language">
            Γλώσσα περιβάλλοντος
          </label>
          <select
            id="pantavion-ui-language"
            value={language}
            onChange={(event) => {
              const value = event.target.value;
              if (isKnownLanguage(value)) setLanguage(value);
            }}
            className="mt-2 w-full rounded-xl border border-[#f6c85f]/35 bg-[#071020] px-3 py-2 text-sm font-bold text-white outline-none"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>

          <a
            href="/translate"
            className="mt-3 block rounded-full border border-[#f6c85f]/40 px-3 py-2 text-center text-xs font-black text-[#f6c85f] no-underline"
          >
            Αμφίδρομη μετάφραση ↔
          </a>
        </div>
      </details>
    </aside>
  );
}
