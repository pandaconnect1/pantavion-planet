"use client";

import { useEffect, useState } from "react";

type SourceId = "A" | "B_CANONICAL" | "B_LEGACY" | "C_INTELLIGENCE";

const SOURCE_HREFS: Record<SourceId, string> = {
  A: "/professional/infrastructure/water/live",
  B_CANONICAL:
    "/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap",
  B_LEGACY:
    "/professional/infrastructure/water/master-b-mobile?sourceKey=legacy-george-85m",
  C_INTELLIGENCE: "/professional/infrastructure/water/c",
};

function requestedSource(): SourceId {
  const value = new URLSearchParams(window.location.search).get("source");
  return value && value in SOURCE_HREFS ? (value as SourceId) : "A";
}

export default function WaterMapWorkspaceClient() {
  const [target, setTarget] = useState(SOURCE_HREFS.A);

  useEffect(() => {
    const href = SOURCE_HREFS[requestedSource()];
    setTarget(href);

    // Do not embed Pantavion map pages in an iframe. Production security
    // deliberately protects pages against framing. Navigate to the real map
    // route so mobile browsers receive the map directly and security headers
    // remain fail-closed.
    window.location.replace(href);
  }, []);

  return (
    <div className="flex min-h-[70dvh] items-center justify-center rounded-3xl border border-[#d8b45f]/35 bg-[#020814] p-6 text-center text-white">
      <div className="max-w-md">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f2c766]">
          Pantavion Water
        </p>
        <h1 className="mt-3 text-xl font-black">Άνοιγμα πραγματικού χάρτη…</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Ο χάρτης ανοίγει απευθείας, χωρίς iframe, ώστε να λειτουργεί σωστά
          στο κινητό και να παραμένουν ενεργές οι προστασίες ασφαλείας.
        </p>
        <a
          href={target}
          className="mt-5 inline-block rounded-2xl bg-[#f2c766] px-5 py-3 text-sm font-black text-[#07101e]"
        >
          Άνοιγμα χάρτη
        </a>
      </div>
    </div>
  );
}
