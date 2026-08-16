"use client";

import { useEffect, useRef, useState } from "react";

import { assessWaterMapBPosition } from "@/core/water/water-map-b-position-truth";

type PositionState = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  measuredAt: string;
  quality: "high" | "medium" | "low" | "unusable";
  warning: string | null;
} | null;

const MAP_B_FILE_NAME = "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg";
const MAP_B_URL = "/api/professional/infrastructure/water/final-master-dwg";
const CAD_VIEWER_MODULE_URL =
  "https://cdn.jsdelivr.net/npm/@mlightcad/cad-simple-viewer@1.5.5/+esm";

const CAD_WORKERS = {
  dxfParser: "/cad-workers/dxf-parser-worker.js",
  dwgParser: "/cad-workers/libredwg-parser-worker.js",
  mtextRender: "/cad-workers/mtext-renderer-worker.js",
} as const;

function importBrowserModule(url: string) {
  const nativeImport = new Function("url", "return import(url)") as (value: string) => Promise<any>;
  return nativeImport(url);
}

export default function WaterMapBAuthenticClient() {
  const cadContainerRef = useRef<HTMLDivElement | null>(null);
  const [viewerState, setViewerState] = useState<"loading" | "ready" | "error">("loading");
  const [viewerError, setViewerError] = useState("");
  const [position, setPosition] = useState<PositionState>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function openExactMapB() {
      try {
        if (!cadContainerRef.current) return;

        const module = await importBrowserModule(CAD_VIEWER_MODULE_URL);
        const AcApDocManager = module?.AcApDocManager;
        if (!AcApDocManager) throw new Error("CAD_VIEWER_MODULE_NOT_AVAILABLE");
        if (cancelled || !cadContainerRef.current) return;

        const workersReady = await AcApDocManager.checkWebworkerReadiness(CAD_WORKERS);
        if (!workersReady) throw new Error("CAD_WORKERS_NOT_READY");

        let manager: any;
        try {
          manager = AcApDocManager.instance;
        } catch {
          AcApDocManager.createInstance({
            container: cadContainerRef.current,
            autoResize: true,
            webworkerFileUrls: CAD_WORKERS,
            checkWorkersOnInit: true,
          });
          manager = AcApDocManager.instance;
        }

        const response = await fetch(MAP_B_URL, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/acad,application/octet-stream" },
        });

        if (!response.ok) throw new Error(`MAP_B_DWG_HTTP_${response.status}`);

        const fileContent = await response.arrayBuffer();
        if (cancelled) return;

        await manager.openDocument(MAP_B_FILE_NAME, fileContent, {
          minimumChunkSize: 1000,
          readOnly: true,
        });

        if (!cancelled) setViewerState("ready");
      } catch (error) {
        if (cancelled) return;
        setViewerError(error instanceof Error ? error.message : String(error));
        setViewerState("error");
      }
    }

    void openExactMapB();

    return () => {
      cancelled = true;
    };
  }, []);

  function locateMe() {
    if (!navigator.geolocation) return;

    setLocating(true);
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
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }

  return (
    <main className="relative min-h-screen bg-black text-white">
      <div ref={cadContainerRef} className="h-[calc(100vh-72px)] min-h-[680px] w-full bg-black" />

      {viewerState === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black text-sm font-black tracking-wide text-[#f6c85f]">
          Φόρτωση αυθεντικού Map B DWG…
        </div>
      ) : null}

      {viewerState === "error" ? (
        <div className="absolute inset-x-4 top-4 z-20 rounded-xl border border-red-400/40 bg-black/90 p-4 text-sm font-bold text-red-100">
          Ο αυθεντικός DWG δεν άνοιξε: {viewerError}
        </div>
      ) : null}

      <button
        type="button"
        onClick={locateMe}
        disabled={locating}
        aria-label="Η θέση μου"
        className="absolute bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/85 text-xl shadow-xl disabled:opacity-60"
      >
        📍
      </button>

      {position ? (
        <div className="absolute bottom-5 left-5 z-30 rounded-lg bg-black/80 px-3 py-2 text-xs font-bold text-white">
          {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)} · ±{Math.round(position.accuracyMeters)} m
        </div>
      ) : null}
    </main>
  );
}
