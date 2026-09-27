"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Patch = {
  patch_id: string;
  asset_type: string;
  operation: string;
  status: string;
  map_id: string;
  source_key: string | null;
  geometry_type: string;
  geometry: unknown;
  street_name: string | null;
  accuracy_state: string;
  accuracy_meters: number | null;
  attributes: Record<string, unknown> | null;
  artifact_refs: string[] | null;
  created_by: string;
  created_at: string;
};

type Pin = {
  pin_id: string;
  review_state: string;
  map_id: string;
  source_key: string | null;
  x: number;
  y: number;
  street_name: string | null;
  note: string | null;
  artifact_refs: string[] | null;
  ai_observation: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
};

type PatchResponse = {
  ok?: boolean;
  error?: string;
  patches?: Patch[];
};

type PinResponse = {
  ok?: boolean;
  error?: string;
  pins?: Pin[];
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("el-CY", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function artifactRequestId(ref: string) {
  const prefix = "water-field-artifact:";
  return ref.startsWith(prefix) ? ref.slice(prefix.length) : null;
}

export default function WaterChangeReviewClient() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [message, setMessage] = useState("Φόρτωση pending αλλαγών…");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const load = useCallback(async () => {
    try {
      const [patchResponse, pinResponse] = await Promise.all([
        fetch("/api/professional/infrastructure/water/changes/patches?limit=300", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(
          "/api/professional/infrastructure/water/changes/evidence-pins?limit=300",
          {
            cache: "no-store",
            credentials: "include",
          },
        ),
      ]);

      const patchBody = (await patchResponse.json()) as PatchResponse;
      const pinBody = (await pinResponse.json()) as PinResponse;

      if (!patchResponse.ok || !patchBody.ok) {
        throw new Error(patchBody.error || "patch_load_failed");
      }
      if (!pinResponse.ok || !pinBody.ok) {
        throw new Error(pinBody.error || "pin_load_failed");
      }

      setPatches(patchBody.patches || []);
      setPins(pinBody.pins || []);
      setMessage("Η λίστα ενημερώθηκε.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Δεν φορτώθηκαν οι αλλαγές.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingPatches = useMemo(
    () =>
      patches.filter((patch) =>
        ["local_only", "pending_review", "conflict"].includes(patch.status),
      ),
    [patches],
  );

  const pendingPins = useMemo(
    () => pins.filter((pin) => pin.review_state === "pending"),
    [pins],
  );

  async function reviewPatch(patchId: string, status: string) {
    setBusyId(patchId);
    setMessage("Αποθήκευση απόφασης…");

    try {
      const response = await fetch(
        `/api/professional/infrastructure/water/changes/patches/${encodeURIComponent(
          patchId,
        )}`,
        {
          method: "PATCH",
          credentials: "include",
          cache: "no-store",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            status,
            decisionNote: decisionNote.trim() || null,
          }),
        },
      );

      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error || "patch_review_failed");
      }

      setDecisionNote("");
      await load();
      setMessage("Η αλλαγή ενημερώθηκε με audit history.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function reviewPin(pinId: string, reviewState: string) {
    setBusyId(pinId);
    setMessage("Αποθήκευση απόφασης evidence…");

    try {
      const response = await fetch(
        `/api/professional/infrastructure/water/changes/evidence-pins/${encodeURIComponent(
          pinId,
        )}`,
        {
          method: "PATCH",
          credentials: "include",
          cache: "no-store",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            reviewState,
            decisionNote: decisionNote.trim() || null,
          }),
        },
      );

      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error || "pin_review_failed");
      }

      setDecisionNote("");
      await load();
      setMessage("Το evidence ενημερώθηκε με audit history.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function openArtifact(ref: string) {
    const requestId = artifactRequestId(ref);
    if (!requestId) {
      setMessage("Το artifact reference δεν είναι field-evidence request.");
      return;
    }

    setMessage("Δημιουργία προσωρινού private link…");

    try {
      const response = await fetch(
        `/api/professional/infrastructure/water/field/evidence-upload/${encodeURIComponent(
          requestId,
        )}`,
        {
          cache: "no-store",
          credentials: "include",
        },
      );

      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        signedUrl?: string;
      };

      if (!response.ok || !body.ok || !body.signedUrl) {
        throw new Error(body.error || "artifact_access_failed");
      }

      window.open(body.signedUrl, "_blank", "noopener,noreferrer");
      setMessage("Άνοιξε προσωρινό private evidence link.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Artifact access failed.",
      );
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-[#f2c766]/30 bg-[#0b1728] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f2c766]">
              Governance review
            </p>
            <h1 className="mt-2 text-3xl font-black">Field Changes & Evidence</h1>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-black"
          >
            Ανανέωση
          </button>
        </div>

        <label className="mt-5 grid gap-2">
          <span className="text-sm font-black text-[#f2c766]">
            Σημείωση απόφασης
          </span>
          <textarea
            value={decisionNote}
            onChange={(event) => setDecisionNote(event.target.value)}
            rows={3}
            placeholder="Γιατί εγκρίνεται / απορρίπτεται / χρειάζεται επανέλεγχο…"
            className="rounded-2xl border border-slate-700 bg-[#06101f] px-4 py-3 text-white"
          />
        </label>

        <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-bold text-slate-300">
          {message}
        </p>
      </section>

      <section className="rounded-3xl border border-emerald-400/25 bg-emerald-950/10 p-5">
        <h2 className="text-2xl font-black">
          Spatial patches · {pendingPatches.length}
        </h2>

        <div className="mt-4 grid gap-4">
          {pendingPatches.length === 0 ? (
            <p className="text-sm text-slate-400">Δεν υπάρχουν pending patches.</p>
          ) : (
            pendingPatches.map((patch) => (
              <article
                key={patch.patch_id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-emerald-300">
                      {patch.asset_type} · {patch.operation} · {patch.status}
                    </p>
                    <h3 className="mt-1 text-lg font-black">
                      {patch.street_name || "Χωρίς οδό"} · {patch.map_id}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(patch.created_at)} · {patch.created_by}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === patch.patch_id}
                      onClick={() =>
                        void reviewPatch(patch.patch_id, "approved_overlay")
                      }
                      className="rounded-xl bg-emerald-300 px-3 py-2 text-xs font-black text-black disabled:opacity-50"
                    >
                      Έγκριση overlay
                    </button>
                    <button
                      type="button"
                      disabled={busyId === patch.patch_id}
                      onClick={() => void reviewPatch(patch.patch_id, "rejected")}
                      className="rounded-xl border border-rose-400/50 px-3 py-2 text-xs font-black text-rose-200 disabled:opacity-50"
                    >
                      Απόρριψη
                    </button>
                  </div>
                </div>

                <pre className="mt-3 max-h-44 overflow-auto rounded-xl bg-[#06101f] p-3 text-xs text-slate-300">
                  {JSON.stringify(
                    {
                      geometryType: patch.geometry_type,
                      geometry: patch.geometry,
                      accuracy: {
                        state: patch.accuracy_state,
                        meters: patch.accuracy_meters,
                      },
                      attributes: patch.attributes,
                    },
                    null,
                    2,
                  )}
                </pre>

                {patch.artifact_refs?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {patch.artifact_refs.map((ref) => (
                      <button
                        key={ref}
                        type="button"
                        onClick={() => void openArtifact(ref)}
                        className="rounded-xl border border-cyan-400/40 px-3 py-2 text-xs font-black text-cyan-200"
                      >
                        Άνοιγμα τεκμηρίου
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-400/25 bg-cyan-950/10 p-5">
        <h2 className="text-2xl font-black">
          Evidence pins · {pendingPins.length}
        </h2>

        <div className="mt-4 grid gap-4">
          {pendingPins.length === 0 ? (
            <p className="text-sm text-slate-400">Δεν υπάρχουν pending pins.</p>
          ) : (
            pendingPins.map((pin) => (
              <article
                key={pin.pin_id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-cyan-300">
                      {pin.review_state} · {pin.map_id}
                    </p>
                    <h3 className="mt-1 text-lg font-black">
                      {pin.street_name || "Χωρίς οδό"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">
                      {pin.note || "Χωρίς σημείωση"}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {pin.y.toFixed(7)}, {pin.x.toFixed(7)} ·{" "}
                      {formatDate(pin.created_at)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === pin.pin_id}
                      onClick={() => void reviewPin(pin.pin_id, "approved")}
                      className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-black disabled:opacity-50"
                    >
                      Έγκριση pin
                    </button>
                    <button
                      type="button"
                      disabled={busyId === pin.pin_id}
                      onClick={() => void reviewPin(pin.pin_id, "rejected")}
                      className="rounded-xl border border-rose-400/50 px-3 py-2 text-xs font-black text-rose-200 disabled:opacity-50"
                    >
                      Απόρριψη
                    </button>
                  </div>
                </div>

                {pin.artifact_refs?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pin.artifact_refs.map((ref) => (
                      <button
                        key={ref}
                        type="button"
                        onClick={() => void openArtifact(ref)}
                        className="rounded-xl border border-cyan-400/40 px-3 py-2 text-xs font-black text-cyan-200"
                      >
                        Άνοιγμα φωτογραφίας / αρχείου
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
