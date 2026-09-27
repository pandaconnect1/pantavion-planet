"use client";

import { useMemo, useState } from "react";
import * as tus from "tus-js-client";

import { pantavionWaterApprovedDeviceHeaders } from "@/core/water/water-approved-device-client";

export type SpatialKind = "valve" | "network-extension" | "photo" | "note";

type Props = {
  kind: SpatialKind;
};

type SourceChoice =
  | "map-a"
  | "map-b-canonical"
  | "map-c";

type UploadAuthorization = {
  ok?: boolean;
  error?: string;
  requestId?: string;
  upload?: {
    bucket?: string;
    path?: string;
    token?: string;
    tusEndpoint?: string;
    chunkSizeBytes?: number;
  };
};

type UploadCompletion = {
  ok?: boolean;
  error?: string;
  artifactRef?: string;
  verification?: string;
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `water-field-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function headers(json = true): Record<string, string> {
  return {
    ...(json ? { "content-type": "application/json" } : {}),
    ...pantavionWaterApprovedDeviceHeaders(),
  };
}

function finiteCoordinate(value: string, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max
    ? number
    : null;
}

function sourceTruth(choice: SourceChoice) {
  if (choice === "map-b-canonical") {
    return {
      mapId: "B",
      sourceKey: "canonical-2026-andreaspap",
      label: "Map B Canonical",
    };
  }

  if (choice === "map-c") {
    return {
      mapId: "C",
      sourceKey: "legacy-george-85m",
      label: "Map C",
    };
  }

  return {
    mapId: "A",
    sourceKey: null,
    label: "Map A",
  };
}

async function uploadFieldArtifact(
  file: File,
  onProgress: (value: number) => void,
) {
  const authorizationResponse = await fetch(
    "/api/professional/infrastructure/water/field/evidence-upload/authorize",
    {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: headers(),
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      }),
    },
  );

  const authorization =
    (await authorizationResponse.json()) as UploadAuthorization;

  if (
    !authorizationResponse.ok ||
    !authorization.ok ||
    !authorization.requestId ||
    !authorization.upload?.bucket ||
    !authorization.upload.path ||
    !authorization.upload.token ||
    !authorization.upload.tusEndpoint ||
    !authorization.upload.chunkSizeBytes
  ) {
    throw new Error(
      authorization.error || "water_field_upload_authorization_failed",
    );
  }

  const upload = authorization.upload;

  await new Promise<void>((resolve, reject) => {
    const resumable = new tus.Upload(file, {
      endpoint: upload.tusEndpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: upload.chunkSizeBytes,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      headers: {
        "x-signature": upload.token as string,
        "x-upsert": "false",
      },
      metadata: {
        bucketName: upload.bucket as string,
        objectName: upload.path as string,
        contentType: file.type || "application/octet-stream",
        cacheControl: "0",
      },
      onError(error) {
        reject(error);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const percent =
          bytesTotal > 0
            ? Math.min(100, (bytesUploaded / bytesTotal) * 100)
            : 0;
        onProgress(Math.round(percent * 10) / 10);
      },
      onSuccess() {
        onProgress(100);
        resolve();
      },
    });

    void resumable
      .findPreviousUploads()
      .then((previous) => {
        if (previous.length > 0) {
          resumable.resumeFromPreviousUpload(previous[0]);
        }
        resumable.start();
      })
      .catch(reject);
  });

  const completeResponse = await fetch(
    "/api/professional/infrastructure/water/field/evidence-upload/complete",
    {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: headers(),
      body: JSON.stringify({ requestId: authorization.requestId }),
    },
  );

  const completion = (await completeResponse.json()) as UploadCompletion;

  if (!completeResponse.ok || !completion.ok || !completion.artifactRef) {
    throw new Error(completion.error || "water_field_upload_verify_failed");
  }

  return completion;
}

export default function WaterFieldSpatialClient({ kind }: Props) {
  const [sourceChoice, setSourceChoice] = useState<SourceChoice>("map-a");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [endLatitude, setEndLatitude] = useState("");
  const [endLongitude, setEndLongitude] = useState("");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [usedGps, setUsedGps] = useState(false);
  const [streetName, setStreetName] = useState("");
  const [note, setNote] = useState("");
  const [diameterMm, setDiameterMm] = useState("");
  const [material, setMaterial] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [clientMutationId, setClientMutationId] = useState(makeId);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const source = useMemo(() => sourceTruth(sourceChoice), [sourceChoice]);

  const title =
    kind === "valve"
      ? "Νέα / πιθανή βάνα"
      : kind === "network-extension"
        ? "Νέα επέκταση δικτύου"
        : kind === "photo"
          ? "Φωτογραφία πεδίου"
          : "Σημείωση στον χάρτη";

  function captureCurrentPosition(target: "start" | "end") {
    if (!navigator.geolocation) {
      setMessage("Η συσκευή δεν δίνει geolocation.");
      return;
    }

    setMessage("Εντοπισμός ακριβούς θέσης…");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(8);
        const lng = position.coords.longitude.toFixed(8);

        if (target === "end") {
          setEndLatitude(lat);
          setEndLongitude(lng);
        } else {
          setLatitude(lat);
          setLongitude(lng);
        }

        setGpsAccuracy(
          Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : null,
        );
        setUsedGps(true);
        setMessage(
          `Η θέση καταγράφηκε${Number.isFinite(position.coords.accuracy) ? ` · ακρίβεια ±${Math.round(position.coords.accuracy)} m` : ""}.`,
        );
      },
      () => {
        setMessage(
          "Δεν μπόρεσα να πάρω GPS. Μπορείς να γράψεις συντεταγμένες χειροκίνητα.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  }

  async function createEvidencePin(
    x: number,
    y: number,
    artifactRefs: string[],
    linkedPatchId?: string,
  ) {
    const response = await fetch(
      "/api/professional/infrastructure/water/changes/evidence-pins",
      {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: headers(),
        body: JSON.stringify({
          clientMutationId: `${clientMutationId}:pin`,
          mapId: source.mapId,
          sourceKey: source.sourceKey,
          linkedPatchId: linkedPatchId || null,
          x,
          y,
          crsAuthority: "EPSG",
          crsCode: "4326",
          locationSource: usedGps ? "gps" : "coordinate_entry",
          accuracyState: usedGps
            ? gpsAccuracy !== null && gpsAccuracy <= 10
              ? "measured"
              : "estimated"
            : "estimated",
          accuracyMeters: usedGps ? gpsAccuracy : null,
          streetName: streetName.trim() || null,
          note: note.trim() || null,
          artifactRefs,
          aiObservation: {},
        }),
      },
    );

    const body = (await response.json()) as {
      ok?: boolean;
      error?: string;
      pin?: { pin_id?: string };
    };

    if (!response.ok || !body.ok) {
      throw new Error(body.error || "water_evidence_pin_failed");
    }

    return body.pin?.pin_id || null;
  }

  async function createPatch(
    geometry:
      | {
          type: "Point";
          coordinates: [number, number];
          crs: { authority: "EPSG"; code: "4326" };
        }
      | {
          type: "LineString";
          coordinates: Array<[number, number]>;
          crs: { authority: "EPSG"; code: "4326" };
        },
    artifactRefs: string[],
  ) {
    const diameter = diameterMm.trim() ? Number(diameterMm) : null;
    if (diameter !== null && (!Number.isFinite(diameter) || diameter <= 0)) {
      throw new Error("Η διάμετρος πρέπει να είναι θετικός αριθμός.");
    }

    const response = await fetch(
      "/api/professional/infrastructure/water/changes/patches",
      {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: headers(),
        body: JSON.stringify({
          clientMutationId,
          mapId: source.mapId,
          sourceKey: source.sourceKey,
          assetType: kind === "valve" ? "valve" : "network_extension",
          operation: "create",
          geometry,
          location: {
            source: usedGps ? "gps" : "coordinate_entry",
            accuracyState: usedGps
              ? gpsAccuracy !== null && gpsAccuracy <= 10
                ? "measured"
                : "estimated"
              : "estimated",
            accuracyMeters: usedGps ? gpsAccuracy : null,
            streetName: streetName.trim() || null,
          },
          attributes: {
            note: note.trim() || null,
            material: material.trim() || null,
            diameterMm: diameter,
          },
          evidenceRefs: [],
          artifactRefs,
          relatedJobIds: [],
          relatedReportIds: [],
        }),
      },
    );

    const body = (await response.json()) as {
      ok?: boolean;
      error?: string;
      patch?: { patch_id?: string; status?: string };
    };

    if (!response.ok || !body.ok || !body.patch?.patch_id) {
      throw new Error(body.error || "water_spatial_patch_failed");
    }

    return body.patch;
  }

  async function submit() {
    const lat = finiteCoordinate(latitude, -90, 90);
    const lng = finiteCoordinate(longitude, -180, 180);

    if (lat === null || lng === null) {
      setMessage("Χρειάζεται έγκυρο σημείο latitude / longitude.");
      return;
    }

    if (kind === "photo" && !file) {
      setMessage("Επίλεξε ή τράβηξε φωτογραφία.");
      return;
    }

    let endLat: number | null = null;
    let endLng: number | null = null;

    if (kind === "network-extension") {
      endLat = finiteCoordinate(endLatitude, -90, 90);
      endLng = finiteCoordinate(endLongitude, -180, 180);
      if (endLat === null || endLng === null) {
        setMessage("Η επέκταση χρειάζεται έγκυρο σημείο αρχής και τέλους.");
        return;
      }
      if (lat === endLat && lng === endLng) {
        setMessage("Αρχή και τέλος της επέκτασης δεν μπορούν να είναι το ίδιο σημείο.");
        return;
      }
    }

    setBusy(true);
    setProgress(0);
    setMessage("Αποθήκευση…");

    try {
      const artifactRefs: string[] = [];

      if (file) {
        setMessage("Private resumable upload του τεκμηρίου…");
        const completion = await uploadFieldArtifact(file, setProgress);
        if (completion.artifactRef) artifactRefs.push(completion.artifactRef);
      }

      if (kind === "photo" || kind === "note") {
        const pinId = await createEvidencePin(lng, lat, artifactRefs);
        setMessage(
          `Αποθηκεύτηκε στο ${source.label} ως evidence pin${pinId ? ` · ${pinId}` : ""}. Περιμένει έλεγχο πριν φανεί σε άλλους χρήστες.`,
        );
      } else {
        const geometry =
          kind === "valve"
            ? ({
                type: "Point",
                coordinates: [lng, lat] as [number, number],
                crs: { authority: "EPSG" as const, code: "4326" as const },
              } as const)
            : ({
                type: "LineString",
                coordinates: [
                  [lng, lat],
                  [endLng as number, endLat as number],
                ] as Array<[number, number]>,
                crs: { authority: "EPSG" as const, code: "4326" as const },
              } as const);

        const patch = await createPatch(geometry, artifactRefs);

        const pinX =
          kind === "network-extension"
            ? (lng + (endLng as number)) / 2
            : lng;
        const pinY =
          kind === "network-extension"
            ? (lat + (endLat as number)) / 2
            : lat;

        if (artifactRefs.length > 0 || note.trim()) {
          await createEvidencePin(pinX, pinY, artifactRefs, patch.patch_id);
        }

        setMessage(
          `Η αλλαγή αποθηκεύτηκε ως spatial patch · ${patch.status || "pending_review"}. Δεν άλλαξε το master πριν από έγκριση.`,
        );
      }

      setClientMutationId(makeId());
      setProgress(100);
      setFile(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Η καταχώρηση απέτυχε.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 grid gap-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-950/20 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
          Spatial field change
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Η καταχώρηση αποθηκεύεται στο Pantavion με θέση, provenance και
          review status. Δεν γράφει απευθείας στο master δίκτυο.
        </p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-black text-[#f2c766]">Χάρτης / πηγή</span>
        <select
          value={sourceChoice}
          onChange={(event) => setSourceChoice(event.target.value as SourceChoice)}
          className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
        >
          <option value="map-a">Map A — Operational</option>
          <option value="map-b-canonical">Map B — Canonical DWG</option>
          <option value="map-c">Map C — Authentic DWG</option>
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-black text-[#f2c766]">Latitude</span>
          <input
            inputMode="decimal"
            value={latitude}
            onChange={(event) => {
              setLatitude(event.target.value);
              setUsedGps(false);
            }}
            placeholder="34.68..."
            className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-[#f2c766]">Longitude</span>
          <input
            inputMode="decimal"
            value={longitude}
            onChange={(event) => {
              setLongitude(event.target.value);
              setUsedGps(false);
            }}
            placeholder="33.04..."
            className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => captureCurrentPosition("start")}
        className="rounded-2xl border border-cyan-400/50 bg-cyan-950/30 px-4 py-3 font-black text-cyan-100"
      >
        📍 Χρήση θέσης κινητού
      </button>

      {kind === "network-extension" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">
                Τελικό latitude
              </span>
              <input
                inputMode="decimal"
                value={endLatitude}
                onChange={(event) => setEndLatitude(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">
                Τελικό longitude
              </span>
              <input
                inputMode="decimal"
                value={endLongitude}
                onChange={(event) => setEndLongitude(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => captureCurrentPosition("end")}
            className="rounded-2xl border border-cyan-400/50 bg-cyan-950/30 px-4 py-3 font-black text-cyan-100"
          >
            📍 Καταγραφή τελικού σημείου με GPS
          </button>
        </>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-black text-[#f2c766]">Οδός</span>
        <input
          value={streetName}
          onChange={(event) => setStreetName(event.target.value)}
          placeholder="Ονομασία οδού / σημείου"
          className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-[#f2c766]">
          Σημείωση / τι άλλαξε
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder="π.χ. νέα βάνα Φ100, νέο τμήμα HDPE, φωτογραφία αλλαγής…"
          className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
        />
      </label>

      {kind === "valve" || kind === "network-extension" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Υλικό</span>
            <input
              value={material}
              onChange={(event) => setMaterial(event.target.value)}
              placeholder="HDPE, UPVC, DI…"
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">
              Διάμετρος mm
            </span>
            <input
              inputMode="decimal"
              value={diameterMm}
              onChange={(event) => setDiameterMm(event.target.value)}
              placeholder="100"
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white"
            />
          </label>
        </div>
      ) : null}

      <div className="grid gap-3">
        <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="block text-sm font-black text-[#f2c766]">
            Φωτογραφία από κάμερα
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={busy}
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="mt-3 block w-full text-sm"
          />
        </label>

        <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="block text-sm font-black text-[#f2c766]">
            Ή οποιοδήποτε άλλο τεκμήριο
          </span>
          <input
            type="file"
            disabled={busy}
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="mt-3 block w-full text-sm"
          />
        </label>

        {file ? (
          <p className="text-xs font-bold text-cyan-200">
            {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        ) : null}
      </div>

      {progress > 0 ? (
        <div>
          <progress value={progress} max={100} className="h-4 w-full" />
          <p className="mt-1 text-xs font-black text-emerald-300">
            {progress.toFixed(1)}%
          </p>
        </div>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="rounded-2xl bg-[#f2c766] px-5 py-4 text-lg font-black text-black disabled:opacity-50"
      >
        {busy ? "Αποθήκευση…" : "Αποθήκευση στο Pantavion"}
      </button>

      {message ? (
        <p className="rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-4 text-sm font-black leading-6 text-[#f2c766]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
