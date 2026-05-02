"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getEmergencyCapabilitiesByLayer,
  pantavionEmergencyDoctrine,
} from "@/core/emergency/lifeshield-emergency-system";
import {
  emergencyActionRoutes,
  emergencyLanguages,
  getEmergencyCopy,
  normalizeEmergencyLanguage,
  type EmergencyLanguage,
} from "@/core/emergency/lifeshield-emergency-i18n";

const reliabilityKey = {
  "available-now": "availableNow",
  "device-dependent": "deviceDependent",
  "hardware-required": "hardwareRequired",
  "institution-required": "institutionRequired",
  "future-roadmap": "futureRoadmap",
} as const;

export default function PantavionEmergencyPage() {
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

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12">
        <div className="rounded-[2rem] border border-yellow-400/30 bg-gradient-to-br from-[#081229] via-[#07101f] to-black p-8 shadow-2xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
              {copy.badge}
            </p>

            <label className="flex w-full items-center gap-3 text-sm text-slate-200 md:w-auto">
              <span>{copy.language}</span>
              <select
                value={language}
                onChange={(event) => changeLanguage(event.target.value as EmergencyLanguage)}
                className="w-full rounded-full border border-yellow-300/30 bg-black px-4 py-2 text-yellow-100 md:w-auto"
              >
                {emergencyLanguages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h1 className="mt-6 max-w-5xl text-4xl font-bold leading-tight md:text-6xl">
            {copy.title}
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-200">
            {copy.mission}
          </p>

          <div className="mt-8 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5 text-yellow-100">
            <p className="text-sm font-semibold uppercase tracking-[0.25em]">
              {copy.doctrineLabel}
            </p>
            <p className="mt-3 text-2xl font-semibold">{copy.doctrine}</p>
          </div>

          <div className="mt-8">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-yellow-200">
              {copy.realActions}
            </p>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {emergencyActionRoutes.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="rounded-2xl border border-yellow-300/25 bg-black/30 px-5 py-4 font-semibold text-yellow-100 transition hover:border-yellow-200 hover:bg-yellow-300/10"
                >
                  {String(copy[action.labelKey as keyof typeof copy])} →
                </Link>
              ))}
            </div>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {pantavionEmergencyDoctrine.layers.map((layer) => {
            const capabilities = getEmergencyCapabilitiesByLayer(layer.id);
            const reliabilityLabel = String(copy[reliabilityKey[layer.reliability]]);

            return (
              <article
                key={layer.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-2xl font-bold text-yellow-200">
                    {layer.name}
                  </h2>
                  <span className="rounded-full border border-yellow-300/30 px-3 py-1 text-xs font-semibold text-yellow-200">
                    {reliabilityLabel}
                  </span>
                </div>

                <p className="mt-4 leading-7 text-slate-200">{layer.purpose}</p>

                <div className="mt-5 grid gap-3 text-sm text-slate-300">
                  <p>
                    <span className="font-semibold text-white">
                      {copy.normalPhone}:
                    </span>{" "}
                    {layer.availableWithNormalPhone ? copy.yes : copy.no}
                  </p>
                  <p>
                    <span className="font-semibold text-white">
                      {copy.specialHardware}:
                    </span>{" "}
                    {layer.requiresSpecialHardware ? copy.required : copy.notRequired}
                  </p>
                  <p>
                    <span className="font-semibold text-white">
                      {copy.institutionalAgreement}:
                    </span>{" "}
                    {layer.requiresInstitutionalAgreement ? copy.required : copy.notRequired}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {layer.channels.map((channel) => (
                    <span
                      key={channel}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200"
                    >
                      {channel}
                    </span>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 p-4">
                  <p className="text-sm font-semibold text-red-100">
                    {copy.truthBoundary}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-red-50">
                    {layer.truthBoundary}
                  </p>
                </div>

                {capabilities.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-200">
                      {copy.capabilities}
                    </p>
                    <div className="mt-3 space-y-3">
                      {capabilities.map((capability) => (
                        <div
                          key={capability.id}
                          className="rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                          <h3 className="font-semibold text-white">
                            {capability.name}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {capability.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-red-300/20 bg-red-500/10 p-6">
          <h2 className="text-2xl font-bold text-red-100">
            {copy.forbiddenTitle}
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-red-50">
            {copy.forbiddenIntro}
          </p>

          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {pantavionEmergencyDoctrine.forbiddenClaims.map((claim) => (
              <li
                key={claim}
                className="rounded-2xl border border-red-200/20 bg-black/20 p-4 text-sm leading-6 text-red-50"
              >
                {claim}
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
