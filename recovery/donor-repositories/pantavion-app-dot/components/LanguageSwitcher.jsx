'use client';
import { useLang } from './LanguageProvider';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'el', label: 'Ελληνικά' },
  { code: 'es', label: 'Español' },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLang();
  return (
    <select
      className="px-3 py-2 rounded-xl bg-white/70 dark:bg-black/40 border border-white/30"
      value={locale}
      onChange={(e)=>setLocale(e.target.value)}
      aria-label="Language"
    >
      {languages.map(l => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
