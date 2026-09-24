"use client";

import { useEffect, useRef, useState } from "react";

import { assessWaterMapBPosition } from "@/core/water/water-map-b-position-truth";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";

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

const MAP_B_FILE_NAME = "GEORGE_MAP_MASTER_B_C_FINAL (4).dwg";
const MAP_B_SIZE_BYTES = 85703125;
const MAP_B_SHA256 = "038b9bceda2a660296a9162723f5279e5a2d10eb18d499b087d0e8ffa393b800";
const MAP_B_FUNCTION = "pantavion-map-b-owner-dwg";

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

async function callOwnerFunction(action: "status" | "sign" | "verify" | "download") {
  const supabase = createSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new MapBOwnerFunctionError(401, "MAP_B_AUTH_REQUIRED");
  }

  const { url, publishableKey } = getSupabasePublicConfig();
  const response = await fetch(`${url}/functions/v1/${MAP_B_FUNCTION}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: publishableKey,
    },
    body: JSON.stringify({ action }),
  });

  const payload = (await response.json().catch(() => ({}))) as OwnerFunctionPayload;

  if (!response.ok) {
    throw new MapBOwnerFunctionError(
      response.status,
      payload.error || `MAP_B_FUNCTION_HTTP_${response.status}`,
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

export default function WaterMapBAuthenticClient() {
  const cadContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>("checking");
  const [viewerError, setViewerError] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const [position, setPosition] = useState<PositionState>(null);
  const [locating, setLocating] = useState(false);

  async function openSignedMapB(signedUrl: string) {
    if (!cadContainerRef.current) return;

    setViewerState("loading");
    const cadViewerModule = await importBrowserModule(CAD_VIEWER_MODULE_URL);
    const AcApDocManager = cadViewerModule?.AcApDocManager;
    if (!AcApDocManager) throw new Error("CAD_VIEWER_MODULE_NOT_AVAILABLE");
    if (!cadContainerRef.current) return;

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

    const response = await fetch(signedUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`MAP_B_DWG_HTTP_${response.status}`);

    const fileContent = await response.arrayBuffer();
    if (fileContent.byteLength !== MAP_B_SIZE_BYTES) {
      throw new Error(`MAP_B_SIZE_MISMATCH_${fileContent.byteLength}`);
    }

    await manager.openDocument(MAP_B_FILE_NAME, fileContent, {
      minimumChunkSize: 1000,
      readOnly: true,
    });

    setViewerState("ready");
    setViewerError("");
  }

  async function loadVerifiedMapB() {
    try {
      setViewerState("checking");
      setViewerError("");
      const payload = await callOwnerFunction("download");
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
    void loadVerifiedMapB();
    // Intentionally run only once when the Map B workspace mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadExactMapB(file: File) {
    try {
      setViewerState("uploading");
      setViewerError("");

      if (file.size !== MAP_B_SIZE_BYTES) {
        throw new Error(`MAP_B_WRONG_SIZE_${file.size}`);
      }

      setUploadLabel("Έλεγχος SHA-256…");
      const sha256 = await sha256Hex(file);
      if (sha256 !== MAP_B_SHA256) {
        throw new Error("MAP_B_SHA256_MISMATCH");
      }

      setUploadLabel("Δημιουργία ασφαλούς upload…");
      const signed = await callOwnerFunction("sign");

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

        if (error) throw new Error(`MAP_B_UPLOAD_FAILED: ${error.message}`);
      }

      setUploadLabel("Server-side επαλήθευση DWG…");
      await callOwnerFunction("verify");

      setUploadLabel("Άνοιγμα Map B…");
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
      <div ref={cadContainerRef} className="h-[calc(100vh-72px)] min-h-[680px] w-full bg-black" />

      {viewerState === "checking" || viewerState === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black text-sm font-black tracking-wide text-[#f6c85f]">
          {viewerState === "checking" ? "Έλεγχος Map B…" : "Φόρτωση αυθεντικού Map B DWG…"}
        </div>
      ) : null}

      {viewerState === "missing" ? (
        <div className="absolute inset-x-4 top-4 z-30 mx-auto max-w-xl rounded-2xl border border-[#f6c85f]/40 bg-black/95 p-5 text-white shadow-2xl">
          <p className="text-base font-black">Map B — φόρτωση αυθεντικού DWG</p>
          <p className="mt-2 text-sm text-white/75">
            Επιλέγεται μόνο το ακριβές owner-confirmed αρχείο. Πριν αποθηκευτεί γίνεται έλεγχος μεγέθους και SHA-256 και μετά server-side επαλήθευση.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 rounded-xl bg-[#f6c85f] px-4 py-3 text-sm font-black text-black"
          >
            Φόρτωση Map B
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
        <div className="absolute inset-x-4 top-4 z-30 mx-auto max-w-xl rounded-2xl border border-amber-400/40 bg-black/95 p-5 text-sm text-white">
          <p className="font-black text-amber-200">Απαιτείται ενεργή σύνδεση ιδιοκτήτη Pantavion.</p>
          <p className="mt-2 text-white/70">
            Ο Map B παραμένει private και δεν εκτίθεται χωρίς authenticated founder session.
          </p>
        </div>
      ) : null}

      {viewerState === "error" ? (
        <div className="absolute inset-x-4 top-4 z-30 mx-auto max-w-xl rounded-2xl border border-red-400/40 bg-black/95 p-5 text-sm font-bold text-red-100">
          <p>Ο Map B δεν άνοιξε: {viewerError}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadVerifiedMapB()}
              className="rounded-lg border border-white/30 px-3 py-2 text-white"
            >
              Ξανά έλεγχος
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-[#f6c85f] px-3 py-2 text-black"
            >
              Φόρτωση σωστού DWG
            </button>
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
        disabled={!canUpload && viewerState !== "missing"}
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
