"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type ApiResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  item?: Record<string, unknown>;
};

function valueText(value: unknown) {
  if (value === true) return "Ναι";
  if (value === false) return "Όχι";
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asList(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function dateText(value: unknown) {
  if (typeof value !== "string" || !value) return "—";

  try {
    return new Intl.DateTimeFormat("el-CY", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function WaterFaultDossierPage() {
  const params = useParams();
  const recordNumber = String(params?.recordNumber || "");

  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("Φόρτωση φακέλου βλάβης...");
  const [loading, setLoading] = useState(false);

  async function loadDossier() {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/professional/infrastructure/water/admin/faults/${encodeURIComponent(recordNumber)}`,
        {
          cache: "no-store",
          credentials: "include",
        },
      );

      const json = (await response.json()) as ApiResponse;

      if (!response.ok || !json.ok || !json.item) {
        throw new Error(json.message || json.error || "Δεν φορτώθηκε ο φάκελος.");
      }

      setItem(json.item);
      setMessage("Ο φάκελος φορτώθηκε από το private founder/admin approval inbox.");
    } catch (error) {
      setItem(null);
      setMessage(error instanceof Error ? error.message : "Δεν φορτώθηκε ο φάκελος.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (recordNumber) void loadDossier();
  }, [recordNumber]);

  const timestamps = asRecord(item?.timestamps);
  const location = asRecord(item?.location);
  const recordedBy = asRecord(item?.recordedBy);
  const assignedTo = asRecord(item?.assignedTo);
  const excavation = asRecord(item?.excavation);
  const audioTranscript = asRecord(item?.audioTranscript);
  const managementMetrics = asRecord(item?.managementMetrics);

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-7xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <Link href="/professional/infrastructure/water/admin/faults" className="text-sm font-black text-[#f2c766]">
          ← Πίσω στις pending βλάβες
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          PANTAVION WATER FAULT DOSSIER
        </p>

        <h1 className="mt-3 text-3xl font-black">Πλήρης φάκελος βλάβης</h1>

        <p className="mt-4 rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-4 text-sm font-black text-[#f2c766]">
          {message}
        </p>

        <button
          type="button"
          onClick={() => void loadDossier()}
          disabled={loading}
          className="mt-4 rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
        >
          Ανανέωση φακέλου
        </button>

        {item ? (
          <div className="mt-6 grid gap-5">
            <Section title="Βασικά στοιχεία">
              <Info title="Αύξων αριθμός" value={valueText(item.recordNumber)} />
              <Info title="Τίτλος" value={valueText(item.title)} />
              <Info title="Κατάσταση" value={valueText(item.status)} />
              <Info title="Approval" value={valueText(item.approvalState)} />
              <Info title="Προτεραιότητα" value={valueText(item.priority)} />
              <Info title="Τύπος" value={valueText(item.faultType)} />
              <Info title="Πηγή" value={valueText(item.source)} />
              <Info title="Κλειδωμένος" value={valueText(item.recordLocked)} />
            </Section>

            <TextBlock title="Περιγραφή" value={valueText(item.description)} />

            <Section title="Χρόνοι">
              <Info title="Καταχώρηση" value={dateText(timestamps.recordedAt)} />
              <Info title="Δόθηκε" value={dateText(timestamps.givenAt)} />
              <Info title="Ανάθεση" value={dateText(timestamps.assignedAt)} />
              <Info title="Άφιξη" value={dateText(timestamps.crewArrivedAt)} />
              <Info title="Αναχώρηση" value={dateText(timestamps.crewDepartedAt)} />
              <Info title="Ολοκλήρωση" value={dateText(timestamps.completedAt)} />
              <Info title="Παράδοση" value={dateText(timestamps.deliveredAt)} />
              <Info title="Έγκριση" value={dateText(timestamps.approvedAt)} />
            </Section>

            <Section title="Πρόσωπα / ευθύνη">
              <Info title="Καταχωρήθηκε από" value={`${valueText(recordedBy.name)} / ${valueText(recordedBy.role)}`} />
              <Info title="Ανατέθηκε σε" value={`${valueText(assignedTo.name)} / ${valueText(assignedTo.role)}`} />
              <Info title="Όνομα επαφής" value={valueText(item.contactName)} />
              <Info title="Τηλέφωνο" value={valueText(item.contactPhoneMasked || item.contactPhone)} />
            </Section>

            <Section title="Χάρτης / ζώνη / αγωγός / βάνα">
              <Info title="Περιοχή" value={valueText(location.areaLabel)} />
              <Info title="Οδός" value={valueText(location.roadLabel)} />
              <Info title="Ζώνη" value={valueText(location.zoneLabel)} />
              <Info title="Map status" value={valueText(location.mapLinkStatus)} />
              <Info title="Κοντινός αγωγός" value={valueText(location.nearestPipeLabel || location.nearestPipeId)} />
              <Info title="Κοντινή βάνα" value={valueText(location.nearestValveLabel || location.nearestValveId)} />
              <Info title="Ζώνη πίεσης" value={valueText(location.pressureZoneId)} />
              <Info title="Map path" value={valueText(location.mapPath)} />
            </Section>

            <Section title="Εργασία / υλικά / εκσκαφή">
              <Info title="Υλικά" value={`${asList(item.materials).length} εγγραφές`} />
              <Info title="Έγινε εκσκαφή" value={valueText(excavation.wasExcavationDone)} />
              <Info title="Είδος εκσκαφής" value={valueText(excavation.excavationType)} />
              <Info title="Διαστάσεις" value={valueText(excavation.dimensions)} />
              <Info title="Μηχάνημα" value={valueText(excavation.machineUsed || excavation.tractorUsed)} />
              <Info title="Εργολάβος" value={valueText(excavation.contractorName)} />
              <Info title="Τεκμήρια" value={`${asList(item.evidence).length} αρχεία`} />
              <Info title="Υπογραφές" value={`${asList(item.signatureEvents).length}`} />
            </Section>

            <Section title="AI / αναφορές">
              <Info title="AI checks" value={`${asList(item.aiChecks).length}`} />
              <Info title="Χρόνος απόκρισης" value={valueText(managementMetrics.responseMinutes)} />
              <Info title="Χρόνος αποκατάστασης" value={valueText(managementMetrics.repairMinutes)} />
              <Info title="Πιθανές απώλειες" value={valueText(managementMetrics.estimatedWaterLoss)} />
              <Info title="Κόστος" value={valueText(managementMetrics.estimatedCost)} />
              <Info title="Επαναλήψεις κοντά" value={valueText(managementMetrics.repeatedFaultCountNearby)} />
              <Info title="High risk" value={valueText(managementMetrics.highRiskArea)} />
              <Info title="Transcript" value={valueText(audioTranscript.transcriptStatus)} />
            </Section>

            <TextBlock title="Transcript text" value={valueText(audioTranscript.transcriptText)} />
            <JsonBlock title="AI ελλείψεις / προτάσεις" value={asList(item.aiChecks)} />
            <JsonBlock title="Ιστορικό επικοινωνίας" value={asList(item.communicationEvents)} />
            <JsonBlock title="Σημειώσεις / approval" value={[item.workerNotes, item.supervisorNotes, item.managementNotes, item.founderAdminNotes, item.approvalNotes]} />
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-slate-700 bg-[#07111f] p-5">
            <h2 className="text-xl font-black">Δεν εμφανίζεται φάκελος</h2>
            <p className="mt-2 text-sm font-bold text-slate-300">
              Αν υπάρχει φάκελος αλλά δεν εμφανίζεται, λείπει founder/admin session ή δεν έχει ρυθμιστεί σωστά το Vercel secret.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-700 bg-[#07111f] p-4">
      <h2 className="text-xl font-black text-[#f2c766]">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-[#0d1a2d] p-3">
      <p className="text-xs font-black text-[#f2c766]">{title}</p>
      <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function TextBlock({ title, value }: { title: string; value: string }) {
  return (
    <section className="rounded-3xl border border-slate-700 bg-[#07111f] p-4">
      <h2 className="text-xl font-black text-[#f2c766]">{title}</h2>
      <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl border border-slate-700 bg-[#0d1a2d] p-3 text-sm font-bold text-slate-200">
        {value}
      </pre>
    </section>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="rounded-3xl border border-slate-700 bg-[#07111f] p-4">
      <h2 className="text-xl font-black text-[#f2c766]">{title}</h2>
      <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl border border-slate-700 bg-[#0d1a2d] p-3 text-sm font-bold text-slate-200">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}