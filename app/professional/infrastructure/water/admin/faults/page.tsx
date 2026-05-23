"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdminFaultItem = {
  recordNumber: string;
  status: string;
  priority: string;
  faultType: string;
  title: string;
  description: string;
  source: string;
  recordedAt: string;
  recordedByName: string;
  recordedByRole: string;
  contactName: string;
  contactPhoneMasked: string;
  areaLabel: string;
  roadLabel: string;
  zoneLabel: string;
  mapPath: string;
  mapLinkStatus: string;
  nearestPipeLabel: string;
  nearestValveLabel: string;
  pressureZoneId: string;
  approvalState: string;
  aiMissingCount: number;
  aiCriticalCount: number;
  evidenceCount: number;
  transcriptStatus: string;
  deliveryTargetLabel: string;
  nextStep: string;
  recordLocked: boolean;
  aiChecks: Array<{
    id: string;
    severity: string;
    category: string;
    message: string;
    suggestedAction: string;
  }>;
};

type AdminFaultsResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  count?: number;
  items?: AdminFaultItem[];
  source?: string;
  generatedAt?: string;
};

function label(value: string | number | boolean | undefined) {
  if (value === true) return "Ναι";
  if (value === false) return "Όχι";

  return value === undefined || value === "" ? "—" : String(value);
}

function dateLabel(value: string) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("el-CY", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function WaterAdminFaultsPage() {
  const [items, setItems] = useState<AdminFaultItem[]>([]);
  const [message, setMessage] = useState("Φόρτωση pending βλαβών...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadFaults();
  }, []);

  async function loadFaults() {
    setLoading(true);
    setMessage("Φόρτωση pending βλαβών...");

    try {
      const response = await fetch("/api/professional/infrastructure/water/admin/faults", {
        cache: "no-store",
        credentials: "include",
      });

      const json = (await response.json()) as AdminFaultsResponse;

      if (!response.ok || !json.ok) {
        throw new Error(json.message || json.error || "Δεν φορτώθηκαν οι βλάβες.");
      }

      setItems(json.items || []);
      setMessage(`Βρέθηκαν ${json.count || 0} pending βλάβες στο founder/admin approval inbox.`);
    } catch (error) {
      setItems([]);
      setMessage(error instanceof Error ? error.message : "Δεν φορτώθηκαν οι βλάβες.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-7xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <Link href="/professional/infrastructure/water" className="text-sm font-black text-[#f2c766]">
          ← Πίσω στην Ύδρευση
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          PANTAVION WATER ADMIN FAULTS
        </p>

        <h1 className="mt-3 text-3xl font-black">Pending βλάβες προς έγκριση</h1>

        <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
          Εδώ θα βλέπει ο founder/admin τις γρήγορες καταχωρήσεις βλαβών που στάλθηκαν για έλεγχο.
          Η προβολή είναι προστατευμένη: χωρίς πραγματικό founder/admin session δεν εμφανίζονται ιδιωτικές βλάβες.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadFaults()}
            disabled={loading}
            className="rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
          >
            Ανανέωση pending βλαβών
          </button>

          <Link
            href="/professional/infrastructure/water/field/fault"
            className="rounded-2xl border border-slate-700 bg-[#07111f] px-5 py-3 font-black text-white"
          >
            Νέα γρήγορη καταχώρηση
          </Link>
        </div>

        <p className="mt-5 rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-4 text-sm font-black leading-6 text-[#f2c766]">
          {message}
        </p>

        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <article key={item.recordNumber} className="rounded-3xl border border-slate-700 bg-[#07111f] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2c766]">
                    {label(item.recordNumber)}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">{label(item.title)}</h2>
                  <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-300">
                    {label(item.description)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-3 text-sm font-black text-[#f2c766]">
                  AI ελλείψεις: {item.aiMissingCount} · Κρίσιμες: {item.aiCriticalCount}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Info title="Ημερομηνία / ώρα" value={dateLabel(item.recordedAt)} />
                <Info title="Κατάσταση" value={label(item.status)} />
                <Info title="Approval" value={label(item.approvalState)} />
                <Info title="Προτεραιότητα" value={label(item.priority)} />
                <Info title="Πηγή" value={label(item.source)} />
                <Info title="Καταχωρήθηκε από" value={`${label(item.recordedByName)} / ${label(item.recordedByRole)}`} />
                <Info title="Επικοινωνία" value={`${label(item.contactName)} / ${label(item.contactPhoneMasked)}`} />
                <Info title="Πού στάλθηκε" value={label(item.deliveryTargetLabel)} />
                <Info title="Περιοχή" value={label(item.areaLabel)} />
                <Info title="Οδός" value={label(item.roadLabel)} />
                <Info title="Ζώνη" value={label(item.zoneLabel)} />
                <Info title="Χάρτης" value={label(item.mapLinkStatus)} />
                <Info title="Κοντινός αγωγός" value={label(item.nearestPipeLabel)} />
                <Info title="Κοντινή βάνα" value={label(item.nearestValveLabel)} />
                <Info title="Τεκμήρια" value={label(item.evidenceCount)} />
                <Info title="Μεταγραφή" value={label(item.transcriptStatus)} />
              </div>

              {item.aiChecks.length ? (
                <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-950/20 p-4">
                  <h3 className="font-black text-amber-100">AI έλεγχος ελλείψεων</h3>
                  <div className="mt-3 grid gap-2">
                    {item.aiChecks.map((check) => (
                      <p key={check.id} className="text-sm font-bold leading-6 text-amber-50/90">
                        <span className="font-black text-[#f2c766]">{check.severity}</span> · {check.message} —{" "}
                        {check.suggestedAction}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="mt-4 rounded-2xl border border-slate-700 bg-[#0d1a2d] p-4 text-sm font-black text-slate-200">
                Επόμενο βήμα: {item.nextStep}
              </p>

              <Link
                href={`/professional/infrastructure/water/admin/faults/${encodeURIComponent(item.recordNumber)}`}
                className="mt-4 inline-flex rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black"
              >
                Άνοιγμα φακέλου
              </Link>
            </article>
          ))}

          {!items.length ? (
            <div className="rounded-3xl border border-slate-700 bg-[#07111f] p-5">
              <h2 className="text-xl font-black">Δεν εμφανίζονται pending βλάβες</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
                Αν υπάρχει δοκιμαστική καταχώρηση αλλά δεν εμφανίζεται εδώ, τότε λείπει founder/admin session.
                Αυτό είναι σωστή προστασία, όχι σφάλμα προβολής.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
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
