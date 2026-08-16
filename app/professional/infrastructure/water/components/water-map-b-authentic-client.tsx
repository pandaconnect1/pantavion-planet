"use client";

import { useEffect, useState } from "react";

import { assessWaterMapBPosition } from "@/core/water/water-map-b-position-truth";

type PositionState = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  measuredAt: string;
  quality: "high" | "medium" | "low" | "unusable";
  warning: string | null;
} | null;

export default function WaterMapBAuthenticClient() {
  const [position, setPosition] = useState<PositionState>(null);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState(
    "Ο Map B επιτρέπεται να εμφανίζει μόνο το αυθεντικό DWG. Κανένας road/base map δεν χρησιμοποιείται ως υποκατάστατο.",
  );

  function locateMe() {
    if (!navigator.geolocation) {
      setMessage("Η συσκευή/browser δεν παρέχει GPS/GNSS θέση.");
      return;
    }

    setLocating(true);
    setMessage("Εντοπισμός πραγματικής θέσης…");

    navigator.geolocation.getCurrentPosition(
      (geo) => {
        const measuredAt = new Date(geo.timestamp || Date.now()).toISOString();
        const assessment = assessWaterMapBPosition({
          latitude: geo.coords.latitude,
          longitude: geo.coords.longitude,
          accuracyMeters: geo.coords.accuracy,
          measuredAt,
          source: "device-geolocation",
          alignmentVerified: false,
        });

        setPosition({
          latitude: geo.coords.latitude,
          longitude: geo.coords.longitude,
          accuracyMeters: geo.coords.accuracy,
          measuredAt,
          quality: assessment.quality,
          warning: assessment.warning,
        });
        setMessage(
          `Η θέση βρέθηκε με ακρίβεια ±${Math.round(geo.coords.accuracy)} m. Το marker θα μπει πάνω στο αυθεντικό DWG μόνο μετά την πραγματική γεωαναφορά του — όχι πάνω σε υποκατάστατο χάρτη.`,
        );
        setLocating(false);
      },
      () => {
        setMessage("Δεν δόθηκε θέση. Έλεγξε την άδεια τοποθεσίας της συσκευής/browser.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }

  useEffect(() => {
    // Deliberately no Leaflet/OSM initialization here.
    // Map B must not display a substitute road map while the authentic DWG viewer is unavailable.
  }, []);

  return (
    <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#f6c85f]/30 bg-[#071425] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
        <header className="border-b border-white/10 px-5 py-5 sm:px-7">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f6c85f]">Pantavion Protected Water</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Map B — Authentic Master DWG (Unchanged)</h1>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-300">
            Το Map B δεν επιτρέπεται να αντικαταστήσει τον αυθεντικό DWG με road map, redraw, screenshot,
            PDF approximation ή AI reconstruction. Το original παραμένει 100% αυτούσιο.
          </p>
        </header>

        <section className="grid gap-4 p-5 sm:p-7 lg:grid-cols-[1fr_320px]">
          <div className="flex min-h-[58vh] items-center justify-center rounded-[1.5rem] border border-dashed border-[#f6c85f]/35 bg-black/70 p-6 text-center">
            <div className="max-w-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#f6c85f]/40 bg-[#f6c85f]/10 text-3xl">DWG</div>
              <h2 className="mt-5 text-2xl font-black text-[#f6c85f]">Original DWG only</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
                Ο προηγούμενος substitute road/base map αφαιρέθηκε. Η περιοχή αυτή θα εμφανίσει μόνο το
                πραγματικό master DWG όταν συνδεθεί ο protected binary viewer/source. Δεν εμφανίζεται ψεύτικο
                δίκτυο στο ενδιάμεσο.
              </p>
            </div>
          </div>

          <aside className="space-y-4">
            <button
              type="button"
              onClick={locateMe}
              disabled={locating}
              className="w-full rounded-2xl border border-blue-400/40 bg-blue-500/15 px-5 py-4 text-left font-black text-blue-100 disabled:opacity-60"
            >
              📍 {locating ? "Εντοπισμός…" : "Η θέση μου"}
            </button>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <h3 className="font-black text-[#f6c85f]">GPS/GNSS</h3>
              {position ? (
                <dl className="mt-3 space-y-2 text-sm font-semibold text-slate-200">
                  <div><dt className="inline text-slate-400">Latitude: </dt><dd className="inline">{position.latitude.toFixed(7)}</dd></div>
                  <div><dt className="inline text-slate-400">Longitude: </dt><dd className="inline">{position.longitude.toFixed(7)}</dd></div>
                  <div><dt className="inline text-slate-400">Ακρίβεια: </dt><dd className="inline">±{Math.round(position.accuracyMeters)} m</dd></div>
                  <div><dt className="inline text-slate-400">Quality: </dt><dd className="inline">{position.quality}</dd></div>
                </dl>
              ) : (
                <p className="mt-3 text-sm font-semibold text-slate-400">Δεν έχει ληφθεί ακόμη θέση.</p>
              )}
            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-950/20 p-4 text-sm font-semibold leading-6 text-amber-100">
              {message}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
