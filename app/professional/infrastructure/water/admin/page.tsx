"use client";

import { useEffect, useState } from "react";

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
};

const FOUNDER_CODE_STORAGE_KEY = "pantavion.water.admin.founderCode.v1";

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
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "requests_failed");
      }

      setFounderCode(codeToUse);
      rememberFounderCode(codeToUse);
      setRequests(json.requests || []);
      setMessage(`Βρέθηκαν ${json.requests?.length || 0} αιτήματα.`);
    } catch {
      setTrustedDevice(false);
      setMessage("Δεν φορτώθηκαν τα αιτήματα. Έλεγξε τον founder/admin κωδικό.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(requestId: string, decision: "approve" | "reject") {
    const codeToUse = (founderCode || getSavedFounderCode()).trim();

    if (!codeToUse) {
      setMessage("Χρειάζεται founder/admin κωδικός πριν από έγκριση ή απόρριψη.");
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
          requestId,
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
      setMessage(decision === "approve" ? "Εγκρίθηκε." : "Απορρίφθηκε.");
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

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-[#f2c766]">
          PANTAVION WATER ADMIN
        </p>

        <h1 className="text-3xl font-black">Έγκριση πρόσβασης ύδρευσης</h1>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          Από εδώ εγκρίνεις ή απορρίπτεις αιτήματα από το κινητό σου. Δεν δίνεις τον founder κωδικό σε κανέναν.
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

        <div className="mt-6 grid gap-4">
          {requests.map((item) => (
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
                <p className="text-xs text-slate-500">{item.createdAt}</p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void decide(item.id, "approve")}
                  disabled={loading || item.status === "approved"}
                  className="rounded-2xl border border-emerald-500 bg-emerald-950/40 px-5 py-3 font-black text-emerald-100 disabled:opacity-50"
                >
                  Εγκρίνω
                </button>

                <button
                  type="button"
                  onClick={() => void decide(item.id, "reject")}
                  disabled={loading || item.status === "rejected"}
                  className="rounded-2xl border border-red-500 bg-red-950/40 px-5 py-3 font-black text-red-100 disabled:opacity-50"
                >
                  Απόρριψη
                </button>
              </div>
            </article>
          ))}

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