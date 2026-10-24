"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WaterMapDrawingTools, { WaterMapDrawingBar, useWaterMapDrawing } from "../components/water-map-drawing-tools";

import WaterCadTileCanvas, {
  type CadLayerInfo,
  type CadLinetype,
  type CadStyle,
  type CadTileData,
  type CadTileIndexItem,
  type CanvasStats,
  type CadBounds,
  type CadMarker,
} from "../components/water-cad-tile-canvas";


type TileIndexItem = {
  x: number;
  y: number;
  file: string;
  segmentCount: number;
  pointCount?: number;
  labelCount?: number;
  part?: number;
  parts?: number;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type Manifest = {
  ok: boolean;
  sourceKey?: "canonical-2026-andreaspap" | "legacy-george-85m";
  canonical?: boolean;
  sourceSha256?: string | null;
  sourceFileName?: string | null;
  coordinateSpace?: string | null;
  geographicAlignmentVerified?: boolean;
  cadastralOverlayAllowed?: boolean;
  type?: string;
  source?: string;
  rawDxfIncluded?: boolean;
  publicRawDxfAccess?: boolean;
  mobileMustUseDerivedTilesOnly?: boolean;
  dxfSizeBytes?: number | null;
  grid?: number | null;
  generatorVersion?: string | null;
  lods?: Array<{ level: number; grid: number; tiles: CadTileIndexItem[] }>;
  totalEntities?: number;
  totalLineSegments?: number;
  matchedNetworkSegments?: number;
  writtenTileCount?: number;
  overflowSegmentCount?: number;
  pointCount?: number;
  labelCount?: number;
  fillCount?: number;
  layerInfo?: CadLayerInfo[];
  styles?: CadStyle[];
  linetypes?: Record<string, CadLinetype>;
  cadHeader?: { LWDISPLAY?: number };
  allBounds?: Bounds | null;
  coreBounds?: Bounds | null;
  layers?: string[];
  topLayers?: Array<{ layer: string; count: number }>;
  tiles?: TileIndexItem[];
  error?: string;
  message?: string;
};


type LoadState = "idle" | "loading" | "ready" | "error";


function readApprovedWaterDevice() {
  if (typeof window === "undefined") {
    return { deviceId: "", deviceToken: "" };
  }

  const deviceId =
    window.localStorage.getItem("pantavion_water_device_id") ||
    window.localStorage.getItem("pantavion-water-device-id") ||
    window.localStorage.getItem("waterDeviceId") ||
    "";

  const deviceToken =
    window.localStorage.getItem("pantavion_water_device_token") ||
    window.localStorage.getItem("pantavion-water-device-token") ||
    window.localStorage.getItem("waterDeviceToken") ||
    "";

  if (deviceId && deviceToken) {
    return { deviceId, deviceToken };
  }

  for (const key of [
    "pantavion_water_access_device",
    "pantavion-water-access-device",
    "waterAccessDevice",
    "water-approved-device",
  ]) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const parsedDeviceId = String(parsed.deviceId || parsed.id || "");
      const parsedDeviceToken = String(parsed.deviceToken || parsed.token || "");

      if (parsedDeviceId && parsedDeviceToken) {
        return { deviceId: parsedDeviceId, deviceToken: parsedDeviceToken };
      }
    } catch {
      // Ignore malformed legacy storage and remain fail-closed.
    }
  }

  return { deviceId: "", deviceToken: "" };
}

function waterAccessHeaders(): Record<string, string> {
  const device = readApprovedWaterDevice();

  if (!device.deviceId || !device.deviceToken) {
    return {};
  }

  return {
    "x-pantavion-water-device-id": device.deviceId,
    "x-pantavion-water-device-token": device.deviceToken,
  };
}

function formatNumber(value: number | undefined | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("el-GR").format(value);
}

