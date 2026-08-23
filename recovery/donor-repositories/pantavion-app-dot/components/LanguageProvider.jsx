'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LangCtx = createContext({ t: (k)=>k, locale: 'en', setLocale: ()=>{} });

export function LanguageProvider({ initialLocale='en', children }) {
  const [locale, setLocale] = useState(initialLocale);
  const [dict, setDict] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/locales/${locale}/common.json`);
        const json = await res.json();
        setDict(json);
        // store user choice
        document.cookie = `locale=${locale}; path=/; max-age=31536000`;
      } catch (e) {
        console.error('i18n load error', e);
      }
    }
    load();
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key) => {
      const val = key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), dict);
      return val ?? key;
    }
  }), [dict, locale]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
