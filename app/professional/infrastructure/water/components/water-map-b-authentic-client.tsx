"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { assessWaterMapBPosition } from "@/core/water/water-map-b-position-truth";
import {
  WATER_MAP_B_SOURCE_CANDIDATES,
  type WaterMapBSourceKey,
} from "@/core/water/water-map-b-source-candidates";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

type PositionState = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  measuredAt: string;
  quality: "high" | "medium" | "low" | "unusable";
  warning: string | null;
} | null;

type ViewerState =
  | "checking"
  | "loading"
  | "ready"
  | "missing"
  | "uploading"
  | "auth"
  | "error";

type OwnerFunctionPayload = {
  ok?: boolean;
  status?: string;
  error?: string;
  signedUrl?: string;
  bucket?: string;
  path?: string;
  token?: string;
  fileName?: string;
  sizeBytes?: number;
  sha256?: string;
  expectedSizeBytes?: number;
  expectedSha256?: string;
};

type CadRuntimePoint = {
  x?: number;
  y?: number;
  z?: number;
  clone?: () => CadRuntimePoint;
};

type CadRuntimeEntity = {
  type?: string;
  objectId?: string;
  layer?: string;
  textString?: string;
  contents?: string;
  position?: CadRuntimePoint;
  location?: CadRuntimePoint;
  alignmentPoint?: CadRuntimePoint;
  contentBasePosition?: CadRuntimePoint;
};

type CadRuntimeBlockRecord = {
  newIterator?: () => Iterable<CadRuntimeEntity>;
};

type CadRuntimeManager = {
  openDocument: (
    fileName: string,
    content: ArrayBuffer,
    options: { minimumChunkSize: number; readOnly: boolean },
  ) => Promise<unknown>;
  curDocument?: {
    database?: {
      tables?: {
        blockTable?: {
          getAt?: (name: string) => CadRuntimeBlockRecord | undefined;
        };
      };
    };
  };
  curView?: {
    center?: CadRuntimePoint;
    zoomToFitLayer?: (layerName: string) => boolean;
  };
};

type DwgLabelEntry = {
  objectId: string;
  type: string;
  layer: string;
  text: string;
  x: number | null;
  y: number | null;
};

class MapBOwnerFunctionError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "MapBOwnerFunctionError";
    this.status = status;
    this.code = code;
  }
}


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

async function callOwnerFunction(
  action: "status" | "sign" | "verify" | "download",
  sourceKey: WaterMapBSourceKey,
) {
  const response = await fetch(
    "/api/professional/infrastructure/water/maps/map-b-owner",
    {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, sourceKey }),
    },
  );

  const payload = (await response.json().catch(() => ({}))) as OwnerFunctionPayload;

  if (!response.ok) {
    throw new MapBOwnerFunctionError(
      response.status,
      payload.error || `MAP_B_OWNER_HTTP_${response.status}`,
    );
  }

  return payload;
}

