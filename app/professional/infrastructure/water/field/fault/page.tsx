"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const DEVICE_ID_KEY = "pantavion.water.field.deviceId.v1";
const DEVICE_TOKEN_KEY = "pantavion.water.field.deviceToken.v1";

const FAULT_TYPES = [
  { value: "fault", label: "Βλάβη" },
  { value: "leak", label: "Διαρροή" },
  { value: "broken_pipe", label: "Σπασμένος σωλήνας" },
  { value: "possible_valve", label: "Πιθανή βάνα" },
  { value: "no_water", label: "Χωρίς νερό" },
  { value: "pressure_problem", label: "Πρόβλημα πίεσης" },
  { value: "quality_problem", label: "Πρόβλημα ποιότητας" },
  { value: "other", label: "Άλλο" },
] as const;

const SOURCES = [
  { value: "field", label: "Επί τόπου" },
  { value: "phone", label: "Τηλέφωνο" },
  { value: "audio", label: "Ηχητικό" },
  { value: "photo", label: "Φωτογραφία" },
  { value: "pdf", label: "PDF" },
  { value: "scanner", label: "Scanner" },
  { value: "map", label: "Χάρτης" },
  { value: "email", label: "Email" },
  { value: "fax", label: "Fax" },
  { value: "other", label: "Άλλο" },
] as const;

const PRIORITIES = [
  { value: "normal", label: "Κανονική" },
  { value: "urgent", label: "Επείγουσα" },
  { value: "critical", label: "Κρίσιμη" },
] as const;

