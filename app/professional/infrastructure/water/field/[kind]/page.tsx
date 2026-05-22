"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const DEVICE_ID_KEY = "pantavion.water.field.deviceId.v1";
const DEVICE_TOKEN_KEY = "pantavion.water.field.deviceToken.v1";

type FieldActionConfig = {
  route: string;
  type: string;
  title: string;
  heading: string;
  descriptionPlaceholder: string;
  defaultDescription?: string;
  showMaterials?: boolean;
  evidenceLabel?: string;
  evidencePlaceholder?: string;
};

const ACTIONS: FieldActionConfig[] = [
  {
    route: "arrival",
    type: "note",
    title: "Άφιξη",
    heading: "Άφιξη στο σημείο",
    descriptionPlaceholder: "Γράψε σημείο άφιξης ή σύντομη παρατήρηση.",
    defaultDescription: "Άφιξη στο σημείο εργασίας.",
  },
  {
    route: "departure",
    type: "note",
    title: "Αναχώρηση",
    heading: "Αναχώρηση από το σημείο",
    descriptionPlaceholder: "Γράψε αν ολοκληρώθηκε η εργασία ή τι μένει.",
    defaultDescription: "Αναχώρηση από το σημείο εργασίας.",
  },
  {
    route: "fault",
    type: "fault_report",
    title: "Νέα βλάβη",
    heading: "Καταχώρηση βλάβης",
    descriptionPlaceholder: "Περιέγραψε τη βλάβη, το σημείο και τι χρειάζεται.",
    showMaterials: true,
  },
  {
    route: "valve",
    type: "possible_valve",
    title: "Πιθανή βάνα",
    heading: "Καταχώρηση πιθανής βάνας",
    descriptionPlaceholder: "Περιέγραψε πού βρίσκεται η πιθανή βάνα και τι παρατηρήθηκε.",
  },
  {
    route: "photo",
    type: "photo_reference",
    title: "Φωτογραφία",
    heading: "Καταχώρηση φωτογραφίας",
    descriptionPlaceholder: "Γράψε τι δείχνει η φωτογραφία.",
    evidenceLabel: "Φωτογραφία / όνομα αρχείου",
    evidencePlaceholder: "Γράψε προσωρινά όνομα φωτογραφίας. Το πραγματικό upload αρχείου θα μπει στο επόμενο βήμα.",
  },
  {
    route: "audio",
    type: "voice_reference",
    title: "Ηχητική σημείωση",
    heading: "Καταχώρηση ηχητικής σημείωσης",
    descriptionPlaceholder: "Γράψε σύντομη περίληψη του ηχητικού.",
    evidenceLabel: "Ηχητικό / όνομα αρχείου",
    evidencePlaceholder: "Γράψε προσωρινά όνομα ηχητικού. Το πραγματικό upload αρχείου θα μπει στο επόμενο βήμα.",
  },
  {
    route: "material",
    type: "pipe_material_observation",
    title: "Υλικά",
    heading: "Καταχώρηση υλικών",
    descriptionPlaceholder: "Γράψε τι υλικά χρησιμοποιήθηκαν ή χρειάζονται.",
    showMaterials: true,
  },
  {
    route: "note",
    type: "note",
    title: "Παρατήρηση",
    heading: "Καταχώρηση παρατήρησης",
    descriptionPlaceholder: "Γράψε απλή παρατήρηση πεδίου.",
  },
];

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

function UnknownFieldActionPage() {
  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <Link href="/professional/infrastructure/water/field" className="text-sm font-black text-[#f2c766]">
          ← Πίσω στις εργασίες
        </Link>

        <h1 className="mt-6 text-3xl font-black">Άγνωστη εργασία</h1>

        <p className="mt-3 text-sm font-bold text-slate-300">
          Η επιλογή δεν βρέθηκε. Γύρισε στην οθόνη εργασίας πεδίου.
        </p>
      </section>
    </main>
  );
}

export default function WaterFieldActionPage() {
  const params = useParams<{ kind?: string | string[] }>();
  const kind = Array.isArray(params.kind) ? params.kind[0] : params.kind || "";
  const config = ACTIONS.find((item) => item.route === kind);

  if (!config) {
    return <UnknownFieldActionPage />;
  }

  return <WaterFieldActionForm key={config.route} config={config} />;
}

function WaterFieldActionForm({ config }: { config: FieldActionConfig }) {
  const [title, setTitle] = useState(config.title);
  const [description, setDescription] = useState(config.defaultDescription || "");
  const [submittedBy, setSubmittedBy] = useState("");
  const [contact, setContact] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [roadLabel, setRoadLabel] = useState("");
  const [zoneLabel, setZoneLabel] = useState("");
  const [materials, setMaterials] = useState("");
  const [evidenceRefs, setEvidenceRefs] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
          type: config.type,
          title,
          description: [description, materials ? `Υλικά: ${materials}` : ""].filter(Boolean).join("\n\n"),
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
      setTitle(config.title);
      setDescription(config.defaultDescription || "");
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
        <Link href="/professional/infrastructure/water/field" className="text-sm font-black text-[#f2c766]">
          ← Πίσω στις εργασίες
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          PANTAVION ΥΔΡΕΥΣΗ
        </p>

        <h1 className="mt-3 text-3xl font-black">{config.heading}</h1>

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
              placeholder={config.descriptionPlaceholder}
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

          {config.showMaterials ? (
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
          ) : null}

          {config.evidenceLabel ? (
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#f2c766]">{config.evidenceLabel}</span>
              <textarea
                value={evidenceRefs}
                onChange={(event) => setEvidenceRefs(event.target.value)}
                rows={3}
                placeholder={config.evidencePlaceholder}
                className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
              />
            </label>
          ) : null}

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