async function sha256Hex(file: File) {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeDwgLabelText(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .replace(/\\P/gi, " ")
    .replace(/\\[A-Za-z][^;]{0,120};/g, " ")
    .replace(/[{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

function searchKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("el-GR");
}

function entityPoint(entity: CadRuntimeEntity) {
  const candidates = [
    entity.position,
    entity.location,
    entity.alignmentPoint,
    entity.contentBasePosition,
  ];

  for (const point of candidates) {
    if (!point) continue;
    const x = Number(point.x);
    const y = Number(point.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return { x, y };
    }
  }

  return null;
}

function buildDwgLabelIndex(manager: CadRuntimeManager) {
  const modelSpace =
    manager.curDocument?.database?.tables?.blockTable?.getAt?.("*Model_Space");
  const iterator = modelSpace?.newIterator?.();
  if (!iterator) return [] as DwgLabelEntry[];

  const entries: DwgLabelEntry[] = [];
  const seen = new Set<string>();

  for (const entity of iterator) {
    const type = String(entity.type || "");
    const typeKey = type.toLowerCase();
    if (
      !typeKey.includes("text") &&
      !typeKey.includes("attribute") &&
      !typeKey.includes("mleader")
    ) {
      continue;
    }

    const text = normalizeDwgLabelText(
      entity.textString ?? entity.contents ?? "",
    );
    if (!text || text.length < 2) continue;

    const layer = String(entity.layer || "0");
    const point = entityPoint(entity);
    const objectId = String(entity.objectId || "");
    const dedupeKey =
      [searchKey(text), searchKey(layer), point?.x ?? "", point?.y ?? ""].join("|");

    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    entries.push({
      objectId,
      type,
      layer,
      text,
      x: point?.x ?? null,
      y: point?.y ?? null,
    });

    if (entries.length >= 50000) break;
  }

  return entries;
}

export default function WaterMapBAuthenticClient({
  initialSourceKey = "canonical-2026-andreaspap",
  allowSourceSwitch = true,
  mapLabel,
}: {
  initialSourceKey?: WaterMapBSourceKey;
  allowSourceSwitch?: boolean;
  mapLabel?: string;
}) {
  const cadContainerRef = useRef<HTMLDivElement | null>(null);
  const cadManagerRef = useRef<CadRuntimeManager | null>(null);
  const [sourceKey, setSourceKey] = useState<WaterMapBSourceKey>(initialSourceKey);
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>("checking");
  const [viewerError, setViewerError] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const [position, setPosition] = useState<PositionState>(null);
  const [locating, setLocating] = useState(false);
  const [dwgLabels, setDwgLabels] = useState<DwgLabelEntry[]>([]);
  const [labelQuery, setLabelQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<DwgLabelEntry | null>(null);

  const labelMatches = useMemo(() => {
    const query = searchKey(labelQuery.trim());
    if (!query) return [];

    return dwgLabels
      .filter((entry) => searchKey(entry.text).includes(query))
      .sort((left, right) => {
        const leftKey = searchKey(left.text);
        const rightKey = searchKey(right.text);
        const leftStarts = leftKey.startsWith(query) ? 0 : 1;
        const rightStarts = rightKey.startsWith(query) ? 0 : 1;
        if (leftStarts !== rightStarts) return leftStarts - rightStarts;
        return left.text.localeCompare(right.text, "el");
      })
      .slice(0, 20);
  }, [dwgLabels, labelQuery]);

  async function openSignedMapB(signedUrl: string) {
    if (!cadContainerRef.current) return;

    setViewerState("loading");
    const cadViewerModule = await importBrowserModule(CAD_VIEWER_MODULE_URL);
    const AcApDocManager = cadViewerModule?.AcApDocManager;
    if (!AcApDocManager) throw new Error("CAD_VIEWER_MODULE_NOT_AVAILABLE");
    if (!cadContainerRef.current) return;

    let manager: CadRuntimeManager;
    try {
      manager = AcApDocManager.instance as CadRuntimeManager;
    } catch {
      AcApDocManager.createInstance({
        container: cadContainerRef.current,
        autoResize: true,
        webworkerFileUrls: CAD_WORKERS,
        checkWorkersOnInit: true,
      });
      manager = AcApDocManager.instance as CadRuntimeManager;
    }
    cadManagerRef.current = manager;

    const response = await fetch(signedUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`MAP_B_DWG_HTTP_${response.status}`);

    const fileContent = await response.arrayBuffer();
    if (fileContent.byteLength !== source.byteSize) {
      throw new Error(`MAP_B_SIZE_MISMATCH_${fileContent.byteLength}`);
    }

    await manager.openDocument(source.fileName, fileContent, {
      minimumChunkSize: 1000,
      readOnly: true,
    });

    const nextLabels = buildDwgLabelIndex(manager);
    setDwgLabels(nextLabels);
    setLabelQuery("");
    setSelectedLabel(null);
    setViewerState("ready");
    setViewerError("");
  }

  async function loadVerifiedMapB() {
    try {
      setViewerState("checking");
      setViewerError("");
      const payload = await callOwnerFunction("download", sourceKey);
      if (!payload.signedUrl) throw new Error("MAP_B_SIGNED_URL_MISSING");
      await openSignedMapB(payload.signedUrl);
    } catch (error) {
      if (error instanceof MapBOwnerFunctionError) {
        if (error.status === 401 || error.status === 403) {
          setViewerError(error.code);
          setViewerState("auth");
          return;
        }
        if (error.status === 409 || error.status === 404) {
          setViewerError("");
          setViewerState("missing");
          return;
        }
      }

      setViewerError(error instanceof Error ? error.message : String(error));
      setViewerState("error");
    }
  }

  useEffect(() => {
    if (!allowSourceSwitch) {
      setSourceKey(initialSourceKey);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const nextSourceKey: WaterMapBSourceKey =
      params.get("sourceKey") === "legacy-george-85m"
        ? "legacy-george-85m"
        : initialSourceKey;

    setSourceKey(nextSourceKey);
  }, [allowSourceSwitch, initialSourceKey]);

  useEffect(() => {
    setDwgLabels([]);
    setLabelQuery("");
    setSelectedLabel(null);
    void loadVerifiedMapB();
    // Reload when switching between the two authentic DWG sources.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  async function uploadExactMapB(file: File) {
    try {
      setViewerState("uploading");
      setViewerError("");

      if (file.size !== source.byteSize) {
        throw new Error(`MAP_B_WRONG_SIZE_${file.size}`);
      }

      setUploadLabel("Έλεγχος SHA-256…");
      const sha256 = await sha256Hex(file);
      if (sha256 !== source.sha256) {
        throw new Error("MAP_B_SHA256_MISMATCH");
      }

      setUploadLabel("Δημιουργία ασφαλούς upload…");
      const signed = await callOwnerFunction("sign", sourceKey);

      if (signed.status !== "already_present") {
        if (!signed.bucket || !signed.path || !signed.token) {
          throw new Error("MAP_B_UPLOAD_TOKEN_MISSING");
        }

        setUploadLabel("Ανέβασμα αυθεντικού DWG…");
        const supabase = createSupabaseClient();
        const { error } = await supabase.storage
          .from(signed.bucket)
          .uploadToSignedUrl(signed.path, signed.token, file, {
            contentType: "application/acad",
          });

        if (error) {
          throw new Error(`MAP_B_UPLOAD_FAILED: ${error.message}`);
        }
      }

      setUploadLabel("Server-side επαλήθευση DWG…");
      await callOwnerFunction("verify", sourceKey);

      setUploadLabel(`Άνοιγμα ${mapLabel || source.label}…`);
      await loadVerifiedMapB();
      setUploadLabel("");
    } catch (error) {
      if (error instanceof MapBOwnerFunctionError && (error.status === 401 || error.status === 403)) {
        setViewerError(error.code);
        setViewerState("auth");
      } else {
        setViewerError(error instanceof Error ? error.message : String(error));
        setViewerState("error");
      }
      setUploadLabel("");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function focusDwgLabel(entry: DwgLabelEntry) {
    const manager = cadManagerRef.current;
    const view = manager?.curView;
    if (!view) return;

    if (entry.x !== null && entry.y !== null && view.center) {
      const nextCenter =
        typeof view.center.clone === "function"
          ? view.center.clone()
          : { ...view.center };
      nextCenter.x = entry.x;
      nextCenter.y = entry.y;
      view.center = nextCenter;
    } else if (entry.layer && typeof view.zoomToFitLayer === "function") {
      view.zoomToFitLayer(entry.layer);
    }

    setSelectedLabel(entry);
  }

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

  const canUpload = viewerState === "missing" || viewerState === "error";

  return (
    <main className="relative min-h-screen bg-black text-white">
      {allowSourceSwitch ? (
        <div className="absolute left-4 top-4 z-40 flex flex-wrap gap-2">
          {(
            [
              ["canonical-2026-andreaspap", "Map B · Canonical DWG"],
              ["legacy-george-85m", "Map C · Authentic DWG"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("sourceKey", key);
                window.history.replaceState(null, "", url);
                setSourceKey(key);
              }}
              className={`rounded-xl border px-3 py-2 text-xs font-black ${
                sourceKey === key
                  ? "border-[#f6c85f] bg-[#f6c85f] text-black"
                  : "border-white/25 bg-black/80 text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="absolute left-4 top-4 z-40 rounded-xl border border-[#f6c85f]/40 bg-black/85 px-3 py-2 text-xs font-black text-[#f6c85f]">
          {mapLabel || source.label}
        </div>
      )}

      <div ref={cadContainerRef} className="h-[calc(100vh-72px)] min-h-[680px] w-full bg-black" />

      {viewerState === "ready" ? (
        <section className="absolute left-4 top-16 z-40 w-[min(92vw,390px)] rounded-2xl border border-cyan-300/25 bg-black/90 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                DWG label search
              </p>
              <p className="mt-1 text-xs text-white/65">
                {dwgLabels.length.toLocaleString("el-GR")} TEXT/MTEXT labels στο model space
              </p>
            </div>
            <a
              href="/professional/infrastructure/water/location"
              className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-[10px] font-black text-white/80"
            >
              Επίσημη οδός
            </a>
          </div>

          <input
            type="search"
            value={labelQuery}
            onChange={(event) => setLabelQuery(event.target.value)}
            placeholder="Γράψε οδό ή label του DWG…"
            className="mt-3 w-full rounded-xl border border-white/15 bg-[#07111f] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/60"
          />

          {labelQuery.trim() ? (
            <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-black/70">
              {labelMatches.length ? (
                labelMatches.map((entry, index) => (
                  <button
                    key={`${entry.objectId || "label"}-${index}`}
                    type="button"
                    onClick={() => focusDwgLabel(entry)}
                    className="block w-full border-b border-white/10 px-3 py-2 text-left last:border-b-0 hover:bg-white/10"
                  >
                    <span className="block text-xs font-black text-white">
                      {entry.text}
                    </span>
                    <span className="mt-1 block text-[10px] text-white/45">
                      {entry.layer} · {entry.type}
                      {entry.x !== null && entry.y !== null
                        ? ` · CAD ${entry.x.toFixed(2)}, ${entry.y.toFixed(2)}`
                        : ""}
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-3 text-xs text-white/55">
                  Δεν βρέθηκε αντίστοιχο TEXT/MTEXT στον αυθεντικό DWG. Χρησιμοποίησε «Επίσημη οδός» για DLS/OSM αναζήτηση.
                </p>
              )}
            </div>
          ) : null}

          {selectedLabel ? (
            <div className="mt-2 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-[11px] text-cyan-50">
              <strong>{selectedLabel.text}</strong>
              <span className="ml-2 text-cyan-100/55">
                {selectedLabel.layer}
              </span>
            </div>
          ) : null}

          <p className="mt-2 text-[10px] leading-4 text-amber-100/65">
            Η αναζήτηση διαβάζει labels του ίδιου του DWG. Το GPS δεν τοποθετείται πάνω στον DWG μέχρι να επαληθευτεί CRS/ευθυγράμμιση.
          </p>
        </section>
      ) : null}

      {viewerState === "checking" || viewerState === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black text-sm font-black tracking-wide text-[#f6c85f]">
          {viewerState === "checking"
            ? `Έλεγχος ${source.label}…`
            : `Φόρτωση αυθεντικού ${source.label}…`}
        </div>
      ) : null}

      {viewerState === "missing" ? (
        <div className="absolute inset-x-4 top-4 z-30 mx-auto max-w-xl rounded-2xl border border-[#f6c85f]/40 bg-black/95 p-5 text-white shadow-2xl">
          <p className="text-base font-black">{source.label} — canonical master υπάρχει στο Pantavion</p>
          <p className="mt-2 text-sm text-white/75">
            Δεν απαιτείται νέο upload από τον Founder. Ο αυθεντικός DWG παραμένει immutable και ο χάρτης ανοίγει μόνο από verified GIS/PostGIS derived layer.
          </p>
          <button
            type="button"
            onClick={() => void loadVerifiedMapB()}
            className="mt-4 rounded-xl border border-white/30 px-4 py-3 text-sm font-black text-white"
          >
            Επανέλεγχος GIS layer
          </button>
        </div>
      ) : null}

      {viewerState === "uploading" ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/90 px-6 text-center">
          <div className="rounded-2xl border border-[#f6c85f]/40 bg-black p-6 text-sm font-black text-[#f6c85f]">
            {uploadLabel || "Επεξεργασία Map B…"}
          </div>
        </div>
      ) : null}

      {viewerState === "auth" ? (
        <div className="absolute inset-x-4 top-20 z-30 mx-auto max-w-xl rounded-2xl border border-amber-400/40 bg-black/95 p-5 text-sm text-white">
          <p className="font-black text-amber-200">Απαιτείται Founder/Admin session.</p>
          <p className="mt-2 text-white/70">
            Ο αυθεντικός DWG παραμένει private. Άνοιξε ασφαλές Water admin session και θα επιστρέψεις αυτόματα στον ίδιο χάρτη.
          </p>
          <button
            type="button"
            onClick={() => {
              const next = `${window.location.pathname}${window.location.search}`;
              window.location.href =
                `/professional/infrastructure/water/admin/access?next=${encodeURIComponent(next)}`;
            }}
            className="mt-4 rounded-xl bg-[#f6c85f] px-4 py-3 text-sm font-black text-black"
          >
            Founder πρόσβαση
          </button>
        </div>
      ) : null}

      {viewerState === "error" ? (
        <div className="absolute inset-x-4 top-4 z-30 mx-auto max-w-xl rounded-2xl border border-red-400/40 bg-black/95 p-5 text-sm font-bold text-red-100">
          <p>{mapLabel || source.label} δεν άνοιξε: {viewerError}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadVerifiedMapB()}
              className="rounded-lg border border-white/30 px-3 py-2 text-white"
            >
              Ξανά έλεγχος
            </button>
            <span className="rounded-lg border border-[#f6c85f]/40 bg-[#f6c85f]/10 px-3 py-2 text-[#f6c85f]">
              Το canonical DWG υπάρχει ήδη στο Pantavion — δεν απαιτείται νέο upload
            </span>
          </div>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept=".dwg,application/acad,application/octet-stream"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void uploadExactMapB(file);
        }}
        disabled={!canUpload}
      />

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
