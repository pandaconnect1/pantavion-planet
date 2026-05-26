"use client";

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
const PANTAVION_WATER_DEVICE_ID_KEY = "pantavion:water:device-id:v1";
const PANTAVION_WATER_DEVICE_TOKEN_KEY = "pantavion:water:device-token:v1";
const PANTAVION_WATER_PENDING_REQUEST_KEY = "pantavion:water:pending-request-id:v1";

function randomWaterDeviceSecret() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const values = window.crypto.getRandomValues(new Uint32Array(4));

    return Array.from(values)
      .map((value) => value.toString(36))
      .join("");
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateWaterAccessDevice() {
  if (typeof window === "undefined") {
    return {
      deviceId: "",
      deviceToken: "",
      deviceLabel: "",
    };
  }

  let deviceId = window.localStorage.getItem(PANTAVION_WATER_DEVICE_ID_KEY) || "";
  let deviceToken = window.localStorage.getItem(PANTAVION_WATER_DEVICE_TOKEN_KEY) || "";

  if (!deviceId) {
    deviceId = `water-device-${Date.now().toString(36)}-${randomWaterDeviceSecret()}`;
    window.localStorage.setItem(PANTAVION_WATER_DEVICE_ID_KEY, deviceId);
  }

  if (!deviceToken) {
    deviceToken = `water-token-${randomWaterDeviceSecret()}-${randomWaterDeviceSecret()}`;
    window.localStorage.setItem(PANTAVION_WATER_DEVICE_TOKEN_KEY, deviceToken);
  }

  return {
    deviceId,
    deviceToken,
    deviceLabel: `${window.navigator.platform || "unknown"} / ${window.navigator.userAgent.slice(0, 90)}`,
  };
}

function getSavedFounderCode() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(FOUNDER_CODE_STORAGE_KEY) || "";
}

function rememberFounderCode(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOUNDER_CODE_STORAGE_KEY, value);
}

function getPendingRequestId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PANTAVION_WATER_PENDING_REQUEST_KEY) || "";
}

function rememberPendingRequestId(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PANTAVION_WATER_PENDING_REQUEST_KEY, value);
}