function makeLocalId() {
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureDevice() {
  if (typeof window === "undefined") return { deviceId: "", deviceToken: "" };

  let deviceId = window.localStorage.getItem(DEVICE_ID_KEY) || "";
  let deviceToken = window.localStorage.getItem(DEVICE_TOKEN_KEY) || "";

  if (!deviceId) {
    deviceId = makeLocalId();
    window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  if (!deviceToken) {
    deviceToken = makeLocalId();
    window.localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);
  }

  return { deviceId, deviceToken };
}

type FaultResponse = {
  ok?: boolean;
  recordNumber?: string;
  status?: string;
  approvalState?: string;
  aiMissingCount?: number;
  mapLinkStatus?: string;
  message?: string;
  error?: string;
  aiChecks?: Array<{
    id: string;
    severity: string;
    message: string;
    suggestedAction: string;
  }>;
};

export default function FieldFaultPage() {
  const [faultType, setFaultType] = useState("fault");
  const [source, setSource] = useState("field");
  const [priority, setPriority] = useState("normal");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [roadLabel, setRoadLabel] = useState("");
  const [zoneLabel, setZoneLabel] = useState("");

  const [recordedByName, setRecordedByName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FaultResponse | null>(null);

  const guide = useMemo(() => {
    if (source === "audio") {
      return "Μίλα ή γράψε το κείμενο του ηχητικού. Το αρχικό ηχητικό θα κρατηθεί ως τεκμήριο όταν συνδεθεί upload/transcription.";
    }

    if (source === "phone") {
      return "Καταχώρηση από τηλεφωνική αναφορά: γράψε τι είπε ο πολίτης/υπηρεσία και βάλε τηλέφωνο αν δόθηκε.";
    }

    return "Γρήγορη καταχώρηση: λίγα πεδία τώρα, έλεγχος και συμπλήρωση από επιστάτη μετά.";
  }, [source]);

  async function submitFault(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const device = ensureDevice();

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/professional/infrastructure/water/field/fault", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          faultType,
          source,
          priority,
          title,
          description,
          areaLabel,
          roadLabel,
          zoneLabel,
          recordedByName,
          recordedByRole: "worker",
          contactPhone,
          transcriptText,
          note,
          deviceId: device.deviceId,
          deviceToken: device.deviceToken,
        }),
      });

      const json = (await response.json()) as FaultResponse;

      setResult(json);
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Δεν έγινε καταχώρηση.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <Link href="/professional/infrastructure/water" className="text-sm font-black text-[#f2c766]">
          ← Πίσω στην Ύδρευση
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          PANTAVION FIELD QUICK CAPTURE
        </p>

        <h1 className="mt-3 text-3xl font-black">Γρήγορη καταχώρηση βλάβης</h1>

        <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
          Ο εργάτης ή το τηλεφωνικό κέντρο καταχωρεί γρήγορα. Το Pantavion δημιουργεί φάκελο με
          αύξον αριθμό, ώρα, πηγή, συσκευή, κατάσταση pending approval και AI έλεγχο ελλείψεων.
        </p>

        <form onSubmit={(event) => void submitFault(event)} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldLabel title="Τύπος">
              <select
                value={faultType}
                onChange={(event) => setFaultType(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              >
                {FAULT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel title="Πηγή">
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              >
                {SOURCES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel title="Προτεραιότητα">
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              >
                {PRIORITIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>

          <p className="rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-4 text-sm font-black leading-6 text-[#f2c766]">
            {guide}
          </p>

          <FieldLabel title="1. Τι συνέβη;">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="π.χ. Διαρροή / σπασμένος σωλήνας / χωρίς νερό"
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </FieldLabel>

          <FieldLabel title="Περιγραφή ή γρήγορη σημείωση">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Γράψε απλά τι βλέπεις ή τι αναφέρθηκε."
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </FieldLabel>

          <div className="grid gap-4 sm:grid-cols-3">
            <FieldLabel title="2. Περιοχή">
              <input
                value={areaLabel}
                onChange={(event) => setAreaLabel(event.target.value)}
                placeholder="π.χ. Λάρνακα"
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </FieldLabel>

            <FieldLabel title="Οδός">
              <input
                value={roadLabel}
                onChange={(event) => setRoadLabel(event.target.value)}
                placeholder="π.χ. Αρχ. Μακαρίου"
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </FieldLabel>

            <FieldLabel title="Ζώνη">
              <input
                value={zoneLabel}
                onChange={(event) => setZoneLabel(event.target.value)}
                placeholder="αν είναι γνωστή"
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </FieldLabel>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel title="Καταχωρήθηκε από">
              <input
                value={recordedByName}
                onChange={(event) => setRecordedByName(event.target.value)}
                placeholder="όνομα εργάτη / τηλεφωνητή"
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </FieldLabel>

            <FieldLabel title="Τηλέφωνο επικοινωνίας">
              <input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="αν υπάρχει"
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </FieldLabel>
          </div>

          <FieldLabel title="3. Ηχητικό / μεταγραφή / σημείωση">
            <textarea
              value={transcriptText}
              onChange={(event) => setTranscriptText(event.target.value)}
              rows={3}
              placeholder="Προσωρινά γράψε εδώ τη μεταγραφή ή το κείμενο από ηχητικό. Το πραγματικό upload/transcription θα μπει σε επόμενο βήμα."
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </FieldLabel>

          <FieldLabel title="Σημείωση εργάτη / τηλεφωνικού κέντρου">
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="π.χ. χρειάζεται άμεσος έλεγχος / ο δρόμος έχει νερά / πολίτης περιμένει"
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </FieldLabel>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[#f2c766] px-5 py-4 text-lg font-black text-black disabled:opacity-60"
          >
            {loading ? "Καταχώρηση..." : "4. Αποστολή για pending approval"}
          </button>
        </form>

        {result ? (
          <section className="mt-6 rounded-3xl border border-slate-700 bg-[#07111f] p-4">
            <h2 className="text-xl font-black">
              {result.ok ? "Η βλάβη καταχωρήθηκε" : "Δεν έγινε καταχώρηση"}
            </h2>

            <p className="mt-2 text-sm font-bold text-slate-300">
              {result.message || result.error}
            </p>

            {result.recordNumber ? (
              <p className="mt-4 rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-4 text-sm font-black text-[#f2c766]">
                Αύξων αριθμός: {result.recordNumber} · Κατάσταση: {result.status} · AI ελλείψεις:{" "}
                {result.aiMissingCount}
              </p>
            ) : null}

            {result.aiChecks?.length ? (
              <div className="mt-4 grid gap-3">
                {result.aiChecks.map((check) => (
                  <div key={check.id} className="rounded-2xl border border-slate-700 bg-[#0d1a2d] p-3">
                    <p className="text-sm font-black text-[#f2c766]">{check.message}</p>
                    <p className="mt-1 text-sm font-bold text-slate-300">{check.suggestedAction}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function FieldLabel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#f2c766]">{title}</span>
      {children}
    </label>
  );
}
