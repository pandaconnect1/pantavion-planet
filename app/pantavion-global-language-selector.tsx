"use client";

import { useEffect, useState } from "react";
import {
  PantavionLanguageSelect,
  detectPantavionDeviceLanguage,
  usePantavionLanguage,
} from "@/components/pantavion/PantavionLanguageSelect";
import { PANTAVION_LANGUAGE_STORAGE_KEY } from "@/core/i18n/pantavion-global-language";

const AUTO_KEY = "pantavion-language-auto";

export default function PantavionGlobalLanguageSelector() {
  const [open, setOpen] = useState(false);
  const [automatic, setAutomatic] = useState(false);
  const { lang, setLang, language } = usePantavionLanguage();

  useEffect(() => {
    const saved = window.localStorage.getItem(PANTAVION_LANGUAGE_STORAGE_KEY);
    const autoSaved = window.localStorage.getItem(AUTO_KEY) === "1";
    setAutomatic(autoSaved || !saved);

    if (!saved || autoSaved) {
      const detected = detectPantavionDeviceLanguage();
      if (detected !== lang) setLang(detected);
    }
  }, []); // intentionally initialize once from the device/browser preference

  function setAutomaticMode(enabled: boolean) {
    setAutomatic(enabled);
    window.localStorage.setItem(AUTO_KEY, enabled ? "1" : "0");
    if (enabled) {
      setLang(detectPantavionDeviceLanguage());
      setOpen(false);
    }
  }

  return (
    <aside aria-label="Pantavion language" className="fixed bottom-4 right-4 z-[90]" data-pantavion-no-translate>
      {open ? (
        <div className="mb-2 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-[#f6c85f]/30 bg-[#06111f]/98 p-4 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-xs font-black uppercase tracking-[0.16em] text-[#f6c85f]">Γλώσσα / Language</p>
              <p className="mt-1 text-xs text-slate-400">Η επιλογή ισχύει σε όλο το Pantavion.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/15 px-3 py-1 text-sm text-white" aria-label="Κλείσιμο">×</button>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <input
              type="checkbox"
              checked={automatic}
              onChange={(event) => setAutomaticMode(event.target.checked)}
            />
            Αυτόματα από τη συσκευή
          </label>

          <div className="mt-4">
            <PantavionLanguageSelect
              label={automatic ? undefined : "Χειροκίνητα"}
              onSelected={() => {
                window.localStorage.setItem(AUTO_KEY, "0");
                setAutomatic(false);
                setOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-12 items-center gap-2 rounded-full border border-[#f6c85f]/35 bg-[#06111f]/95 px-3 text-sm font-black text-[#f6c85f] shadow-lg backdrop-blur-md transition hover:border-[#f6c85f]/70"
        title="Γλώσσα / Language"
        aria-expanded={open}
        aria-label="Επιλογή γλώσσας"
      >
        <span aria-hidden="true">🌐</span>
        <span className="max-w-24 truncate">{language.label}</span>
      </button>
    </aside>
  );
}
