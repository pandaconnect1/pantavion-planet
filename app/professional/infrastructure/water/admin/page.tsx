"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WaterAccessRequest = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  organization?: string;
  emailOrPhone: string;
  reason?: string;
  status: string;
  createdAt: string;
  deviceId?: string;
  deviceLabel?: string;
  hasDeviceToken?: boolean;
};

const FOUNDER_CODE_STORAGE_KEY = "pantavion.water.admin.founderCode.v1";

const WATER_FOUNDER_CONTROL_MODULES = [
  {
    title: "Ιδιωτική Αποθήκη Πηγών",
    status: "Θεμέλιο έτοιμο",
    text: "Ιδιωτική περιοχή για DWG, DXF, KMZ, KML, GeoJSON, PDF, scanner, φωτογραφίες, ηχητικά, τηλεμετρία, δορυφορικές ενδείξεις και αρχεία εργολάβων/as-built.",
    next: "Επόμενο: ιδιωτικό API upload/storage",
  },
  {
    title: "Κέντρο Εγκρίσεων",
    status: "Θεμέλιο έτοιμο",
    text: "Ουρά ελέγχου για αιτήματα πρόσβασης, συσκευές, σημειώσεις, φωτογραφίες, ηχητικά, βλάβες, βάνες, αλλαγές δικτύου, PDF/scanner και εισηγήσεις AI.",
    next: "Άνοιγμα Κέντρου Εγκρίσεων",
    href: "/professional/infrastructure/water/admin/approvals",
  },
  {
    title: "Πλευρική Μπάρα Πληροφοριών",
    status: "Θεμέλιο έτοιμο",
    text: "Περιοχή, οδός, ζώνη, βάνες, δεξαμενές, βλάβες, φωτογραφίες, ηχητικά, πίεση, βάθος, υλικό, ιστορικό, εισήγηση AI και στοιχεία προς έγκριση.",
    next: "Επόμενο: πλευρικό πάνελ στον χάρτη",
  },
  {
    title: "Βοηθός Πεδίου",
    status: "Θεμέλιο έτοιμο",
    text: "Απλή ροή για τεχνικούς: το σημείο μου, αναζήτηση περιοχής/οδού/ζώνης, τι υπάρχει κάτω εδώ, προσθήκη σημείωσης/φωτογραφίας/ηχητικού, αναφορά βλάβης, κοντινή βάνα.",
    next: "Επόμενο: φόρμα καταχώρησης πεδίου",
  },
  {
    title: "Ημερολόγιο Αλλαγών & Τεκμηρίων",
    status: "Θεμέλιο έτοιμο",
    text: "Μακροχρόνιο ιστορικό για φωτογραφίες, σημειώσεις, βλάβες, βάνες, επισκευές αγωγών, επεκτάσεις, αλλαγές πίεσης/ζώνης, PDF/scanner και ηχητικά τεκμήρια.",
    next: "Επόμενο: χρονολόγιο τεκμηρίων",
  },
  {
    title: "Μητρώο Τεχνολογιών",
    status: "Θεμέλιο έτοιμο",
    text: "Μητρώο για τηλεμετρία, SCADA, αισθητήρες, μετρητές ροής, δεξαμενές, ανίχνευση διαρροών, GPR, drones, θερμικά, δορυφορικά, EPANET, πρόβλεψη AI και OCR.",
    next: "Επόμενο: πίνακας αξιολόγησης τεχνολογιών",
  },
  {
    title: "Δευτερεύοντα Επίπεδα",
    status: "Θεμέλιο έτοιμο",
    text: "Ασφαλή παράγωγα επίπεδα για ζώνες πίεσης, τομείς DMA, βάνες, υδροστόμια, δεξαμενές, αντλίες, κινδύνους, συντήρηση, δορυφορικά και AI overlays.",
    next: "Επόμενο: έλεγχος ορατότητας επιπέδων",
  },
  {
    title: "Σχέδιο Επεξεργασίας DXF",
    status: "Θεμέλιο έτοιμο",
    text: "Ιδιωτική ροή DWG/DXF: αποθήκη πηγών, προέλευση, έλεγχος, εξαγωγή, ελαφριά παράγωγα επίπεδα, έλεγχος founder, rollback και δημοσίευση.",
    next: "Επόμενο: API επεξεργασίας ιδιωτικών πηγών",
  },
] as const;

