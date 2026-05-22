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

const APPROVAL_CATEGORIES = [
  {
    title: "Πρόσβαση / Συσκευές",
    status: "Ενεργό",
    description: "Πραγματικά αιτήματα πρόσβασης και δεμένες συσκευές χρηστών.",
  },
  {
    title: "Σημειώσεις χάρτη",
    status: "Επόμενο API",
    description: "Σημειώσεις από τεχνικούς/χρήστες που θα μένουν pending μέχρι founder approval.",
  },
  {
    title: "Φωτογραφίες",
    status: "Επόμενο API",
    description: "Φωτογραφίες εργοταξίου, βανών, επεκτάσεων και επισκευών πριν γίνουν κοινές.",
  },
  {
    title: "Ηχητικά",
    status: "Επόμενο API",
    description: "Ηχητικές περιγραφές πεδίου με μεταγραφή και έλεγχο πριν από δημοσίευση.",
  },
  {
    title: "Βλάβες / Βάνες",
    status: "Επόμενο API",
    description: "Βλάβες, πιθανές βάνες, αλλαγές βανών, αφαιρέσεις και διορθώσεις δικτύου.",
  },
  {
    title: "PDF / Scanner",
    status: "Επόμενο API",
    description: "Σχέδια, αναφορές scanner, έγγραφα και τεχνικά αρχεία προς έλεγχο.",
  },
  {
    title: "AI εισηγήσεις",
    status: "Founder-only",
    description: "AI engineering proposals που δεν θεωρούνται αλήθεια χωρίς founder approval.",
  },
] as const;

function getSavedFounderCode() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(FOUNDER_CODE_STORAGE_KEY) || "";
}

function rememberFounderCode(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOUNDER_CODE_STORAGE_KEY, value);
}

export default function WaterApprovalInboxPage() {
  const [founderCode, setFounderCode] = useState("");
  const [requests, setRequests] = useState<WaterAccessRequest[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadRequests(codeOverride?: string) {
    const codeToUse = (codeOverride || founderCode || getSavedFounderCode()).trim();

    if (!codeToUse) {
      setMessage("Βάλε founder/admin κωδικό.");
      return;
    }

    setLoading(true);
    setMessage("Φόρτωση Κέντρου Εγκρίσεων...");

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
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "requests_failed");
      }

      setFounderCode(codeToUse);
      rememberFounderCode(codeToUse);
      setRequests(json.requests || []);
      setMessage(`Φορτώθηκαν ${json.requests?.length || 0} αιτήματα πρόσβασης/συσκευών.`);
    } catch {
      setMessage("Δεν φορτώθηκαν τα αιτήματα. Έλεγξε τον founder/admin κωδικό.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(request: WaterAccessRequest, decision: "approve" | "reject") {
    const codeToUse = (founderCode || getSavedFounderCode()).trim();

    if (!codeToUse) {
      setMessage("Χρειάζεται founder/admin κωδικός.");
      return;
    }

    if (decision === "approve" && !request.hasDeviceToken) {
      setMessage("Παλιά αίτηση χωρίς device token. Ζήτησε νέα αίτηση από τη συσκευή του χρήστη.");
      return;
    }

    setLoading(true);
    setMessage(decision === "approve" ? "Έγκριση συσκευής..." : "Απόρριψη αιτήματος...");

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
      await loadRequests(codeToUse);
      setMessage(decision === "approve" ? "Εγκρίθηκε η συσκευή." : "Απορρίφθηκε το αίτημα.");
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
      void loadRequests(savedCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === "pending_founder_review").length,
      approved: requests.filter((item) => item.status === "approved").length,
      rejected: requests.filter((item) => item.status === "rejected").length,
      deviceReady: requests.filter((item) => item.hasDeviceToken).length,
    };
  }, [requests]);

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
      <section className="mx-auto w-full max-w-6xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <Link href="/professional/infrastructure/water/admin" className="text-sm font-black text-[#f2c766]">
          ← Πίσω στο Water Admin
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-[#f2c766]">
          ΚΕΝΤΡΟ ΕΓΚΡΙΣΕΩΝ ΥΔΡΕΥΣΗΣ
        </p>

        <h1 className="mt-3 text-3xl font-black">Όλα τα pending στοιχεία πριν γίνουν κοινά</h1>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
          Από εδώ ο founder ελέγχει πρόσβαση, συσκευές, σημειώσεις, φωτογραφίες, ηχητικά, βλάβες, βάνες, PDF/scanner και AI εισηγήσεις. Τίποτα δεν γίνεται κοινό χωρίς έγκριση.
        </p>

        <div className="mt-6 grid gap-3 rounded-3xl border border-slate-700 bg-[#07111f] p-4">
          <input
            value={founderCode}
            onChange={(event) => setFounderCode(event.target.value)}
            placeholder="Founder/admin κωδικός"
            type="password"
            className="rounded-2xl border border-[#b89445]/60 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
          />

          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={loading}
            className="rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
          >
            Φόρτωση Κέντρου Εγκρίσεων
          </button>

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

        <section className="mt-6 grid gap-3 md:grid-cols-2">
          {APPROVAL_CATEGORIES.map((category) => (
            <article key={category.title} className="rounded-2xl border border-slate-700 bg-[#07111f] p-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-black">{category.title}</h2>
                <p className="w-fit rounded-full border border-[#f2c766]/40 bg-[#f2c766]/10 px-3 py-1 text-xs font-black text-[#f2c766]">
                  {category.status}
                </p>
                <p className="text-sm leading-6 text-slate-300">{category.description}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4">
          <h2 className="text-2xl font-black">Πραγματικά αιτήματα πρόσβασης / συσκευών</h2>

          {requests.map((item) => {
            const pending = item.status === "pending_founder_review";
            const canApprove = pending && item.hasDeviceToken === true;

            return (
              <article key={item.id} className="rounded-3xl border border-slate-700 bg-[#07111f] p-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-black">
                    {item.firstName} {item.lastName}
                  </p>
                  <p className="text-sm text-slate-300">Ρόλος: {item.title}</p>
                  <p className="text-sm text-slate-300">Τηλέφωνο: {item.emailOrPhone}</p>
                  <p className="text-sm text-slate-300">Κατάσταση: {item.status}</p>
                  <p className="text-sm text-slate-300">
                    Συσκευή: {item.hasDeviceToken ? item.deviceLabel || item.deviceId || "δεμένη συσκευή" : "παλιό αίτημα χωρίς συσκευή"}
                  </p>
                  <p className="text-xs text-slate-500">{item.createdAt}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void decide(item, "approve")}
                    disabled={loading || !canApprove}
                    className="rounded-2xl border border-emerald-500 bg-emerald-950/40 px-5 py-3 font-black text-emerald-100 disabled:opacity-50"
                  >
                    Έγκριση συσκευής
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
        </section>
      </section>
    </main>
  );
}