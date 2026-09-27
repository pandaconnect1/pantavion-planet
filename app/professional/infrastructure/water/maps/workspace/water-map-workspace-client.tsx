"use client";

import { useEffect, useState } from "react";

type SourceId = "A" | "B" | "C" | "ENGINEERING";

const SOURCE_HREFS: Record<SourceId, string> = {
  A: "/professional/infrastructure/water/live",
  B: "/professional/infrastructure/water/b",
  C: "/professional/infrastructure/water/c",
  ENGINEERING: "/professional/infrastructure/water/engineering",
};

function requestedSource(): SourceId {
  const value = new URLSearchParams(window.location.search).get("source");

  if (value === "B_CANONICAL" || value === "B") return "B";
  if (value === "B_LEGACY" || value === "C_AUTHENTIC" || value === "C") return "C";
  if (value === "C_INTELLIGENCE" || value === "ENGINEERING") return "ENGINEERING";
  return "A";
}

export default function WaterMapWorkspaceClient() {
  const [target, setTarget] = useState(SOURCE_HREFS.A);

  useEffect(() => {
    const href = SOURCE_HREFS[requestedSource()];
    setTarget(href);
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
          A, B και C ανοίγουν ως ξεχωριστές πραγματικές map routes. Το Engineering
          workspace παραμένει ανεξάρτητο από τους τρεις αυθεντικούς χάρτες.
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
