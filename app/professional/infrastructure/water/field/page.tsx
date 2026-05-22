"use client";

import { useMemo, useState } from "react";

const DEVICE_ID_KEY = "pantavion.water.field.deviceId.v1";
const DEVICE_TOKEN_KEY = "pantavion.water.field.deviceToken.v1";

const ACTIONS = [
  { value: "note", label: "Σημείωση" },
  { value: "fault_report", label: "Νέα βλάβη" },
  { value: "possible_valve", label: "Πιθανή βάνα" },
  { value: "new_road", label: "Νέα οδός" },
  { value: "new_area", label: "Νέα περιοχή" },
  { value: "pipe_depth_observation", label: "Βάθος σωλήνα" },
  { value: "pipe_material_observation", label: "Υλικό σωλήνα" },
  { value: "underground_service_observation", label: "Άλλη υπόγεια υπηρεσία" },
  { value: "photo_reference", label: "Φωτογραφία" },
  { value: "voice_reference", label: "Ηχητική σημείωση" },
] as const;

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `water-field-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateDeviceClaim() {
  if (typeof window === "undefined") {
    return { deviceId: "", deviceToken: "" };
  }

  let deviceId = window.localStorage.getItem(DEVICE_ID_KEY) || "";
  let deviceToken = window.localStorage.getItem(DEVICE_TOKEN_KEY) || "";

  if (!deviceId) {
    deviceId = makeId();
    window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  if (!deviceToken) {
    deviceToken = makeId();
    window.localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);
  }

  return { deviceId, deviceToken };
}

export default function WaterFieldSubmissionPage() {
  const [type, setType] = useState("note");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [contact, setContact] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [roadLabel, setRoadLabel] = useState("");
  const [zoneLabel, setZoneLabel] = useState("");
  const [materials, setMaterials] = useState("");
  const [evidenceRefs, setEvidenceRefs] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedLabel = useMemo(() => {
    return ACTIONS.find((item) => item.value === type)?.label || "Σημείωση";
  }, [type]);

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { deviceId, deviceToken } = getOrCreateDeviceClaim();

    setLoading(true);
    setMessage("Αποστολή...");

    try {
      const response = await fetch("/api/professional/infrastructure/water/field/submission", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          type,
          title: title || selectedLabel,
          description: [
            description,
            materials ? `Υλικά: ${materials}` : "",
          ].filter(Boolean).join("\n\n"),
          submittedBy,
          contact,
          role: "field_worker",
          areaLabel,
          roadLabel,
          zoneLabel,
          evidenceRefs: evidenceRefs
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          deviceId,
          deviceToken,
          deviceLabel: "Pantavion Water Field Browser",
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        submissionId?: string;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "submission_failed");
      }

      setMessage("Στάλθηκε για έλεγχο.");
      setTitle("");
      setDescription("");
      setMaterials("");
      setEvidenceRefs("");
    } catch {
      setMessage("Δεν στάλθηκε. Έλεγξε τίτλο και περιγραφή.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          PANTAVION ΥΔΡΕΥΣΗ
        </p>

        <h1 className="mt-3 text-3xl font-black">Εργασία πεδίου</h1>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setType("note");
              setTitle("Άφιξη");
              setDescription("Άφιξη στο σημείο εργασίας.");
            }}
            className="rounded-2xl border border-emerald-400/50 bg-emerald-950/30 px-5 py-4 text-left text-lg font-black text-emerald-100"
          >
            Άφιξη
          </button>

          <button
            type="button"
            onClick={() => {
              setType("note");
              setTitle("Αναχώρηση");
              setDescription("Αναχώρηση από το σημείο εργασίας.");
            }}
            className="rounded-2xl border border-sky-400/50 bg-sky-950/30 px-5 py-4 text-left text-lg font-black text-sky-100"
          >
            Αναχώρηση
          </button>

          {ACTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setType(item.value);
                setTitle(item.label);
              }}
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-5 py-4 text-left text-lg font-black text-white"
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={(event) => void submitForm(event)} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Τίτλος</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Περιγραφή</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={5}
              placeholder="Γράψε τι έγινε ή τι παρατηρήθηκε."
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Όνομα</span>
              <input
                value={submittedBy}
                onChange={(event) => setSubmittedBy(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Τηλέφωνο</span>
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Περιοχή</span>
              <input
                value={areaLabel}
                onChange={(event) => setAreaLabel(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Οδός</span>
              <input
                value={roadLabel}
                onChange={(event) => setRoadLabel(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Ζώνη</span>
              <input
                value={zoneLabel}
                onChange={(event) => setZoneLabel(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Υλικά</span>
            <textarea
              value={materials}
              onChange={(event) => setMaterials(event.target.value)}
              rows={3}
              placeholder="Σωλήνες, εξαρτήματα, βάνα, μούφα, κολάρο..."
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Φωτογραφίες / ηχητικά / PDF</span>
            <textarea
              value={evidenceRefs}
              onChange={(event) => setEvidenceRefs(event.target.value)}
              rows={3}
              placeholder="Προσωρινά γράψε όνομα αρχείου ή σημείωση. Το upload θα μπει στο επόμενο βήμα."
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[#f2c766] px-5 py-4 text-lg font-black text-black disabled:opacity-60"
          >
            Αποστολή
          </button>

          {message ? (
            <p className="rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-4 text-sm font-black text-[#f2c766]">
              {message}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}