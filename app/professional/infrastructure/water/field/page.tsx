"use client";

import { useMemo, useState } from "react";

const DEVICE_ID_KEY = "pantavion.water.field.deviceId.v1";
const DEVICE_TOKEN_KEY = "pantavion.water.field.deviceToken.v1";

const SUBMISSION_TYPES = [
  { value: "note", label: "Σημείωση" },
  { value: "fault_report", label: "Αναφορά βλάβης" },
  { value: "possible_valve", label: "Πιθανή βάνα" },
  { value: "new_road", label: "Νέα οδός" },
  { value: "new_area", label: "Νέα περιοχή" },
  { value: "pipe_depth_observation", label: "Παρατήρηση βάθους σωλήνα" },
  { value: "pipe_material_observation", label: "Παρατήρηση υλικού σωλήνα" },
  { value: "underground_service_observation", label: "Άλλη υπόγεια υπηρεσία" },
  { value: "photo_reference", label: "Αναφορά φωτογραφίας" },
  { value: "voice_reference", label: "Αναφορά ηχητικού" },
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
  const [role, setRole] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [roadLabel, setRoadLabel] = useState("");
  const [zoneLabel, setZoneLabel] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [evidenceRefs, setEvidenceRefs] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTypeLabel = useMemo(() => {
    return SUBMISSION_TYPES.find((item) => item.value === type)?.label || "Σημείωση";
  }, [type]);

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { deviceId, deviceToken } = getOrCreateDeviceClaim();

    setLoading(true);
    setMessage("Αποστολή καταχώρησης προς Κέντρο Εγκρίσεων...");

    try {
      const response = await fetch("/api/professional/infrastructure/water/field/submission", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          type,
          title,
          description,
          submittedBy,
          contact,
          role,
          areaLabel,
          roadLabel,
          zoneLabel,
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
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

      setMessage(`Η καταχώρηση αποθηκεύτηκε private και περιμένει έγκριση. ID: ${json.submissionId}`);
      setTitle("");
      setDescription("");
      setEvidenceRefs("");
    } catch {
      setMessage("Δεν αποθηκεύτηκε η καταχώρηση. Έλεγξε τα υποχρεωτικά πεδία.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f2c766]">
          WATER FIELD ASSISTANT
        </p>

        <h1 className="mt-3 text-3xl font-black">Καταχώρηση πεδίου ύδρευσης</h1>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          Ο τεχνικός μπορεί να στείλει σημείωση, βλάβη, πιθανή βάνα, νέα οδό/περιοχή ή παρατήρηση σωλήνα.
          Όλα μένουν private και pending μέχρι έγκριση founder.
        </p>

        <form onSubmit={(event) => void submitForm(event)} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Τύπος καταχώρησης</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="rounded-2xl border border-[#b89445]/60 bg-[#07111f] px-4 py-3 text-white outline-none"
            >
              {SUBMISSION_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Τίτλος</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder={`${selectedTypeLabel} - σύντομος τίτλος`}
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
              placeholder="Τι παρατηρήθηκε; Πού είναι; Τι χρειάζεται έλεγχο;"
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Όνομα</span>
              <input
                value={submittedBy}
                onChange={(event) => setSubmittedBy(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Επικοινωνία</span>
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Ρόλος</span>
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Τεχνικός, εργολάβος, κάτοικος..."
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Latitude</span>
              <input
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                inputMode="decimal"
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">Longitude</span>
              <input
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                inputMode="decimal"
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">References φωτογραφίας/ηχητικού/PDF</span>
            <textarea
              value={evidenceRefs}
              onChange={(event) => setEvidenceRefs(event.target.value)}
              rows={3}
              placeholder="Προσωρινά refs/ονόματα αρχείων, ένα ανά γραμμή. Το πραγματικό upload αρχείων θα μπει στο επόμενο API."
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[#f2c766] px-5 py-4 font-black text-black disabled:opacity-60"
          >
            Αποστολή για έγκριση founder
          </button>

          {message ? (
            <p className="rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-4 text-sm font-bold text-[#f2c766]">
              {message}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}