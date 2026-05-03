
"use client";

import { useEffect, useState } from "react";
import {
  PANTAVION_LANGUAGE_STORAGE_KEY,
  isRtlLanguage,
  pantavionLanguages,
  resolvePantavionLanguage,
} from "@/core/i18n/pantavion-global-language";

export function usePantavionLanguage(defaultLang = "el") {
  const [lang, setLangState] = useState(defaultLang);

  useEffect(() => {
    const saved = window.localStorage.getItem(PANTAVION_LANGUAGE_STORAGE_KEY);
    const next = saved || defaultLang;
    setLangState(next);
    document.documentElement.lang = next;
    document.documentElement.dir = isRtlLanguage(next) ? "rtl" : "ltr";

    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (!custom.detail) return;
      setLangState(custom.detail);
      document.documentElement.lang = custom.detail;
      document.documentElement.dir = isRtlLanguage(custom.detail) ? "rtl" : "ltr";
    };

    window.addEventListener("pantavion-language-change", handler as EventListener);
    return () => window.removeEventListener("pantavion-language-change", handler as EventListener);
  }, [defaultLang]);

  function setLang(value: string) {
    setLangState(value);
    window.localStorage.setItem(PANTAVION_LANGUAGE_STORAGE_KEY, value);
    document.documentElement.lang = value;
    document.documentElement.dir = isRtlLanguage(value) ? "rtl" : "ltr";
    window.dispatchEvent(new CustomEvent("pantavion-language-change", { detail: value }));
  }

  return {
    lang,
    setLang,
    language: resolvePantavionLanguage(lang),
  };
}

export function PantavionLanguageSelect({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const { lang, setLang } = usePantavionLanguage();

  return (
    <label className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {label ? <span>{label}</span> : null}
      <select
        value={lang}
        onChange={(event) => setLang(event.target.value)}
        aria-label="Pantavion global language selector"
        style={{
          minWidth: 190,
          borderRadius: 999,
          border: "1px solid rgba(243, 196, 84, .55)",
          background: "#050914",
          color: "#fff7d6",
          padding: "10px 14px",
          fontWeight: 800,
        }}
      >
        {pantavionLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
