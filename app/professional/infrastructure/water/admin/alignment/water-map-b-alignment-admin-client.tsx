"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SourceKey = "canonical-2026-andreaspap" | "legacy-george-85m";

type ControlPointDraft = {
  id: string;
  sourceX: string;
  sourceY: string;
  longitude: string;
  latitude: string;
  accuracyMeters: string;
  provenance: string;
};

type Alignment = {
  alignment_id: string;
  source_key: SourceKey;
  source_sha256: string;
  source_crs: string;
  target_crs: string;
  transform_name: string;
  transform_parameters?: Record<string, unknown>;
  rmse_meters: number;
  max_residual_meters: number;
  status: string;
  evidence_validated: boolean;
  overlay_allowed: boolean;
  control_points?: Array<Record<string, unknown>>;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  created_at: string;
};

function newPoint(index: number): ControlPointDraft {
  return {
    id: `cp-${index + 1}`,
    sourceX: "",
    sourceY: "",
    longitude: "",
    latitude: "",
    accuracyMeters: "",
    provenance: "",
  };
}

function formatNumber(value: number | null | undefined, digits = 3) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(digits);
}

function sourceLabel(sourceKey: SourceKey) {
  return sourceKey === "canonical-2026-andreaspap"
    ? "Map B Canonical — ANDREASPAP 2026"
    : "Map B Legacy — GEORGE 85 MB";
}

