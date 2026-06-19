"use client";

import { useEffect, useMemo, useState } from "react";

type PantavionLanguageOption = {
  code: string;
  label: string;
  title: string;
  htmlLang: string;
  kind: "control" | "language";
};

const STORAGE_KEY = "pantavion.ui.language";

const PRIORITY_LABELS: Record<string, string> = {
  auto: "Auto detect",
  world: "World scope",
  en: "English",
  el: "Ελληνικά",
  es: "Español",
  fr: "Français",
  ar: "العربية",
  zh: "中文",
  hi: "हिन्दी",
  ru: "Русский",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
  tr: "Türkçe",
  sw: "Kiswahili",
  bn: "বাংলা",
  ur: "اردو",
  fa: "فارسی",
  uk: "Українська",
  he: "עברית",
  sq: "Shqip",
  ro: "Română",
  bg: "Български",
  sr: "Српски",
  ja: "日本語",
  ko: "한국어",
  vi: "Tiếng Việt",
  th: "ไทย",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  fil: "Filipino",
  ta: "தமிழ்",
  te: "తెలుగు",
  ml: "മലയാളം",
  mr: "मराठी",
  gu: "ગુજરાતી",
  pa: "ਪੰਜਾਬੀ",
  kn: "ಕನ್ನಡ",
  am: "አማርኛ",
  ha: "Hausa",
  yo: "Yorùbá",
  ig: "Igbo",
  zu: "isiZulu",
  xh: "isiXhosa",
  af: "Afrikaans",
  cy: "Cymraeg",
  ga: "Gaeilge",
  gd: "Gàidhlig",
};

const WORLD_LANGUAGE_CODES = Array.from(
  new Set(
    `
aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu
ace ach ada ady agq ain alt arn asa ast awa bal ban bas bem bez bho bik bin bla brx bug byn ceb cgg chk chr ckb cop crh dav doi dsb dua dyo ebu efi fil fon fur gaa gez gil gor haw hsb iba ibb kam kab kac kaj kcg kfo kha khq kok kpe ksb ksf ksh lag lah lkt lua luo luy mai mak mas mdf mer mfe mgh mgo mni moh mua mus naq nds nqo nus nyn pap pcm quc raj rof rom rup rwk sad sah saq sat sbp scn sco ses shi sid smn sms syr tem teo tig tiv tpi twq vai vun wal wae xog yav ybb yue zgh
en-US en-GB en-AU en-CA en-IN en-NZ en-ZA en-IE en-SG
es-ES es-MX es-AR es-CO es-CL es-PE es-VE es-US es-DO es-EC es-GT es-BO es-UY es-PY es-CR es-PA es-HN es-NI es-SV es-PR
fr-FR fr-CA fr-BE fr-CH fr-SN fr-CI fr-MA fr-DZ fr-TN fr-CM fr-HT
ar-SA ar-EG ar-MA ar-DZ ar-AE ar-IQ ar-JO ar-LB ar-SY ar-TN ar-YE ar-QA ar-KW ar-BH ar-OM ar-LY ar-SD
pt-BR pt-PT pt-AO pt-MZ pt-CV pt-GW
zh-CN zh-TW zh-HK zh-SG zh-Hans zh-Hant
de-DE de-AT de-CH de-LU
it-IT it-CH
nl-NL nl-BE
ru-RU ru-UA ru-KZ ru-BY
hi-IN bn-BD bn-IN ur-PK ur-IN fa-IR fa-AF ps-AF
sw-KE sw-TZ sw-UG sw-CD
tr-TR az-AZ kk-KZ uz-UZ ky-KG tg-TJ tk-TM
ms-MY ms-SG id-ID fil-PH tl-PH
ja-JP ko-KR vi-VN th-TH my-MM km-KH lo-LA ne-NP si-LK
ta-IN ta-LK ta-MY ta-SG te-IN kn-IN ml-IN mr-IN gu-IN pa-IN or-IN as-IN
he-IL el-GR
uk-UA pl-PL cs-CZ sk-SK hu-HU ro-RO bg-BG sr-RS hr-HR sl-SI bs-BA sq-AL mk-MK
no-NO nb-NO nn-NO sv-SE da-DK fi-FI is-IS et-EE lv-LV lt-LT
ga-IE cy-GB gd-GB mt-MT
zu-ZA xh-ZA af-ZA st-ZA tn-ZA nso-ZA
yo-NG ig-NG ha-NG ff-SN om-ET am-ET ti-ER ti-ET so-SO rw-RW rn-BI mg-MG sn-ZW
mi-NZ haw-US chr-US iu-CA kl-GL cr-CA oj-CA nv-US
mn-MN bo-CN bo-IN dz-BT dv-MV hy-AM ka-GE be-BY
eu-ES ca-ES gl-ES br-FR co-FR oc-FR lb-LU
`.trim().split(/\s+/)
  )
);

