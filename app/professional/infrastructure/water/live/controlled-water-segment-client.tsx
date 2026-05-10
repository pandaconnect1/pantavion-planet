"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

type Lang = "el" | "en";

type SegmentResponse = {
  segment?: {
    type: "FeatureCollection";
    features: any[];
  };
  segmentCount?: number;
  pipeSegmentCount?: number;
  completeNetworkReturned?: boolean;
  rawMasterReturned?: boolean;
  browserFullNetworkLoaded?: boolean;
  error?: string;
  reason?: string;
};

const UI = {
  el: {
    title: "\u0394\u03af\u03ba\u03c4\u03c5\u03bf \u038e\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2 Pantavion",
    subtitle:
      "\u0391\u03bb\u03b7\u03b8\u03b9\u03bd\u03cc \u03b4\u03af\u03ba\u03c4\u03c5\u03bf \u03b1\u03b3\u03c9\u03b3\u03ce\u03bd \u03b1\u03c0\u03cc \u03c4\u03bf \u03b1\u03c5\u03b8\u03b5\u03bd\u03c4\u03b9\u03ba\u03cc KMZ. \u0394\u03b5\u03bd \u03b1\u03bb\u03bb\u03ac\u03b6\u03bf\u03c5\u03bc\u03b5 \u03c7\u03c1\u03ce\u03bc\u03b1\u03c4\u03b1, \u03b3\u03c1\u03b1\u03bc\u03bc\u03ad\u03c2 \u03ae \u03b1\u03b3\u03c9\u03b3\u03bf\u03cd\u03c2. \u039f browser \u03c6\u03bf\u03c1\u03c4\u03ce\u03bd\u03b5\u03b9 \u03bc\u03cc\u03bd\u03bf \u03c4\u03bf \u03b5\u03bb\u03b5\u03b3\u03c7\u03cc\u03bc\u03b5\u03bd\u03bf \u03c4\u03bc\u03ae\u03bc\u03b1.",
    language: "\u0393\u03bb\u03ce\u03c3\u03c3\u03b1",
    street: "\u039f\u03b4\u03cc\u03c2",
    number: "\u0391\u03c1\u03b9\u03b8\u03bc\u03cc\u03c2",
    area: "\u03a0\u03b5\u03c1\u03b9\u03bf\u03c7\u03ae",
    postal: "\u03a4\u03b1\u03c7\u03c5\u03b4\u03c1\u03bf\u03bc\u03b9\u03ba\u03cc\u03c2",
    load: "\u03a6\u03cc\u03c1\u03c4\u03c9\u03c3\u03b5 \u03b1\u03b3\u03c9\u03b3\u03bf\u03cd\u03c2 \u03c3\u03c4\u03b7\u03bd \u03c0\u03b5\u03c1\u03b9\u03bf\u03c7\u03ae \u03c4\u03bf\u03c5 \u03c7\u03ac\u03c1\u03c4\u03b7",
    loading: "\u03a6\u03cc\u03c1\u03c4\u03c9\u03c3\u03b7...",
    ready: "\u039f \u03c7\u03ac\u03c1\u03c4\u03b7\u03c2 \u03b5\u03af\u03bd\u03b1\u03b9 \u03ad\u03c4\u03bf\u03b9\u03bc\u03bf\u03c2. \u039c\u03b5\u03c4\u03b1\u03ba\u03af\u03bd\u03b7\u03c3\u03b5 \u03ae \u03ba\u03ac\u03bd\u03b5 zoom \u03ba\u03b1\u03b9 \u03c0\u03ac\u03c4\u03b7\u03c3\u03b5 \u03c6\u03cc\u03c1\u03c4\u03c9\u03c3\u03b7.",
    loaded: "\u03a6\u03bf\u03c1\u03c4\u03ce\u03b8\u03b7\u03ba\u03b1\u03bd \u03c4\u03bc\u03ae\u03bc\u03b1\u03c4\u03b1 \u03b1\u03b3\u03c9\u03b3\u03ce\u03bd",
    failed: "\u0394\u03b5\u03bd \u03c6\u03bf\u03c1\u03c4\u03ce\u03b8\u03b7\u03ba\u03b5 \u03c4\u03bc\u03ae\u03bc\u03b1 \u03b1\u03b3\u03c9\u03b3\u03ce\u03bd. \u0394\u03bf\u03ba\u03af\u03bc\u03b1\u03c3\u03b5 \u03bc\u03b9\u03ba\u03c1\u03cc\u03c4\u03b5\u03c1\u03b7 \u03c0\u03b5\u03c1\u03b9\u03bf\u03c7\u03ae.",
    map: "\u03a7\u03ac\u03c1\u03c4\u03b7\u03c2 \u03cd\u03b4\u03c1\u03b5\u03c5\u03c3\u03b7\u03c2",
    protected: "\u03a4\u03bf \u03c0\u03bb\u03ae\u03c1\u03b5\u03c2 \u03b4\u03af\u03ba\u03c4\u03c5\u03bf \u03b4\u03b5\u03bd \u03c6\u03bf\u03c1\u03c4\u03ce\u03bd\u03b5\u03c4\u03b1\u03b9 \u03c3\u03c4\u03bf\u03bd browser.",
  },
  en: {
    title: "Pantavion Water Network",
    subtitle:
      "Real pipe network from the authentic KMZ. Colors, lines and pipe geometry are not changed. The browser receives only the controlled map segment.",
    language: "Language",
    street: "Street",
    number: "Number",
    area: "Area",
    postal: "Postal code",
    load: "Load pipes in map area",
    loading: "Loading...",
    ready: "Map is ready. Pan or zoom, then load the visible area.",
    loaded: "Loaded pipe segments",
    failed: "No pipe segment loaded. Try a smaller area.",
    map: "Water map",
    protected: "The complete network is not loaded in the browser.",
  },
};