export default function WaterMapBAlignmentAdminClient() {
  const [sourceKey, setSourceKey] =
    useState<SourceKey>("canonical-2026-andreaspap");
  const [sourceCrs, setSourceCrs] = useState("LOCAL_CAD");
  const [targetCrs, setTargetCrs] = useState("EPSG:4326");
  const [points, setPoints] = useState<ControlPointDraft[]>([
    newPoint(0),
    newPoint(1),
    newPoint(2),
  ]);
  const [alignments, setAlignments] = useState<Alignment[]>([]);
  const [reviewNote, setReviewNote] = useState("");
  const [message, setMessage] = useState("Φόρτωση alignment evidence…");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const selectedAlignments = useMemo(
    () => alignments.filter((item) => item.source_key === sourceKey),
    [alignments, sourceKey],
  );

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/professional/infrastructure/water/maps/alignment",
        {
          cache: "no-store",
          credentials: "include",
        },
      );

      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        alignments?: Alignment[];
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error || "water_map_alignment_load_failed");
      }

      setAlignments(body.alignments || []);
      setMessage("Alignment evidence φορτώθηκε.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Δεν φορτώθηκε alignment evidence.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updatePoint(
    index: number,
    field: keyof ControlPointDraft,
    value: string,
  ) {
    setPoints((current) =>
      current.map((point, pointIndex) =>
        pointIndex === index ? { ...point, [field]: value } : point,
      ),
    );
  }

  function addPoint() {
    setPoints((current) => [...current, newPoint(current.length)]);
  }

  function removePoint(index: number) {
    setPoints((current) =>
      current.length <= 3
        ? current
        : current.filter((_, pointIndex) => pointIndex !== index),
    );
  }

  async function calculateAndSave() {
    setBusy(true);
    setMessage("Υπολογισμός affine transform και residuals από τον server…");

    try {
      const controlPoints = points.map((point, index) => {
        const sourceX = Number(point.sourceX);
        const sourceY = Number(point.sourceY);
        const longitude = Number(point.longitude);
        const latitude = Number(point.latitude);
        const accuracyMeters = point.accuracyMeters.trim()
          ? Number(point.accuracyMeters)
          : null;

        if (
          ![sourceX, sourceY, longitude, latitude].every(Number.isFinite) ||
          (accuracyMeters !== null &&
            (!Number.isFinite(accuracyMeters) || accuracyMeters < 0))
        ) {
          throw new Error(`Μη έγκυρες τιμές στο control point ${index + 1}.`);
        }

        if (!point.provenance.trim()) {
          throw new Error(
            `Χρειάζεται provenance στο control point ${index + 1}.`,
          );
        }

        return {
          id: point.id.trim() || `cp-${index + 1}`,
          sourceX,
          sourceY,
          longitude,
          latitude,
          accuracyMeters,
          provenance: point.provenance.trim(),
        };
      });

      const response = await fetch(
        "/api/professional/infrastructure/water/maps/alignment",
        {
          method: "POST",
          cache: "no-store",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sourceKey,
            sourceCrs: sourceCrs.trim(),
            targetCrs: targetCrs.trim(),
            transformName: "affine_2d_control_points_v1",
            controlPoints,
          }),
        },
      );

      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        validationErrors?: string[];
        alignment?: Alignment;
      };

      if (!response.ok || !body.ok || !body.alignment) {
        throw new Error(
          body.validationErrors?.join(", ") ||
            body.error ||
            "water_map_alignment_create_failed",
        );
      }

      await load();
      setMessage(
        `Alignment candidate αποθηκεύτηκε · RMSE ${formatNumber(
          body.alignment.rmse_meters,
        )} m · max residual ${formatNumber(
          body.alignment.max_residual_meters,
        )} m. Δεν επιτρέπεται geographic overlay πριν από review.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Alignment calculation failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function review(
    alignmentId: string,
    status: string,
    overlayAllowed: boolean,
  ) {
    setBusyId(alignmentId);
    setMessage("Αποθήκευση alignment review…");

    try {
      const response = await fetch(
        `/api/professional/infrastructure/water/maps/alignment/${encodeURIComponent(
          alignmentId,
        )}`,
        {
          method: "PATCH",
          cache: "no-store",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            status,
            overlayAllowed,
            reviewNote: reviewNote.trim() || null,
          }),
        },
      );

      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error || "alignment_review_failed");
      }

      setReviewNote("");
      await load();
      setMessage(
        overlayAllowed
          ? "Alignment εγκρίθηκε για geographic overlay."
          : "Alignment status ενημερώθηκε χωρίς geographic overlay.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-[#f2c766]/30 bg-[#0b1728] p-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f2c766]">
          Control-point georeferencing
        </p>
        <h1 className="mt-2 text-3xl font-black">Map B Alignment</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          Το Pantavion υπολογίζει μόνο του affine transform, RMSE και maximum
          residual. Τα metrics δεν δηλώνονται από τον χρήστη. Η έγκριση
          geographic overlay είναι ξεχωριστή governance απόφαση.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-xs font-black text-[#f2c766]">Source</span>
            <select
              value={sourceKey}
              onChange={(event) => setSourceKey(event.target.value as SourceKey)}
              className="rounded-xl border border-slate-700 bg-[#06101f] px-3 py-3"
            >
              <option value="canonical-2026-andreaspap">
                Canonical ANDREASPAP
              </option>
              <option value="legacy-george-85m">Legacy GEORGE 85 MB</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black text-[#f2c766]">
              Source CRS
            </span>
            <input
              value={sourceCrs}
              onChange={(event) => setSourceCrs(event.target.value)}
              placeholder="LOCAL_CAD ή EPSG:..."
              className="rounded-xl border border-slate-700 bg-[#06101f] px-3 py-3"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black text-[#f2c766]">
              Target CRS
            </span>
            <input
              value={targetCrs}
              onChange={(event) => setTargetCrs(event.target.value)}
              className="rounded-xl border border-slate-700 bg-[#06101f] px-3 py-3"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-3">
          {points.map((point, index) => (
            <div
              key={`${point.id}-${index}`}
              className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 xl:grid-cols-7"
            >
              <input
                value={point.id}
                onChange={(event) => updatePoint(index, "id", event.target.value)}
                placeholder="ID"
                className="rounded-lg border border-slate-700 bg-[#06101f] px-2 py-2"
              />
              <input
                inputMode="decimal"
                value={point.sourceX}
                onChange={(event) =>
                  updatePoint(index, "sourceX", event.target.value)
                }
                placeholder="CAD X"
                className="rounded-lg border border-slate-700 bg-[#06101f] px-2 py-2"
              />
              <input
                inputMode="decimal"
                value={point.sourceY}
                onChange={(event) =>
                  updatePoint(index, "sourceY", event.target.value)
                }
                placeholder="CAD Y"
                className="rounded-lg border border-slate-700 bg-[#06101f] px-2 py-2"
              />
              <input
                inputMode="decimal"
                value={point.longitude}
                onChange={(event) =>
                  updatePoint(index, "longitude", event.target.value)
                }
                placeholder="Longitude"
                className="rounded-lg border border-slate-700 bg-[#06101f] px-2 py-2"
              />
              <input
                inputMode="decimal"
                value={point.latitude}
                onChange={(event) =>
                  updatePoint(index, "latitude", event.target.value)
                }
                placeholder="Latitude"
                className="rounded-lg border border-slate-700 bg-[#06101f] px-2 py-2"
              />
              <input
                inputMode="decimal"
                value={point.accuracyMeters}
                onChange={(event) =>
                  updatePoint(index, "accuracyMeters", event.target.value)
                }
                placeholder="± m"
                className="rounded-lg border border-slate-700 bg-[#06101f] px-2 py-2"
              />
              <div className="flex gap-2">
                <input
                  value={point.provenance}
                  onChange={(event) =>
                    updatePoint(index, "provenance", event.target.value)
                  }
                  placeholder="π.χ. survey point / valve / road intersection"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#06101f] px-2 py-2"
                />
                <button
                  type="button"
                  disabled={points.length <= 3}
                  onClick={() => removePoint(index)}
                  className="rounded-lg border border-rose-500/40 px-2 text-xs font-black text-rose-200 disabled:opacity-30"
                >
                  −
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addPoint}
            className="rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-black text-cyan-200"
          >
            + Control point
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void calculateAndSave()}
            className="rounded-xl bg-[#f2c766] px-4 py-2 text-sm font-black text-black disabled:opacity-50"
          >
            {busy ? "Υπολογισμός…" : "Υπολογισμός & αποθήκευση"}
          </button>
        </div>

        <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-bold text-slate-300">
          {message}
        </p>
      </section>

      <section className="rounded-3xl border border-cyan-400/25 bg-cyan-950/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              Alignment evidence
            </p>
            <h2 className="mt-1 text-2xl font-black">
              {sourceLabel(sourceKey)}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-white/20 px-3 py-2 text-xs font-black"
          >
            Ανανέωση
          </button>
        </div>

        <label className="mt-4 grid gap-2">
          <span className="text-xs font-black text-cyan-200">
            Review note
          </span>
          <textarea
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            rows={3}
            className="rounded-xl border border-slate-700 bg-[#06101f] px-3 py-3"
            placeholder="Έλεγχος control points, πεδίου, survey ή άλλης τεκμηρίωσης…"
          />
        </label>

        <div className="mt-4 grid gap-4">
          {selectedAlignments.length === 0 ? (
            <p className="text-sm text-slate-400">
              Δεν υπάρχει alignment candidate για αυτή την πηγή.
            </p>
          ) : (
            selectedAlignments.map((alignment) => (
              <article
                key={alignment.alignment_id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-cyan-200">
                      {alignment.status} ·{" "}
                      {alignment.overlay_allowed
                        ? "OVERLAY ALLOWED"
                        : "OVERLAY BLOCKED"}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {alignment.source_crs} → {alignment.target_crs}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      RMSE: {formatNumber(alignment.rmse_meters)} m · max
                      residual: {formatNumber(alignment.max_residual_meters)} m
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {alignment.transform_name} · {alignment.alignment_id}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === alignment.alignment_id}
                      onClick={() =>
                        void review(
                          alignment.alignment_id,
                          "georeferenced",
                          true,
                        )
                      }
                      className="rounded-xl bg-emerald-300 px-3 py-2 text-xs font-black text-black disabled:opacity-50"
                    >
                      Georeferenced + overlay
                    </button>
                    <button
                      type="button"
                      disabled={busyId === alignment.alignment_id}
                      onClick={() =>
                        void review(
                          alignment.alignment_id,
                          "field_confirmed",
                          true,
                        )
                      }
                      className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-black disabled:opacity-50"
                    >
                      Field-confirmed + overlay
                    </button>
                    <button
                      type="button"
                      disabled={busyId === alignment.alignment_id}
                      onClick={() =>
                        void review(
                          alignment.alignment_id,
                          "manually_aligned",
                          false,
                        )
                      }
                      className="rounded-xl border border-amber-400/40 px-3 py-2 text-xs font-black text-amber-200 disabled:opacity-50"
                    >
                      Manual · no overlay
                    </button>
                    <button
                      type="button"
                      disabled={busyId === alignment.alignment_id}
                      onClick={() =>
                        void review(
                          alignment.alignment_id,
                          "approximate",
                          false,
                        )
                      }
                      className="rounded-xl border border-orange-400/40 px-3 py-2 text-xs font-black text-orange-200 disabled:opacity-50"
                    >
                      Approximate
                    </button>
                    <button
                      type="button"
                      disabled={busyId === alignment.alignment_id}
                      onClick={() =>
                        void review(alignment.alignment_id, "rejected", false)
                      }
                      className="rounded-xl border border-rose-400/40 px-3 py-2 text-xs font-black text-rose-200 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
