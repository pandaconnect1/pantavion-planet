"use client";

import { useState } from "react";

type CompareMode = "side-by-side" | "toggle";

const canonicalUrl =
  "/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap";
const legacyUrl =
  "/professional/infrastructure/water/master-b-mobile?sourceKey=legacy-george-85m";

export default function WaterMapBCompareClient() {
  const [mode, setMode] = useState<CompareMode>("side-by-side");
  const [active, setActive] = useState<"canonical" | "legacy">("canonical");

  return (
    <div className="grid gap-4">
      <section className="rounded-3xl border border-[#f2c766]/30 bg-[#0b1728] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f2c766]">
              Map B version compare
            </p>
            <h1 className="mt-2 text-3xl font-black">
              Canonical ↔ Legacy
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("side-by-side")}
              className={`rounded-xl px-3 py-2 text-xs font-black ${
                mode === "side-by-side"
                  ? "bg-[#f2c766] text-black"
                  : "border border-white/20 text-white"
              }`}
            >
              Δίπλα-δίπλα
            </button>
            <button
              type="button"
              onClick={() => setMode("toggle")}
              className={`rounded-xl px-3 py-2 text-xs font-black ${
                mode === "toggle"
                  ? "bg-[#f2c766] text-black"
                  : "border border-white/20 text-white"
              }`}
            >
              Εναλλαγή
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-300">
          Η σύγκριση είναι source-CAD σύγκριση. Τα δύο viewers δεν
          συγχρονίζονται γεωγραφικά μέχρι να υπάρχει approved alignment
          evidence για το αντίστοιχο source.
        </p>

        {mode === "toggle" ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActive("canonical")}
              className={`rounded-xl px-3 py-2 text-xs font-black ${
                active === "canonical"
                  ? "bg-emerald-300 text-black"
                  : "border border-white/20"
              }`}
            >
              Canonical
            </button>
            <button
              type="button"
              onClick={() => setActive("legacy")}
              className={`rounded-xl px-3 py-2 text-xs font-black ${
                active === "legacy"
                  ? "bg-amber-300 text-black"
                  : "border border-white/20"
              }`}
            >
              Legacy
            </button>
          </div>
        ) : null}
      </section>

      {mode === "side-by-side" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="overflow-hidden rounded-3xl border border-emerald-400/25 bg-black">
            <div className="border-b border-white/10 px-4 py-3 text-sm font-black text-emerald-200">
              Map B Canonical — ANDREASPAP 2026
            </div>
            <iframe
              title="Map B Canonical"
              src={canonicalUrl}
              className="h-[75vh] w-full border-0"
            />
          </section>

          <section className="overflow-hidden rounded-3xl border border-amber-400/25 bg-black">
            <div className="border-b border-white/10 px-4 py-3 text-sm font-black text-amber-200">
              Map B Legacy — GEORGE 85 MB
            </div>
            <iframe
              title="Map B Legacy"
              src={legacyUrl}
              className="h-[75vh] w-full border-0"
            />
          </section>
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/15 bg-black">
          <iframe
            title={
              active === "canonical"
                ? "Map B Canonical"
                : "Map B Legacy"
            }
            src={active === "canonical" ? canonicalUrl : legacyUrl}
            className="h-[78vh] w-full border-0"
          />
        </section>
      )}
    </div>
  );
}