export default function WaterAdminAccessPage() {
  const [founderCode, setFounderCode] = useState("");
  const [trustedDevice, setTrustedDevice] = useState(false);
  const [requests, setRequests] = useState<WaterAccessRequest[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function getSavedFounderCode() {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(FOUNDER_CODE_STORAGE_KEY) || "";
  }

  function rememberFounderCode(value: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FOUNDER_CODE_STORAGE_KEY, value);
    setTrustedDevice(true);
  }

  function forgetThisDevice() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(FOUNDER_CODE_STORAGE_KEY);
    }

    setFounderCode("");
    setTrustedDevice(false);
    setRequests([]);
    setMessage("Η συσκευή καθαρίστηκε. Θα χρειαστεί ξανά founder/admin κωδικός.");
  }

  async function loadRequests(codeOverride?: string) {
    const codeToUse = (codeOverride || founderCode || getSavedFounderCode()).trim();

    if (!codeToUse) {
      setMessage("Βάλε founder/admin κωδικό την πρώτη φορά.");
      return;
    }

    setLoading(true);
    setMessage("Φόρτωση αιτημάτων...");

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/admin/requests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ founderCode: codeToUse }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        requests?: WaterAccessRequest[];
        error?: string;
        blobCount?: number;
        readCount?: number;
        skippedCount?: number;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "requests_failed");
      }

      setFounderCode(codeToUse);
      rememberFounderCode(codeToUse);
      setRequests(json.requests || []);
      setMessage(
        `Βρέθηκαν ${json.requests?.length || 0} αιτήματα. Blob: ${json.blobCount || 0}, διαβάστηκαν: ${json.readCount || 0}, skipped: ${json.skippedCount || 0}.`,
      );
    } catch {
      setTrustedDevice(false);
      setMessage("Δεν φορτώθηκαν τα αιτήματα. Έλεγξε τον founder/admin κωδικό.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(request: WaterAccessRequest, decision: "approve" | "reject") {
    const codeToUse = (founderCode || getSavedFounderCode()).trim();

    if (!codeToUse) {
      setMessage("Χρειάζεται founder/admin κωδικός πριν από έγκριση ή απόρριψη.");
      return;
    }

    if (decision === "approve" && !request.hasDeviceToken) {
      setMessage("Αυτό είναι παλιό αίτημα χωρίς δεμένη συσκευή. Ζήτησε από τον χρήστη να κάνει νέα αίτηση από το κινητό του.");
      return;
    }

    setLoading(true);
    setMessage(decision === "approve" ? "Έγκριση..." : "Απόρριψη...");

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/admin/decision", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          founderCode: codeToUse,
          requestId: request.id,
          decision,
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "decision_failed");
      }

      rememberFounderCode(codeToUse);
      setMessage(decision === "approve" ? "Εγκρίθηκε η συγκεκριμένη συσκευή." : "Απορρίφθηκε.");
      await loadRequests(codeToUse);
    } catch {
      setMessage("Η απόφαση δεν αποθηκεύτηκε.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedCode = getSavedFounderCode();

    if (savedCode) {
      setFounderCode(savedCode);
      setTrustedDevice(true);
      void loadRequests(savedCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const pending = requests.filter((item) => item.status === "pending_founder_review").length;
    const approved = requests.filter((item) => item.status === "approved").length;
    const rejected = requests.filter((item) => item.status === "rejected").length;
    const deviceReady = requests.filter((item) => item.hasDeviceToken).length;

    return {
      total: requests.length,
      pending,
      approved,
      rejected,
      deviceReady,
    };
  }, [requests]);

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-[#f2c766]">
          PANTAVION WATER ADMIN
        </p>

        <h1 className="text-3xl font-black">Έγκριση πρόσβασης ύδρευσης</h1>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          Από εδώ εγκρίνεις ή απορρίπτεις αιτήματα από το κινητό σου. Η πρόσβαση δένεται με τη συγκεκριμένη συσκευή του χρήστη.
        </p>

        <div className="mt-6 grid gap-3 rounded-3xl border border-slate-700 bg-[#07111f] p-4">
          {trustedDevice ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-sm font-bold text-emerald-100">
              Αυτή η συσκευή αναγνωρίστηκε ως founder/admin συσκευή. Τα αιτήματα φορτώνονται αυτόματα.
            </div>
          ) : null}

          <input
            value={founderCode}
            onChange={(event) => setFounderCode(event.target.value)}
            placeholder="Founder/admin κωδικός"
            type="password"
            className="rounded-2xl border border-[#b89445]/60 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void loadRequests()}
              disabled={loading}
              className="rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
            >
              Φόρτωση αιτημάτων
            </button>

            <button
              type="button"
              onClick={forgetThisDevice}
              disabled={loading}
              className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-5 py-3 font-black text-slate-100 disabled:opacity-60"
            >
              Ξέχνα αυτή τη συσκευή
            </button>
          </div>

          {message ? <p className="text-sm font-bold text-[#f2c766]">{message}</p> : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          <div className="rounded-2xl border border-slate-700 bg-[#07111f] p-4">
            <p className="text-xs text-slate-400">Σύνολο</p>
            <p className="text-2xl font-black text-[#f2c766]">{counts.total}</p>
          </div>
          <div className="rounded-2xl border border-amber-600/50 bg-amber-950/20 p-4">
            <p className="text-xs text-amber-100/70">Σε αναμονή</p>
            <p className="text-2xl font-black text-amber-100">{counts.pending}</p>
          </div>
          <div className="rounded-2xl border border-emerald-600/50 bg-emerald-950/20 p-4">
            <p className="text-xs text-emerald-100/70">Εγκεκριμένα</p>
            <p className="text-2xl font-black text-emerald-100">{counts.approved}</p>
          </div>
          <div className="rounded-2xl border border-red-600/50 bg-red-950/20 p-4">
            <p className="text-xs text-red-100/70">Απορρίψεις</p>
            <p className="text-2xl font-black text-red-100">{counts.rejected}</p>
          </div>
          <div className="rounded-2xl border border-sky-600/50 bg-sky-950/20 p-4">
            <p className="text-xs text-sky-100/70">Με συσκευή</p>
            <p className="text-2xl font-black text-sky-100">{counts.deviceReady}</p>
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-[#f2c766]/30 bg-[#07111f] p-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f2c766]">
              ΚΕΝΤΡΟ ΕΛΕΓΧΟΥ ΥΔΡΕΥΣΗΣ
            </p>
            <h2 className="text-2xl font-black text-white">Κέντρο ελέγχου υποδομής ύδρευσης</h2>
            <p className="text-sm leading-6 text-slate-300">
              Τα παρακάτω modules είναι πλέον κλειδωμένα ως foundation. Τα raw DWG/DXF/PDF/φωτογραφίες/ηχητικά παραμένουν private μέχρι να υπάρξει founder approval και ασφαλές derived layer.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {WATER_FOUNDER_CONTROL_MODULES.map((module) => (
              <article
                key={module.title}
                className="rounded-2xl border border-slate-700 bg-[#0d1a2d] p-4"
              >
                <div className="flex flex-col gap-2">
                  <p className="text-lg font-black text-white">{module.title}</p>
                  <p className="w-fit rounded-full border border-emerald-500/40 bg-emerald-950/30 px-3 py-1 text-xs font-black text-emerald-100">
                    {module.status}
                  </p>
                  <p className="text-sm leading-6 text-slate-300">{module.text}</p>
                  {"href" in module ? (
                    <Link
                      href={module.href}
                      className="w-fit rounded-full bg-[#f2c766] px-4 py-2 text-sm font-black text-black no-underline"
                    >
                      {module.next}
                    </Link>
                  ) : (
                    <p className="text-sm font-black text-[#f2c766]">{module.next}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-4">
          {requests.map((item) => {
            const pending = item.status === "pending_founder_review";
            const canApprove = pending && item.hasDeviceToken === true;

            return (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-700 bg-[#07111f] p-4"
              >
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-black">
                    {item.firstName} {item.lastName}
                  </p>
                  <p className="text-sm text-slate-300">Τίτλος/Ρόλος: {item.title}</p>
                  <p className="text-sm text-slate-300">Τηλέφωνο: {item.emailOrPhone}</p>
                  <p className="text-sm text-slate-300">Κατάσταση: {item.status}</p>
                  <p className="text-sm text-slate-300">
                    Συσκευή: {item.hasDeviceToken ? item.deviceLabel || item.deviceId || "δεμένη συσκευή" : "παλιό αίτημα χωρίς συσκευή"}
                  </p>
                  <p className="text-xs text-slate-500">{item.createdAt}</p>

                  {!item.hasDeviceToken ? (
                    <p className="rounded-2xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm font-bold text-amber-100">
                      Παλιά αίτηση χωρίς ασφαλές device token. Ζήτησε νέα αίτηση από το κινητό του χρήστη.
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void decide(item, "approve")}
                    disabled={loading || !canApprove}
                    className="rounded-2xl border border-emerald-500 bg-emerald-950/40 px-5 py-3 font-black text-emerald-100 disabled:opacity-50"
                  >
                    Εγκρίνω τη συσκευή
                  </button>

                  <button
                    type="button"
                    onClick={() => void decide(item, "reject")}
                    disabled={loading || item.status === "rejected"}
                    className="rounded-2xl border border-red-500 bg-red-950/40 px-5 py-3 font-black text-red-100 disabled:opacity-50"
                  >
                    Απόρριψη
                  </button>
                </div>
              </article>
            );
          })}

          {requests.length === 0 ? (
            <p className="rounded-3xl border border-slate-700 bg-[#07111f] p-4 text-slate-300">
              Δεν εμφανίζονται αιτήματα ακόμη.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}