export default function MasterBMobilePage() {
  const [sourceKey, setSourceKey] = useState<
    "canonical-2026-andreaspap" | "legacy-george-85m"
  >("canonical-2026-andreaspap");
  const [viewId, setViewId] = useState<"B" | "C" | "D" | "E">("B");
  const drawing = useWaterMapDrawing(viewId, sourceKey);

  const sourceLabel =
    viewId === "D"
      ? "Map D"
      : viewId === "E"
        ? "Map E"
        : sourceKey === "legacy-george-85m"
          ? "Map C"
          : "Map B";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextSource =
      params.get("sourceKey") === "legacy-george-85m"
        ? "legacy-george-85m"
        : "canonical-2026-andreaspap";
    const requestedView = params.get("viewId");
    const nextView =
      requestedView === "D" && nextSource === "canonical-2026-andreaspap"
        ? "D"
        : requestedView === "E" && nextSource === "legacy-george-85m"
          ? "E"
          : nextSource === "legacy-george-85m"
            ? "C"
            : "B";

    setSourceKey(nextSource);
    setViewId(nextView);
    // A register entry opens Map D centred on it (…&x=…&y=…&asset=…).
    const fx = Number(params.get("x"));
    const fy = Number(params.get("y"));
    if (Number.isFinite(fx) && Number.isFinite(fy) && params.get("x") && params.get("y")) {
      setFocus({ x: fx, y: fy, asset: params.get("asset") || "" });
    }
  }, []);

  const [focus, setFocus] = useState<{ x: number; y: number; asset: string } | null>(null);
  const [registerMarkers, setRegisterMarkers] = useState<CadMarker[]>([]);
  const [registerNote, setRegisterNote] = useState("");

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [layerQuery, setLayerQuery] = useState("");
  const [selectedDrawingPoint, setSelectedDrawingPoint] = useState<{ x: number; y: number } | null>(null);
  const [canvasStats, setCanvasStats] = useState<CanvasStats | null>(null);
  const [showHiddenLayers, setShowHiddenLayers] = useState(true);
  const [lineweightOverride, setLineweightOverride] = useState<boolean | null>(null);
  const [drawingPanelOpen, setDrawingPanelOpen] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError("");
      setManifest(null);

      try {
        const manifestResponse = await fetch(
          `/api/professional/infrastructure/water/master-b/derived/manifest?sourceKey=${encodeURIComponent(
            sourceKey,
          )}`,
          {
            cache: "no-store",
            credentials: "include",
            headers: waterAccessHeaders(),
          },
        );

        const manifestJson = (await manifestResponse.json()) as Manifest;

        if (!manifestResponse.ok || !manifestJson.ok) {
          throw new Error(
            manifestJson.message ||
              manifestJson.error ||
              "Master B manifest could not be loaded.",
          );
        }

        if (cancelled) return;
        setManifest(manifestJson);
        setStatus("ready");
      } catch (loadError) {
        if (cancelled) return;
        setManifest(null);
        setError(loadError instanceof Error ? loadError.message : "UNKNOWN_ERROR");
        setStatus("error");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [sourceKey]);

  const fetchTile = useCallback(
    async (file: string) => {
      const response = await fetch(
        `/api/professional/infrastructure/water/master-b/derived/tile?sourceKey=${encodeURIComponent(
          sourceKey,
        )}&file=${encodeURIComponent(file)}${
          manifest?.generatorVersion ? `&v=${encodeURIComponent(manifest.generatorVersion)}` : ""
        }`,
        {
          cache: "force-cache",
          credentials: "include",
          headers: waterAccessHeaders(),
        },
      );
      if (!response.ok) return null;
      const tileJson = (await response.json()) as Partial<CadTileData>;
      return {
        segments: tileJson.segments ?? [],
        fills: tileJson.fills ?? [],
        texts: tileJson.texts ?? [],
        points: tileJson.points ?? [],
      } as CadTileData;
    },
    [sourceKey, manifest?.generatorVersion],
  );

  // Map D is the working map: the network register (valves, hydrants, tanks…)
  // is drawn over Map B with each entry's number, for what is on screen.
  const MARKER_COLOR: Record<string, string> = {
    valve: "#38bdf8", air_valve: "#a3e635", hydrant: "#f87171", pressure_reducing_valve: "#c084fc", tank: "#fbbf24",
  };
  const loadRegisterMarkers = useCallback(async (bounds: CadBounds, scale: number) => {
    if (scale < 0.25) {
      setRegisterMarkers([]);
      setRegisterNote("Κάνε ζουμ για να εμφανιστούν οι βάνες και οι αριθμοί τους.");
      return;
    }
    const p = new URLSearchParams({
      minX: String(bounds.minX), minY: String(bounds.minY), maxX: String(bounds.maxX), maxY: String(bounds.maxY), limit: "2000",
    });
    try {
      const r = await fetch(`/api/professional/infrastructure/water/register?${p}`, { credentials: "include", headers: waterAccessHeaders() });
      if (!r.ok) { setRegisterNote("Το μητρώο δικτύου δεν είναι διαθέσιμο σε αυτή τη συσκευή."); return; }
      const j = (await r.json()) as { total: number; assets: Array<{ number: string; kind: string; x: number; y: number }> };
      setRegisterMarkers(j.assets.map((a) => ({
        x: a.x, y: a.y, label: a.number, color: MARKER_COLOR[a.kind] ?? "#ffffff", highlight: a.number === focus?.asset,
      })));
      setRegisterNote(`Μητρώο: ${j.assets.length}${j.total > j.assets.length ? ` από ${j.total}` : ""} στοιχεία στην οθόνη · μπλε βάνα, κόκκινο υδροστόμιο, πράσινο αεροβαλβίδα, κίτρινο δεξαμενή.`);
    } catch {
      setRegisterNote("Το μητρώο δικτύου δεν φορτώθηκε.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.asset]);

  const layerNames = useMemo(() => manifest?.layers ?? [], [manifest?.layers]);
  const hiddenLayers = useMemo(() => {
    const infos = manifest?.layerInfo ?? [];
    return layerNames.flatMap((name, index) => {
      const info = infos[index];
      return info && (info.off || info.frozen) ? [{ name, off: info.off, frozen: info.frozen }] : [];
    });
  }, [layerNames, manifest?.layerInfo]);

  const coreBounds = manifest?.coreBounds ?? manifest?.allBounds ?? null;
  const canDraw = Boolean(
    manifest?.ok && coreBounds && manifest.grid && (manifest.tiles?.length ?? 0) > 0 && manifest.styles?.length,
  );
  const lineweightDisplay = lineweightOverride ?? (manifest?.cadHeader?.LWDISPLAY ?? 0) !== 0;

  const topLayers = manifest?.topLayers?.slice(0, 14) ?? [];

  return (
    <main className="min-h-screen bg-[#061120] px-4 py-5 text-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="rounded-3xl border border-[#f2c766]/40 bg-[#0b1728] p-5 shadow-2xl">
          <a
            href="/professional/infrastructure/water"
            className="text-sm font-black text-[#f2c766]"
          >
            ← Πίσω στην Ύδρευση
          </a>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.34em] text-[#f2c766]">
            Pantavion Water · Derived DWG Viewer
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            {sourceLabel}
          </h1>

          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-300 md:text-base">
            Φορτώνει derived vector/network tiles από το επιλεγμένο επαληθευμένο DWG.
            Δεν φορτώνει raw DWG στον browser. Τα Map B και Map C παραμένουν
            οι δύο αυθεντικές πηγές. Τα D/E είναι ξεχωριστές ελεγχόμενες προβολές
            πάνω στα ίδια canonical masters, χωρίς δεύτερο raw αντίγραφο.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="/professional/infrastructure/water/live"
            className="rounded-xl border border-slate-600 bg-[#091426] px-3 py-2 text-xs font-black text-slate-200"
          >
            Map A
          </a>
          <a
            href="/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap"
            className={`rounded-xl border px-3 py-2 text-xs font-black ${
              sourceKey === "canonical-2026-andreaspap"
                ? "border-[#f2c766] bg-[#f2c766] text-black"
                : "border-slate-600 bg-[#091426] text-slate-200"
            }`}
          >
            Map B
          </a>
          <a
            href="/professional/infrastructure/water/master-b-mobile?sourceKey=legacy-george-85m"
            className={`rounded-xl border px-3 py-2 text-xs font-black ${
              sourceKey === "legacy-george-85m"
                ? "border-[#f2c766] bg-[#f2c766] text-black"
                : "border-slate-600 bg-[#091426] text-slate-200"
            }`}
          >
            Map C
          </a>
          <a
            href="/professional/infrastructure/water/d"
            className={`rounded-xl border px-3 py-2 text-xs font-black ${
              viewId === "D"
                ? "border-[#f2c766] bg-[#f2c766] text-black"
                : "border-slate-600 bg-[#091426] text-slate-200"
            }`}
          >
            Map D
          </a>
          <a
            href="/professional/infrastructure/water/e"
            className={`rounded-xl border px-3 py-2 text-xs font-black ${
              viewId === "E"
                ? "border-[#f2c766] bg-[#f2c766] text-black"
                : "border-slate-600 bg-[#091426] text-slate-200"
            }`}
          >
            Map E
          </a>
          <a
            href="/professional/infrastructure/water/engineering"
            className="rounded-xl border border-violet-700/60 bg-violet-950/30 px-3 py-2 text-xs font-black text-violet-200"
          >
            Engineering
          </a>
        </div>

        <div className="grid gap-3 md:grid-cols-7">
          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Status</p>
            <p className="mt-2 text-xl font-black text-[#f2c766]">{status}</p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Total lines</p>
            <p className="mt-2 text-xl font-black">
              {formatNumber(manifest?.totalLineSegments)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Tiles</p>
            <p className="mt-2 text-xl font-black">
              {formatNumber(manifest?.writtenTileCount)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Lines on screen</p>
            <p className="mt-2 text-xl font-black">{formatNumber(canvasStats?.drawnSegments)}</p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">CAD points</p>
            <p className="mt-2 text-xl font-black">{formatNumber(manifest?.pointCount)}</p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Labels</p>
            <p className="mt-2 text-xl font-black">{formatNumber(manifest?.labelCount)}</p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Πρωτότυπο DWG</p>
            <p className="mt-2 text-xl font-black text-emerald-300">Προστατευμένο</p>
            <p className="mt-1 text-xs font-bold text-slate-400">
              Δεν κατεβαίνει στον browser· εδώ φτάνουν μόνο τα κομμάτια του χάρτη.
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/50 bg-red-950/30 p-4 text-sm font-bold text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-[#f2c766]/30 bg-[#020814] p-3">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
                  Live vector viewport
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {canvasStats
                    ? `Αυθεντικές γραμμές του DWG στις ακριβείς συντεταγμένες · ${formatNumber(canvasStats.loadedTileFiles)}/${formatNumber(canvasStats.visibleTileFiles)} κομμάτια${canvasStats.pendingTileFiles ? " · φορτώνει…" : ""}${canvasStats.atMinZoom ? " · μέγιστο ξεζούμισμα για πλήρη εμφάνιση" : ""}`
                    : "Φορτώνει μόνο ό,τι φαίνεται στην οθόνη, χωρίς καμία απλοποίηση."}
                </p>
              </div>
            </div>

            <div className="mb-3 rounded-xl border border-slate-700 bg-[#091426] p-3 text-sm text-slate-200">
              <p className="font-bold">Επιλογή σημείου χωρίς GPS — Map {viewId}</p>
              <p className="mt-1 text-xs text-slate-400">
                Πάτησε στο σχέδιο για να σημειώσεις θέση σε συντεταγμένες DWG. Η επιλογή δεν
                ισοδυναμεί με πραγματικό GPS και δεν αλλάζει το αυθεντικό δίκτυο.
              </p>
              {selectedDrawingPoint && (
                <p className="mt-2 font-mono text-xs">
                  CAD X: {selectedDrawingPoint.x.toFixed(2)} · Y: {selectedDrawingPoint.y.toFixed(2)}
                </p>
              )}
              {selectedDrawingPoint && manifest?.geographicAlignmentVerified !== true && (
                <p className="mt-2 text-xs text-amber-300">
                  Η γεωαναφορά δεν έχει επαληθευτεί. Η οδική πλοήγηση από αυτό το σημείο
                  παραμένει κλειδωμένη για να μη δοθούν λανθασμένες οδηγίες.
                </p>
              )}
              <a
                href="/professional/infrastructure/water/location"
                className="mt-3 inline-block rounded-lg border border-sky-400/60 px-3 py-2 text-xs font-bold text-sky-200"
              >
                Άνοιγμα οδικού χάρτη (χωρίς μεταφορά μη επαληθευμένων συντεταγμένων)
              </a>
            </div>
            {viewId === "D" ? (
              <div className="mb-3 rounded-2xl border border-sky-400/40 bg-sky-950/30 p-3 text-sm font-bold text-sky-100">
                <p>{registerNote || "Χάρτης εργασίας Δ: το μητρώο δικτύου φορτώνει πάνω στον χάρτη Β."}</p>
                <a href="/professional/infrastructure/water/register" className="mt-1 inline-block font-black text-amber-300">
                  Μητρώο Δικτύου (λίστα ανά περιοχή και οδό) →
                </a>
              </div>
            ) : null}
            <div className={mapFullscreen ? "fixed inset-0 z-[10000] flex flex-col gap-2 bg-[#020814] p-2" : "flex flex-col gap-2"}>
              <WaterMapDrawingBar
                drawing={drawing}
                panelOpen={drawingPanelOpen}
                onTogglePanel={() => setDrawingPanelOpen((open) => !open)}
                fullscreen={mapFullscreen}
                onToggleFullscreen={() => setMapFullscreen((full) => !full)}
              >
                <button
                  type="button"
                  aria-pressed={lineweightDisplay}
                  onClick={() => setLineweightOverride(!lineweightDisplay)}
                  className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-black ${lineweightDisplay ? "border-[#f2c766] bg-[#f2c766] text-black" : "border-slate-600 bg-[#091426] text-slate-200"}`}
                >
                  LWT · πάχη γραμμών
                </button>
                <button
                  type="button"
                  aria-pressed={showHiddenLayers}
                  onClick={() => setShowHiddenLayers((v) => !v)}
                  className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-black ${showHiddenLayers ? "border-[#f2c766] bg-[#f2c766] text-black" : "border-slate-600 bg-[#091426] text-slate-200"}`}
                >
                  {showHiddenLayers ? "Παγωμένα / σβηστά: ανοικτά" : "Παγωμένα / σβηστά: κρυμμένα"}
                </button>
              </WaterMapDrawingBar>
              {drawingPanelOpen ? <WaterMapDrawingTools drawing={drawing} localCad inBar /> : null}
              <div className={mapFullscreen ? "relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-white" : "relative h-[68vh] min-h-[460px] overflow-hidden rounded-2xl border border-slate-800 bg-white"}>
              {canDraw && manifest && coreBounds ? (
                <WaterCadTileCanvas
                  tiles={manifest.tiles ?? []}
                  lods={manifest.lods ?? []}
                  grid={Number(manifest.grid)}
                  coreBounds={coreBounds}
                  layers={layerNames}
                  layerInfo={manifest.layerInfo ?? []}
                  styles={manifest.styles ?? []}
                  linetypes={manifest.linetypes ?? {}}
                  lineweightDisplay={lineweightDisplay}
                  showHiddenLayers={showHiddenLayers}
                  layerQuery={layerQuery}
                  fetchTile={fetchTile}
                  onPick={(point) => { setSelectedDrawingPoint(point); drawing.pick(point); }}
                  annotations={drawing.shapes}
                  onStats={setCanvasStats}
                  markers={viewId === "D" ? registerMarkers : undefined}
                  initialCenter={focus}
                  onViewChange={viewId === "D" ? loadRegisterMarkers : undefined}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm font-black text-slate-700">
                  {status === "loading"
                    ? "Φόρτωση Map B…"
                    : manifest?.ok && !manifest.styles?.length
                      ? "Ο χάρτης ξαναδημιουργείται με τα αυθεντικά χρώματα, τύπους και πάχη γραμμών του DWG. Δοκίμασε ξανά σε λίγα λεπτά."
                    : "The selected derived geometry layer is not configured/processed yet. Raw DWG remains in the private founder/admin vault. Approved users receive only browser-safe derived geometry after processing, access approval, and audit."}
                </div>
              )}
            </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
              Layers / search
            </p>

            <input
              value={layerQuery}
              onChange={(event) => setLayerQuery(event.target.value)}
              placeholder="π.χ. W-DP, UPVC, HDPE"
              className="mt-4 w-full rounded-2xl border border-slate-700 bg-[#061120] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#f2c766]"
            />

            {hiddenLayers.length ? (
              <details open className="mt-4 rounded-2xl border border-slate-700 bg-[#061120] p-3">
                <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.18em] text-[#f2c766]">
                  Σβηστά / παγωμένα επίπεδα ({formatNumber(hiddenLayers.length)})
                </summary>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {showHiddenLayers
                    ? "Εμφανίζονται στον χάρτη. Πάτησε όνομα για να δεις μόνο εκείνο το επίπεδο."
                    : "Κρυμμένα στον χάρτη. Άνοιξέ τα με το κουμπί «Παγωμένα / σβηστά» πάνω από τον χάρτη."}
                </p>
                <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
                  {hiddenLayers.map((item) => (
                    <li key={item.name}>
                      <button
                        type="button"
                        onClick={() => setLayerQuery(item.name)}
                        className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-xs font-bold text-slate-300 hover:bg-slate-800"
                      >
                        <span className="text-[#f2c766]">{item.name}</span>{" "}
                        <span className="text-slate-500">
                          {[item.off ? "σβηστό" : "", item.frozen ? "παγωμένο" : ""].filter(Boolean).join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            <div className="mt-4 space-y-2">
              {topLayers.map((item) => (
                <button
                  key={`${item.layer}-${item.count}`}
                  type="button"
                  onClick={() => setLayerQuery(item.layer)}
                  className="w-full rounded-xl border border-slate-800 bg-[#061120] px-3 py-2 text-left text-xs font-bold text-slate-300"
                >
                  <span className="block truncate text-[#f2c766]">{item.layer}</span>
                  <span className="text-slate-500">{formatNumber(item.count)} segments</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