type DisplayNamesConstructor = new (
  locales?: string | string[],
  options?: { type: "language"; languageDisplay?: "standard" | "dialect" }
) => { of: (code: string) => string | undefined };

function displayLanguageName(code: string): string {
  if (PRIORITY_LABELS[code]) return PRIORITY_LABELS[code];

  try {
    const displayNamesConstructor = (
      Intl as unknown as { DisplayNames?: DisplayNamesConstructor }
    ).DisplayNames;

    if (displayNamesConstructor) {
      const displayNames = new displayNamesConstructor(["en"], {
        type: "language",
        languageDisplay: "standard",
      });

      return displayNames.of(code) || code.toUpperCase();
    }
  } catch {
    return code.toUpperCase();
  }

  return code.toUpperCase();
}

const LANGUAGE_OPTIONS: PantavionLanguageOption[] = [
  {
    code: "auto",
    label: "Auto detect",
    title: "Automatic language detection foundation",
    htmlLang: "en",
    kind: "control",
  },
  {
    code: "world",
    label: "World / 7,000+ scope",
    title: "All natural languages are Pantavion scope",
    htmlLang: "en",
    kind: "control",
  },
  ...WORLD_LANGUAGE_CODES.map((code) => ({
    code,
    label: displayLanguageName(code),
    title: `${displayLanguageName(code)} (${code})`,
    htmlLang: code,
    kind: "language" as const,
  })),
];

function isPantavionLanguageCode(value: string): boolean {
  return LANGUAGE_OPTIONS.some((option) => option.code === value);
}

export default function PantavionGlobalLanguageSelector() {
  const [language, setLanguage] = useState("auto");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isPantavionLanguageCode(stored)) setLanguage(stored);
    } catch {
      setLanguage("auto");
    }
  }, []);

  useEffect(() => {
    const selected =
      LANGUAGE_OPTIONS.find((option) => option.code === language) ||
      LANGUAGE_OPTIONS[0];

    try {
      window.localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = selected.htmlLang;
      document.documentElement.dataset.pantavionLanguage = language;
      document.documentElement.dataset.pantavionLanguageScope =
        language === "world" ? "all-natural-languages" : "selected";
      document.documentElement.dataset.pantavionLanguageCatalog =
        `${WORLD_LANGUAGE_CODES.length}+starter`;
    } catch {
      // Keep selector usable even when browser storage is blocked.
    }
  }, [language]);

  const selectedTitle = useMemo(() => {
    return LANGUAGE_OPTIONS.find((option) => option.code === language)?.title || "Automatic detection";
  }, [language]);

  return (
    <aside
      aria-label="Pantavion global world language layer"
      className="fixed right-3 top-3 z-[90] w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-[#f6c85f]/35 bg-[#06111f]/95 p-3 text-white shadow-2xl shadow-black/45 backdrop-blur-md"
    >
      <details>
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#f6c85f]">
                World Language Layer
              </p>
              <p className="text-xs font-bold text-slate-200">
                250+ starter language/locales now. 7,000+ natural languages in Pantavion scope.
              </p>
            </div>
            <span className="rounded-full border border-[#f6c85f]/45 px-3 py-1 text-xs font-black text-[#f6c85f]">
              🌍
            </span>
          </div>
        </summary>

        <div className="mt-3 space-y-3">
          <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-300">
            Language / Γλώσσα / World catalog
          </label>

          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="w-full rounded-xl border border-[#f6c85f]/45 bg-[#071020] px-3 py-3 text-sm font-black text-white outline-none"
            aria-label="Pantavion language"
            title={`Pantavion language: ${selectedTitle}`}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.kind === "control" ? option.label : `${option.label} — ${option.code}`}
              </option>
            ))}
          </select>

          <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
            <strong>{WORLD_LANGUAGE_CODES.length}+ starter language/locale choices are visible now.</strong>{" "}
            Pantavion scope remains all natural languages of the planet. Live translation requires provider,
            quality, consent, safety and legal gates before being shown as fully live.
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href="/sos/elder"
              className="rounded-full bg-red-500 px-4 py-2 text-center text-xs font-black text-white no-underline hover:bg-red-400"
            >
              SOS Live Translate
            </a>
            <a
              href="/translate"
              className="rounded-full border border-[#f6c85f]/45 px-4 py-2 text-center text-xs font-black text-[#f6c85f] no-underline hover:bg-[#f6c85f]/10"
            >
              Translate Center
            </a>
          </div>

          <p className="text-[0.68rem] leading-4 text-slate-400">
            Emergency translation is assistive and must not be presented as a guaranteed medical,
            legal or rescue replacement.
          </p>
        </div>
      </details>
    </aside>
  );
}
