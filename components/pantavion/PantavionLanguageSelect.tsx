"use client";

import { useEffect, useState } from "react";
import {
  PANTAVION_LANGUAGE_STORAGE_KEY,
  isRtlLanguage,
  pantavionLanguages,
  resolvePantavionLanguage,
} from "@/core/i18n/pantavion-global-language";

const COOKIE_NAME = "pantavion-language";

function applyDocumentLanguage(value: string) {
  document.documentElement.lang = value;
  document.documentElement.dir = isRtlLanguage(value) ? "rtl" : "ltr";
  document.documentElement.dataset.pantavionLanguage = value;
}

function persistLanguage(value: string) {
  window.localStorage.setItem(PANTAVION_LANGUAGE_STORAGE_KEY, value);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function detectPantavionDeviceLanguage() {
  const candidates = Array.from(
    new Set([...(navigator.languages || []), navigator.language].filter(Boolean)),
  );

  for (const candidate of candidates) {
    const exact = pantavionLanguages.find(
      (item) => item.code.toLowerCase() === candidate.toLowerCase(),
    );
    if (exact) return exact.code;

    const base = candidate.toLowerCase().split("-")[0];
    const baseMatch = pantavionLanguages.find(
      (item) => item.code.toLowerCase().split("-")[0] === base,
    );
    if (baseMatch) return baseMatch.code;
  }

  return "en";
}

export function usePantavionLanguage(defaultLang = "el") {
  const [lang, setLangState] = useState(defaultLang);

  useEffect(() => {
    const saved = window.localStorage.getItem(PANTAVION_LANGUAGE_STORAGE_KEY);
    const next = saved || defaultLang;
    setLangState(next);
    applyDocumentLanguage(next);

    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (!custom.detail) return;
      setLangState(custom.detail);
      applyDocumentLanguage(custom.detail);
    };

    const storageHandler = (event: StorageEvent) => {
      if (event.key !== PANTAVION_LANGUAGE_STORAGE_KEY || !event.newValue) return;
      setLangState(event.newValue);
      applyDocumentLanguage(event.newValue);
    };

    window.addEventListener("pantavion-language-change", handler as EventListener);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("pantavion-language-change", handler as EventListener);
      window.removeEventListener("storage", storageHandler);
    };
  }, [defaultLang]);

  function setLang(value: string) {
    const resolved = resolvePantavionLanguage(value).code;
    setLangState(resolved);
    persistLanguage(resolved);
    applyDocumentLanguage(resolved);
    window.dispatchEvent(new CustomEvent("pantavion-language-change", { detail: resolved }));
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
  onSelected,
}: {
  className?: string;
  label?: string;
  onSelected?: () => void;
}) {
  const { lang, setLang } = usePantavionLanguage();

  return (
    <label className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {label ? <span>{label}</span> : null}
      <select
        value={lang}
        onChange={(event) => {
          setLang(event.target.value);
          onSelected?.();
        }}
        aria-label="Pantavion global language selector"
        style={{
          minWidth: 190,
          maxWidth: "100%",
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
