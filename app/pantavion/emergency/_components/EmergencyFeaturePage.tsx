"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  emergencyLanguages,
  getEmergencyCopy,
  normalizeEmergencyLanguage,
  type EmergencyLanguage,
} from "@/core/emergency/lifeshield-emergency-i18n";

type EmergencyFeatureProps = {
  eyebrow: string;
  title: string;
  description: string;
  status: keyof ReturnType<typeof getEmergencyCopy>;
  truth: string;
};

export default function EmergencyFeaturePage({
  eyebrow,
  title,
  description,
  status,
  truth,
}: EmergencyFeatureProps) {
  const [language, setLanguage] = useState<EmergencyLanguage>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("pantavion-emergency-language");
    const detected = normalizeEmergencyLanguage(stored || window.navigator.language);
    setLanguage(detected);
  }, []);

  const copy = useMemo(() => getEmergencyCopy(language), [language]);

  function changeLanguage(value: EmergencyLanguage) {
    setLanguage(value);
    window.localStorage.setItem("pantavion-emergency-language", value);
  }

  const statusText = String(copy[status] ?? copy.futureRoadmap);

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl rounded-[2rem] border border-yellow-400/25 bg-gradient-to-br from-[#081229] via-[#07101f] to-black p-8 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            href="/pantavion/emergency"
            className="rounded-full border border-yellow-300/40 px-4 py-2 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-300/10"
          >
            ← {copy.back}
          </Link>

          <label className="flex items-center gap-3 text-sm text-slate-200">
            <span>{copy.language}</span>
            <select
              value={language}
              onChange={(event) => changeLanguage(event.target.value as EmergencyLanguage)}
              className="rounded-full border border-yellow-300/30 bg-black px-4 py-2 text-yellow-100"
            >
              {emergencyLanguages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
          {eyebrow}
        </p>

        <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
          {title}
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          {description}
        </p>

        <div className="mt-8 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-100">
            {copy.status}
          </p>
          <p className="mt-2 text-2xl font-bold text-yellow-100">{statusText}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-100">
            {copy.truthBoundary}
          </p>
          <p className="mt-3 leading-7 text-red-50">{truth}</p>
        </div>

        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 leading-7 text-slate-200">
          {copy.betaNotice}
        </p>
      </section>
    </main>
  );
}