function WaterLiveIntelligenceViewSelector() {
  const views = [
    {
      key: "operational_map",
      label: "Operational",
      title: "Λειτουργικός χάρτης",
      detail: "Ασφαλές layer για καθημερινή χρήση, εργασίες, βλάβες και πεδίο.",
    },
    {
      key: "master_map",
      label: "Master",
      title: "Master χάρτης",
      detail: "Πλήρες προστατευμένο δίκτυο. Θέλει founder/admin ή εγκεκριμένη πρόσβαση.",
    },
    {
      key: "terrain_elevation_map",
      label: "Terrain",
      title: "Υψόμετρα / μορφολογία",
      detail: "Βάση για υψομετρικές διαφορές, πιθανές πιέσεις και υδραυλική αξιολόγηση.",
    },
    {
      key: "pressure_risk_map",
      label: "Pressure Risk",
      title: "Ρίσκο πίεσης",
      detail: "Ενδείξεις για χαμηλή/υψηλή πίεση, αδύνατα σημεία και ανάγκη μετρήσεων.",
    },
    {
      key: "demand_growth_map",
      label: "Demand Growth",
      title: "Ανάπτυξη / ζήτηση",
      detail: "Πολυκατοικίες, πληθυσμιακή ανάπτυξη, νέα φορτία σε παλιό δίκτυο.",
    },
    {
      key: "prv_candidate_map",
      label: "PRV",
      title: "PRV candidates",
      detail: "Πιθανές περιοχές για pressure reducing valve ή engineering review.",
    },
  ] as const;

  return (
    <section className="mt-6 rounded-3xl border border-[#f2c766]/40 bg-[#07111f]/95 p-5 shadow-2xl">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f2c766]">
            Pantavion Water Intelligence Views
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Επιλογή χάρτη / AI hydraulic layers
          </h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-300">
            Διάλεξε επιχειρησιακή προβολή, master view, terrain, pressure risk,
            demand growth ή PRV candidates. Το AI εισηγείται, αλλά καμία master
            ή υδραυλική αλλαγή δεν εγκρίνεται χωρίς άνθρωπο, audit και approval.
          </p>
        </div>
        <div className="rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#f2c766]">
          Live foundation
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {views.map((view) => (
          <a
            key={view.key}
            href={`/professional/infrastructure/water?view=${view.key}`}
            className="group rounded-2xl border border-slate-700 bg-[#0d1a2d] p-4 transition hover:border-[#f2c766]/70 hover:bg-[#10213a]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-white">{view.label}</p>
              <span className="rounded-full border border-[#f2c766]/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#f2c766]">
                open
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-[#f2c766]">{view.title}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
              {view.detail}
            </p>
          </a>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-700 bg-black/25 p-4">
        <p className="text-sm font-black text-white">AI / Kernel boundary</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
          Master, pressure, terrain, demand και PRV layers είναι protected engineering
          views. Το Pantavion μπορεί να αναλύει, να προτείνει, να ζητά μετρήσεις
          και να φτιάχνει dossier, αλλά δεν αλλάζει master χάρτη ή υδραυλικό σχεδιασμό
          χωρίς founder/admin ή engineer approval.
        </p>
      </div>
    </section>
  );
}
export default function WaterEntryClient() {
  const [founderCode, setFounderCode] = useState("");
  const [showFounderLogin, setShowFounderLogin] = useState(false);
  const [adminTrusted, setAdminTrusted] = useState(false);
  const [accessApproved, setAccessApproved] = useState(false);

  const [requests, setRequests] = useState<WaterAccessRequest[]>([]);
  const [adminMessage, setAdminMessage] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [pendingRequestId, setPendingRequestId] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("");

  const [loading, setLoading] = useState(false);

  async function checkApprovedDevice() {
    const device = getOrCreateWaterAccessDevice();

    if (!device.deviceId || !device.deviceToken) return;

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/authorize", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          deviceId: device.deviceId,
          deviceToken: device.deviceToken,
        }),
      });

      const json = (await response.json()) as { ok?: boolean };

      if (response.ok && json.ok) {
        setAccessApproved(true);
      }
    } catch {
      // Keep user on request screen if the device is not approved yet.
    }
  }

  async function loadAdminRequests(codeOverride?: string) {
    const codeToUse = (codeOverride || founderCode || getSavedFounderCode()).trim();

    if (!codeToUse) {
      setAdminMessage("Βάλε founder/admin κωδικό.");
      return;
    }

    setLoading(true);
    setAdminMessage("Φόρτωση αιτημάτων...");

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
      setAdminTrusted(true);
      setShowFounderLogin(false);
      setRequests(json.requests || []);
      setAdminMessage(
        `Αιτήματα: ${json.requests?.length || 0}. Blob: ${json.blobCount || 0}, διαβάστηκαν: ${json.readCount || 0}, skipped: ${json.skippedCount || 0}.`,
      );
    } catch {
      setAdminTrusted(false);
      setAdminMessage("Δεν φορτώθηκαν τα αιτήματα. Έλεγξε τον founder/admin κωδικό.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAccessRequest() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !roleTitle.trim()) {
      setRequestMessage("Συμπλήρωσε όνομα, επίθετο, τηλέφωνο και ρόλο.");
      return;
    }

    const device = getOrCreateWaterAccessDevice();

    setLoading(true);
    setRequestMessage("Αίτημα προς αποστολή...");

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          title: roleTitle,
          emailOrPhone: phone,
          reason: "Water infrastructure access request",
          deviceId: device.deviceId,
          deviceToken: device.deviceToken,
          deviceLabel: device.deviceLabel,
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        requestId?: string;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "request_failed");
      }

      if (json.requestId) {
        rememberPendingRequestId(json.requestId);
        setPendingRequestId(json.requestId);
      }

      setRequestMessage(
        `Αναμονή προς έγκριση. Το αίτημά σου στάλθηκε. Μείνε στην ίδια συσκευή μέχρι να εγκριθείς.${json.requestId ? ` Request ID: ${json.requestId}` : ""}`,
      );
    } catch {
      setRequestMessage("Δεν στάλθηκε το αίτημα. Δοκίμασε ξανά.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(request: WaterAccessRequest, decision: "approve" | "reject" | "revoke") {
    const codeToUse = (founderCode || getSavedFounderCode()).trim();

    if (!codeToUse) {
      setAdminMessage("Χρειάζεται founder/admin κωδικός.");
      return;
    }

    if (decision === "approve" && !request.hasDeviceToken) {
      setAdminMessage("Παλιά αίτηση χωρίς ασφαλές device token. Ζήτησε νέα αίτηση από το κινητό του χρήστη.");
      return;
    }

    setLoading(true);
    setAdminMessage(
      decision === "approve"
        ? "Έγκριση συσκευής..."
        : decision === "revoke"
          ? "Σταμάτημα πρόσβασης..."
          : "Απόρριψη...",
    );

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

      setAdminMessage(
        decision === "approve"
          ? "Εγκρίθηκε η συγκεκριμένη συσκευή."
          : decision === "revoke"
            ? "Η πρόσβαση σταμάτησε για αυτή τη συσκευή."
            : "Απορρίφθηκε.",
      );

      await loadAdminRequests(codeToUse);
    } catch {
      setAdminMessage("Η απόφαση δεν αποθηκεύτηκε.");
    } finally {
      setLoading(false);
    }
  }

  function forgetAdminDevice() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(FOUNDER_CODE_STORAGE_KEY);
    }

    setFounderCode("");
    setAdminTrusted(false);
    setRequests([]);
    setAdminMessage("Η founder/admin συσκευή καθαρίστηκε.");
  }

  useEffect(() => {
    const savedFounderCode = getSavedFounderCode();
    const savedPendingRequestId = getPendingRequestId();

    if (savedPendingRequestId) {
      setPendingRequestId(savedPendingRequestId);
      setRequestMessage(`Αναμονή προς έγκριση. Request ID: ${savedPendingRequestId}`);
    }

    if (savedFounderCode) {
      setFounderCode(savedFounderCode);
      setAdminTrusted(true);
      void loadAdminRequests(savedFounderCode);
      return;
    }

    void checkApprovedDevice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === "pending_founder_review").length,
      approved: requests.filter((item) => item.status === "approved").length,
      rejected: requests.filter((item) => item.status === "rejected").length,
      revoked: requests.filter((item) => item.status === "revoked").length,
      deviceReady: requests.filter((item) => item.hasDeviceToken).length,
    };
  }, [requests]);

  if (adminTrusted) {
    return (
      <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
        <section className="mx-auto w-full max-w-6xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-[#f2c766]">
            PANTAVION WATER FOUNDER CONTROL
          </p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-black">Αιτήματα πρόσβασης ύδρευσης</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Εδώ βλέπεις μόνο founder/admin έλεγχο. Οι απλοί χρήστες δεν βλέπουν αυτή την οθόνη.
              </p>
            </div>

            <a
              href="/professional/infrastructure/water/live"
              className="rounded-2xl border border-[#f2c766]/70 bg-[#f2c766]/15 px-5 py-3 text-center font-black text-[#f8e6ad]"
            >
              Άνοιγμα χάρτη
            </a>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
            <div className="rounded-2xl border border-zinc-500/50 bg-zinc-950/30 p-4">
              <p className="text-xs text-zinc-100/70">Σταματημένα</p>
              <p className="text-2xl font-black text-zinc-100">{counts.revoked}</p>
            </div>
            <div className="rounded-2xl border border-sky-600/50 bg-sky-950/20 p-4">
              <p className="text-xs text-sky-100/70">Με συσκευή</p>
              <p className="text-2xl font-black text-sky-100">{counts.deviceReady}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-3xl border border-slate-700 bg-[#07111f] p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={founderCode}
                onChange={(event) => setFounderCode(event.target.value)}
                placeholder="Founder/admin κωδικός"
                type="password"
                className="rounded-2xl border border-[#b89445]/60 bg-[#0d1a2d] px-4 py-3 text-white outline-none sm:col-span-2"
              />

              <button
                type="button"
                onClick={() => void loadAdminRequests()}
                disabled={loading}
                className="rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
              >
                Φόρτωση αιτημάτων
              </button>
            </div>

            <button
              type="button"
              onClick={forgetAdminDevice}
              disabled={loading}
              className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-5 py-3 font-black text-slate-100 disabled:opacity-60"
            >
              Ξέχνα αυτή τη founder/admin συσκευή
            </button>

            {adminMessage ? <p className="text-sm font-bold text-[#f2c766]">{adminMessage}</p> : null}
          </div>

          <div className="mt-6 grid gap-4">
            {requests.map((item) => {
              const pending = item.status === "pending_founder_review";
              const approved = item.status === "approved";
              const canApprove = pending && item.hasDeviceToken === true;

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-700 bg-[#07111f] p-4"
                >
                  <div className="grid gap-2">
                    <p className="text-xl font-black">
                      {item.firstName} {item.lastName}
                    </p>
                    <p className="text-sm text-slate-300">Ρόλος: {item.title}</p>
                    <p className="text-sm text-slate-300">Τηλέφωνο: {item.emailOrPhone}</p>
                    <p className="text-sm text-slate-300">Κατάσταση: {item.status}</p>
                    <p className="text-sm text-slate-300">
                      Συσκευή: {item.hasDeviceToken ? item.deviceLabel || item.deviceId || "δεμένη συσκευή" : "παλιό αίτημα χωρίς ασφαλή συσκευή"}
                    </p>
                    <p className="text-xs text-slate-500">{item.createdAt}</p>

                    {!item.hasDeviceToken ? (
                      <p className="rounded-2xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm font-bold text-amber-100">
                        Παλιά αίτηση χωρίς ασφαλές device token. Ζήτησε νέα αίτηση από το κινητό του χρήστη.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
                      disabled={loading || item.status === "rejected" || item.status === "revoked"}
                      className="rounded-2xl border border-red-500 bg-red-950/40 px-5 py-3 font-black text-red-100 disabled:opacity-50"
                    >
                      Απόρριψη
                    </button>

                    <button
                      type="button"
                      onClick={() => void decide(item, "revoke")}
                      disabled={loading || !approved}
                      className="rounded-2xl border border-zinc-400 bg-zinc-950/40 px-5 py-3 font-black text-zinc-100 disabled:opacity-50"
                    >
                      Σταμάτημα πρόσβασης
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

  if (accessApproved) {
    return (
      <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
        <section className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center">
          <div className="w-full rounded-3xl border border-emerald-600/50 bg-[#0d1a2d] p-5 shadow-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-emerald-200">
              PANTAVION WATER ACCESS
            </p>
            <h1 className="text-3xl font-black">Η πρόσβασή σου έχει εγκριθεί</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Η συγκεκριμένη συσκευή έχει εγκριθεί για πρόσβαση στο δίκτυο ύδρευσης.
            </p>
            <a
              href="/professional/infrastructure/water/live"
              className="mt-6 block rounded-2xl bg-[#f2c766] px-5 py-4 text-center font-black text-black"
            >
              Άνοιγμα χάρτη ύδρευσης
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
      <section className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center">
        <div className="w-full rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-[#f2c766]">
            PANTAVION PROTECTED WATER ACCESS
          </p>

          <h1 className="text-3xl font-black">Αίτηση πρόσβασης ύδρευσης</h1>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Για πρώτη πρόσβαση συμπλήρωσε τα στοιχεία σου. Η πρόσβαση θα ενεργοποιηθεί μόνο αφού εγκριθεί από υπεύθυνο Pantavion.
          </p>

          <div className="mt-6 grid gap-3 rounded-3xl border border-slate-700 bg-[#07111f] p-4">
            <p className="text-sm font-black text-[#f2c766]">Αίτημα προς αποστολή</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Όνομα"
                className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
              />
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Επίθετο"
                className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Τηλέφωνο"
                className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
              />
              <input
                value={roleTitle}
                onChange={(event) => setRoleTitle(event.target.value)}
                placeholder="Ρόλος / Τίτλος"
                className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => void submitAccessRequest()}
              disabled={loading}
              className="rounded-2xl border border-[#f2c766]/70 bg-[#f2c766]/15 px-5 py-4 text-base font-black text-[#f8e6ad] disabled:opacity-60"
            >
              Αποστολή αίτησης για έγκριση
            </button>

            <div className="rounded-2xl border border-slate-700 bg-[#0d1a2d] px-4 py-3 text-sm text-slate-200">
              {requestMessage || (pendingRequestId ? `Αναμονή προς έγκριση. Request ID: ${pendingRequestId}` : "Αναμονή προς έγκριση μετά την αποστολή.")}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-700 pt-4">
            <button
              type="button"
              onClick={() => setShowFounderLogin((value) => !value)}
              className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
            >
              Είσοδος υπεύθυνου Pantavion
            </button>

            {showFounderLogin ? (
              <div className="mt-3 grid gap-3 rounded-2xl border border-slate-700 bg-[#07111f] p-4">
                <input
                  value={founderCode}
                  onChange={(event) => setFounderCode(event.target.value)}
                  placeholder="Founder/admin κωδικός"
                  type="password"
                  className="rounded-2xl border border-[#b89445]/60 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => void loadAdminRequests()}
                  disabled={loading}
                  className="rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
                >
                  Άνοιγμα founder/admin ελέγχου
                </button>
                {adminMessage ? <p className="text-sm font-bold text-[#f2c766]">{adminMessage}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    
      <WaterLiveIntelligenceViewSelector /></main>
  );
}