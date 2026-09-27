"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SourceId =
  | "A"
  | "B_CANONICAL"
  | "B_LEGACY"
  | "C_INTELLIGENCE";

type SourceOption = {
  id: SourceId;
  label: string;
  shortLabel: string;
  description: string;
  href: string;
  kind: "operational" | "derived-dwg" | "intelligence";
};

const SOURCES: readonly SourceOption[] = [
  {
    id: "A",
    label: "Map A — Live Operational",
    shortLabel: "A",
    description: "Live operational network + approved field overlays.",
    href: "/professional/infrastructure/water/live",
    kind: "operational",
  },
  {
    id: "B_CANONICAL",
    label: "Map B — Canonical DWG",
    shortLabel: "B Canonical",
    description: "Canonical ANDREASPAP 2026 derived DWG.",
    href: "/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap",
    kind: "derived-dwg",
  },
  {
    id: "B_LEGACY",
    label: "Map B — Legacy DWG",
    shortLabel: "B Legacy",
    description: "Legacy GEORGE 85 MB derived DWG.",
    href: "/professional/infrastructure/water/master-b-mobile?sourceKey=legacy-george-85m",
    kind: "derived-dwg",
  },
  {
    id: "C_INTELLIGENCE",
    label: "C — Engineering Intelligence",
    shortLabel: "C",
    description: "Engineering/intelligence view over approved water data.",
    href: "/professional/infrastructure/water/c",
    kind: "intelligence",
  },
] as const;

function sourceFromLocation(): SourceId {
  if (typeof window === "undefined") return "A";
  const value = new URLSearchParams(window.location.search).get("source");
  return SOURCES.some((source) => source.id === value)
    ? (value as SourceId)
    : "A";
}

export default function WaterMapWorkspaceClient() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sourceId, setSourceId] = useState<SourceId>("A");
  const [fullscreen, setFullscreen] = useState(false);
  const [cssFullscreen, setCssFullscreen] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(true);

  useEffect(() => {
    setSourceId(sourceFromLocation());

    const handleFullscreen = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      if (document.fullscreenElement) setCssFullscreen(false);
    };

    document.addEventListener("fullscreenchange", handleFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("source", sourceId);
    window.history.replaceState(null, "", url);
  }, [sourceId]);

  useEffect(() => {
    if (!cssFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [cssFullscreen]);

  const active = useMemo(
    () => SOURCES.find((source) => source.id === sourceId) ?? SOURCES[0],
    [sourceId],
  );

  async function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (container.requestFullscreen) {
        await container.requestFullscreen();
        return;
      }
    } catch {
      // Fall through to the CSS fullscreen mode for browsers that restrict
      // the native Fullscreen API.
    }

    setCssFullscreen((value) => !value);
  }

  const full = fullscreen || cssFullscreen;

  return (
    <div
      ref={containerRef}
      className={
        cssFullscreen
          ? "fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-[#020814] text-white"
          : "flex min-h-[calc(100dvh-16px)] flex-col overflow-hidden rounded-3xl border border-[#d8b45f]/35 bg-[#020814] text-white shadow-2xl"
      }
    >
      <header
        className={
          full
            ? "relative z-20 border-b border-white/10 bg-[#06101f]/95 p-2 backdrop-blur"
            : "relative z-20 border-b border-white/10 bg-[#06101f]/95 p-3 backdrop-blur"
        }
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setToolbarOpen((value) => !value)}
            className="rounded-xl border border-[#d8b45f]/40 bg-[#d8b45f]/10 px-3 py-2 text-xs font-black text-[#f3db9d]"
            aria-expanded={toolbarOpen}
          >
            ☰ Χάρτες
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-black text-[#f2c766]">
              {active.label}
            </p>
            {!full ? (
              <p className="truncate text-[10px] font-semibold text-slate-400">
                {active.description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="rounded-xl border border-cyan-400/40 bg-cyan-950/40 px-3 py-2 text-xs font-black text-cyan-100"
          >
            {full ? "⤢ Έξοδος" : "⛶ Πλήρης οθόνη"}
          </button>
        </div>

        {toolbarOpen ? (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {SOURCES.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => {
                  setSourceId(source.id);
                  if (window.matchMedia("(max-width: 767px)").matches) {
                    setToolbarOpen(false);
                  }
                }}
                className={
                  source.id === sourceId
                    ? "shrink-0 rounded-xl bg-[#f2c766] px-3 py-2 text-xs font-black text-black"
                    : "shrink-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-black text-white"
                }
              >
                {source.shortLabel}
              </button>
            ))}
          </div>
        ) : null}

        {toolbarOpen ? (
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold text-slate-300">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-950/30 px-2 py-1">
              Approved changes / evidence
            </span>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-950/30 px-2 py-1">
              Οδοί / reference layers
            </span>
            <span className="rounded-full border border-violet-400/30 bg-violet-950/30 px-2 py-1">
              Μελλοντικά D / E / F από registry
            </span>
          </div>
        ) : null}
      </header>

      <div className="relative min-h-0 flex-1 bg-black">
        <iframe
          key={active.href}
          title={active.label}
          src={active.href}
          className="absolute inset-0 h-full w-full border-0 bg-black"
          allow="geolocation; fullscreen"
        />
      </div>

      {!full ? (
        <footer className="border-t border-white/10 bg-[#06101f] px-3 py-2 text-[10px] font-semibold leading-5 text-slate-400">
          Στο κινητό εμφανίζεται ένας source map τη φορά. Τα overlays ανήκουν
          στον ίδιο Pantavion workspace και δεν απαιτούν δεύτερη εφαρμογή.
        </footer>
      ) : null}
    </div>
  );
}