const AREAS = [
  { label: "\u039b\u03b5\u03bc\u03b5\u03c3\u03cc\u03c2", center: [34.681, 33.038], zoom: 15 },
  { label: "\u0393\u03b5\u03c1\u03bc\u03b1\u03c3\u03cc\u03b3\u03b5\u03b9\u03b1", center: [34.704, 33.081], zoom: 15 },
  { label: "\u0386\u03b3\u03b9\u03bf\u03c2 \u0391\u03b8\u03b1\u03bd\u03ac\u03c3\u03b9\u03bf\u03c2", center: [34.714, 33.055], zoom: 15 },
  { label: "\u039a\u03bf\u03bb\u03cc\u03c3\u03c3\u03b9", center: [34.669, 32.933], zoom: 15 },
] as const;

function ensureLeaflet() {
  return new Promise<any>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window unavailable"));
      return;
    }

    if (window.L) {
      resolve(window.L);
      return;
    }

    if (!document.querySelector("link[data-leaflet-css]")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      css.setAttribute("data-leaflet-css", "true");
      document.head.appendChild(css);
    }

    const existing = document.querySelector("script[data-leaflet-js]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.setAttribute("data-leaflet-js", "true");
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function getPipeStyle(feature: any) {
  const raw = feature?.properties?.kmlLineStyle;

  if (!raw || typeof raw !== "object") {
    return { color: "#202020", weight: 2, opacity: 1 };
  }

  const style = raw as {
    color?: unknown;
    weight?: unknown;
    width?: unknown;
    opacity?: unknown;
  };

  const weight =
    typeof style.weight === "number"
      ? style.weight
      : typeof style.width === "number"
        ? style.width
        : 2;

  return {
    color: typeof style.color === "string" ? style.color : "#202020",
    weight: Math.max(1, Math.min(10, weight)),
    opacity:
      typeof style.opacity === "number"
        ? Math.max(0.05, Math.min(1, style.opacity))
        : 1,
  };
}

function bboxFromMap(map: any) {
  const bounds = map.getBounds();

  return {
    minLng: bounds.getWest().toFixed(6),
    minLat: bounds.getSouth().toFixed(6),
    maxLng: bounds.getEast().toFixed(6),
    maxLat: bounds.getNorth().toFixed(6),
  };
}

export default function ControlledWaterSegmentClient() {
  const [lang, setLang] = useState<Lang>("el");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [area, setArea] = useState("\u039b\u03b5\u03bc\u03b5\u03c3\u03cc\u03c2");
  const [postal, setPostal] = useState("");
  const [message, setMessage] = useState(UI.el.ready);
  const [loading, setLoading] = useState(false);
  const [pipeCount, setPipeCount] = useState<number | null>(null);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  const t = UI[lang];

  useEffect(() => {
    setMessage(pipeCount === null ? UI[lang].ready : `${UI[lang].loaded}: ${pipeCount}`);
  }, [lang]);

  useEffect(() => {
    let cancelled = false;

    ensureLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;

        const map = L.map(mapEl.current, {
          center: [34.681, 33.038],
          zoom: 15,
          zoomControl: true,
          preferCanvas: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 20,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        mapRef.current = map;
        window.setTimeout(() => map.invalidateSize(), 300);
        window.setTimeout(() => map.invalidateSize(), 900);
      })
      .catch(() => setMessage(UI[lang].failed));

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  function moveTo(center: readonly [number, number], zoom: number) {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom, { animate: true });
  }

  async function loadPipes() {
    const map = mapRef.current;

    if (!map) {
      setMessage(t.failed);
      return;
    }

    setLoading(true);
    setMessage(t.loading);

    try {
      const params = new URLSearchParams({
        ...bboxFromMap(map),
        maxFeatures: "1200",
        street,
        houseNumber: number,
        area,
        postalCode: postal,
      });

      const response = await fetch(
        `/api/professional/infrastructure/water/segment/bbox?${params.toString()}`,
        { cache: "no-store" },
      );

      const json = (await response.json()) as SegmentResponse;

      if (
        !response.ok ||
        !json.segment?.features?.length ||
        json.completeNetworkReturned === true ||
        json.rawMasterReturned === true ||
        json.browserFullNetworkLoaded === true
      ) {
        throw new Error(json.error || json.reason || "No safe segment returned.");
      }

      const L = await ensureLeaflet();

      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }

      const layer = L.geoJSON(json.segment, {
        style: (feature: any) => getPipeStyle(feature),
        pointToLayer: (feature: any, latlng: any) => {
          const style = getPipeStyle(feature);

          return L.circleMarker(latlng, {
            radius: Math.max(3, style.weight),
            color: style.color,
            fillColor: style.color,
            fillOpacity: style.opacity,
            opacity: style.opacity,
            weight: style.weight,
          });
        },
      });

      layer.addTo(map);
      layerRef.current = layer;

      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 18 });
      }

      const count = json.pipeSegmentCount ?? json.segmentCount ?? json.segment.features.length;
      setPipeCount(count);
      setMessage(`${t.loaded}: ${count}`);
    } catch {
      setPipeCount(null);
      setMessage(t.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5">
        <header className="rounded-3xl border border-[#b89445]/40 bg-[#0d1a2d] p-5 shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.34em] text-[#f2c766]">
                PANTAVION PROFESSIONAL INFRASTRUCTURE
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{t.title}</h1>
              <p className="mt-3 max-w-4xl text-base leading-8 text-slate-200">{t.subtitle}</p>
              <p className="mt-2 text-sm font-bold text-[#f2c766]">{t.protected}</p>
            </div>

            <label className="flex min-w-[220px] flex-col gap-2 text-sm font-bold text-[#f2c766]">
              {t.language}
              <select
                value={lang}
                onChange={(event) => setLang(event.target.value as Lang)}
                className="rounded-2xl border border-[#b89445]/60 bg-[#07111f] px-4 py-3 text-white outline-none"
              >
                <option value="el">Ελληνικά</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-700 bg-[#0d1a2d] p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              placeholder={t.street}
              className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
            <input
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              placeholder={t.number}
              className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
            <input
              value={area}
              onChange={(event) => setArea(event.target.value)}
              placeholder={t.area}
              className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
            <input
              value={postal}
              onChange={(event) => setPostal(event.target.value)}
              placeholder={t.postal}
              className="rounded-2xl border border-slate-500 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {AREAS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => moveTo(item.center, item.zoom)}
                className="rounded-2xl border border-[#b89445]/60 bg-[#1a2232] px-4 py-3 text-sm font-black text-[#f2c766]"
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              onClick={loadPipes}
              disabled={loading}
              className="rounded-2xl border border-emerald-500/60 bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-100 disabled:opacity-60"
            >
              {loading ? t.loading : t.load}
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-sm text-slate-200">
            {message}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-700 bg-[#0d1a2d]">
          <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
            <h2 className="text-2xl font-black text-[#f2c766]">{t.map}</h2>
            <span className="text-sm text-slate-300">
              {pipeCount !== null ? `${t.loaded}: ${pipeCount}` : t.protected}
            </span>
          </div>

          <div ref={mapEl} className="h-[72vh] min-h-[560px] w-full bg-slate-200" />
        </section>
      </section>
    </main>
  );
}
