"use client";

import { useEffect, useMemo, useState } from "react";

import { pantavionWaterApprovedDeviceHeaders } from "@/core/water/water-approved-device-client";

type SourceKey = "canonical-2026-andreaspap" | "legacy-george-85m";

type Manifest = {
  ok?: boolean;
  mapId?: string;
  sourceKey?: SourceKey;
  sourceFileName?: string;
  sourceSha256?: string;
  geographicAlignmentVerified?: boolean;
  matchedNetworkSegments?: number;
  pointCount?: number;
  labelCount?: number;
  writtenTileCount?: number;
  layers?: string[];
  topLayers?: Array<{ layer: string; count: number }>;
  error?: string;
  message?: string;
};

type State = {
  loading: boolean;
  error: string;
  b: Manifest | null;
  c: Manifest | null;
};

function number(value: number | undefined) {
  return new Intl.NumberFormat("el-GR").format(Number(value || 0));
}

async function fetchManifest(sourceKey: SourceKey) {
  const response = await fetch(
    `/api/professional/infrastructure/water/master-b/derived/manifest?sourceKey=${encodeURIComponent(sourceKey)}`,
    {
      cache: "no-store",
      credentials: "include",
      headers: pantavionWaterApprovedDeviceHeaders(),
    },
  );

  const payload = (await response.json()) as Manifest;
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || payload.message || "derived_manifest_unavailable");
  }
  return payload;
}

export default function WaterMapBCompareClient() {
  const [state, setState] = useState<State>({
    loading: true,
    error: "",
    b: null,
    c: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ loading: true, error: "", b: null, c: null });

      const results = await Promise.allSettled([
        fetchManifest("canonical-2026-andreaspap"),
        fetchManifest("legacy-george-85m"),
      ]);

      if (cancelled) return;

      const b = results[0].status === "fulfilled" ? results[0].value : null;
      const c = results[1].status === "fulfilled" ? results[1].value : null;
      const errors = results
        .filter((result) => result.status === "rejected")
        .map((result) =>
          result.status === "rejected" && result.reason instanceof Error
            ? result.reason.message
            : "manifest_unavailable",
        );

      setState({
        loading: false,
        error: errors.join(" · "),
        b,
        c,
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const overlap = useMemo(() => {
    const bLayers = new Set(state.b?.layers || []);
    const cLayers = new Set(state.c?.layers || []);
    return [...bLayers].filter((layer) => cLayers.has(layer)).sort();
  }, [state.b?.layers, state.c?.layers]);

  const onlyB = useMemo(() => {
    const cLayers = new Set(state.c?.layers || []);
    return (state.b?.layers || []).filter((layer) => !cLayers.has(layer)).sort();
  }, [state.b?.layers, state.c?.layers]);

  const onlyC = useMemo(() => {
    const bLayers = new Set(state.b?.layers || []);
    return (state.c?.layers || []).filter((layer) => !bLayers.has(layer)).sort();
  }, [state.b?.layers, state.c?.layers]);

  const cards = [
    {
      id: "B",
      title: "Map B — ANDREASPAP 2026",
      manifest: state.b,
      href: "/professional/infrastructure/water/b",
    },
    {
      id: "C",
      title: "Map C — GEORGE 85 MB",
      manifest: state.c,
      href: "/professional/infrastructure/water/c",
    },
  ] as const;

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-[#f2c766]/30 bg-[#0b1728] p-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f2c766]">
          Authentic source compare
        </p>
        <h1 className="mt-2 text-3xl font-black">Map B ↔ Map C</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          Συγκρίνει τα protected derived manifests των δύο αυθεντικών DWG.
          Δεν φορτώνει raw master και δεν χρησιμοποιεί iframe. Γεωγραφική
          σύγκριση θέσης γίνεται μόνο όταν υπάρχει verified alignment.
        </p>
      </section>

      {state.loading ? (
        <div className="rounded-2xl border border-cyan-400/25 bg-cyan-950/20 p-4 text-sm font-black text-cyan-100">
          Φόρτωση manifests B / C…
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-950/20 p-4 text-sm font-bold text-amber-100">
          {state.error}. Αν ένα source δεν έχει ακόμη derived manifest, θα εμφανιστεί
          μόλις ολοκληρωθεί το production ingest/generation.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.id}
            className="rounded-3xl border border-white/10 bg-black/20 p-5"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f2c766]">
              Map {card.id}
            </p>
            <h2 className="mt-2 text-2xl font-black">{card.title}</h2>

            {card.manifest ? (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 p-3">
                  <span className="block text-slate-400">Segments</span>
                  <strong>{number(card.manifest.matchedNetworkSegments)}</strong>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <span className="block text-slate-400">Tiles</span>
                  <strong>{number(card.manifest.writtenTileCount)}</strong>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <span className="block text-slate-400">Points</span>
                  <strong>{number(card.manifest.pointCount)}</strong>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <span className="block text-slate-400">Labels</span>
                  <strong>{number(card.manifest.labelCount)}</strong>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Derived manifest δεν υπάρχει ακόμη.
              </p>
            )}

            <p className="mt-4 text-xs font-bold text-slate-400">
              Alignment: {card.manifest?.geographicAlignmentVerified ? "VERIFIED" : "PENDING"}
            </p>

            <a
              href={card.href}
              className="mt-4 inline-block rounded-xl bg-[#f2c766] px-4 py-3 text-sm font-black text-black"
            >
              Άνοιγμα Map {card.id}
            </a>
          </article>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/20 p-4">
          <h3 className="font-black text-emerald-200">Κοινά layers</h3>
          <p className="mt-2 text-xs leading-6 text-slate-300">
            {overlap.length ? overlap.slice(0, 40).join(" · ") : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#f2c766]/20 bg-[#f2c766]/5 p-4">
          <h3 className="font-black text-[#f2c766]">Μόνο στο B</h3>
          <p className="mt-2 text-xs leading-6 text-slate-300">
            {onlyB.length ? onlyB.slice(0, 40).join(" · ") : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-4">
          <h3 className="font-black text-cyan-200">Μόνο στο C</h3>
          <p className="mt-2 text-xs leading-6 text-slate-300">
            {onlyC.length ? onlyC.slice(0, 40).join(" · ") : "—"}
          </p>
        </div>
      </section>
    </div>
  );
}
