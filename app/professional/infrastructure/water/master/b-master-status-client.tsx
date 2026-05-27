"use client";

import { useMemo, useState } from "react";

type BMasterApiResponse = {
  ok: boolean;
  marker?: string;
  error?: string;
  access?: string;
  bMaster?: {
    role?: string;
    sourceFormat?: string;
    storageFormat?: string;
    version?: string;
    envReady?: boolean;
    manifestPath?: string;
    chunkPrefix?: string;
    originalSha256?: string;
    compressedSha256?: string;
    manifestAvailable?: boolean;
    chunkObjectsAvailable?: boolean;
    chunkObjectCount?: number;
  };
  policy?: {
    approvedUsersSeeBMapViewInsidePantavion?: boolean;
    rawDwgDownloadAllowedForApprovedUsers?: boolean;
    publicAccessAllowed?: boolean;
    githubUploadAllowed?: boolean;
    browserFullNetworkLoadAllowed?: boolean;
    directMasterMutationAllowed?: boolean;
    founderAdminControlsNewVersions?: boolean;
  };
  next?: {
    bDerivedViewRequired?: boolean;
    cIntelligentMapRequired?: boolean;
  };
};

function yesNo(value: boolean | undefined): string {
  if (value === true) return "YES";
  if (value === false) return "NO";
  return "UNKNOWN";
}

function StatusPill({
  ok,
  label,
}: {
  ok: boolean | undefined;
  label: string;
}) {
  return (
    <span
      className={[
        "rounded-full border px-3 py-1 text-xs font-bold tracking-[0.18em]",
        ok
          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
          : "border-amber-400/50 bg-amber-400/10 text-amber-200",
      ].join(" ")}
    >
      {label}: {yesNo(ok)}
    </span>
  );
}

export default function BMasterStatusClient() {
  const [founderCode, setFounderCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BMasterApiResponse | null>(null);
  const [error, setError] = useState("");

  const bMaster = response?.bMaster;
  const policy = response?.policy;

  const connected = useMemo(() => {
    return Boolean(
      response?.ok &&
        bMaster?.sourceFormat === "DWG" &&
        bMaster?.manifestAvailable &&
        bMaster?.chunkObjectsAvailable &&
        bMaster?.chunkObjectCount
    );
  }, [response, bMaster]);

  async function loadStatus() {
    const code = founderCode.trim();

    if (!code) {
      setError("Βάλε τον founder/admin water code.");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const result = await fetch(
        "/api/professional/infrastructure/water/master/b",
        {
          method: "GET",
          headers: {
            "x-pantavion-water-founder-code": code,
          },
          cache: "no-store",
        }
      );

      const payload = (await result.json()) as BMasterApiResponse;

      if (!result.ok || !payload.ok) {
        setResponse(payload);
        setError(payload.error || "Δεν εγκρίθηκε η πρόσβαση.");
        return;
      }

      setResponse(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Άγνωστο σφάλμα σύνδεσης."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06101f] px-4 py-8 text-white">
      <section className="mx-auto max-w-5xl rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 shadow-2xl shadow-black/40 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#d8b45f]">
          Pantavion Protected Water Infrastructure
        </p>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              B Master DWG Status
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Founder-only panel για να ελέγχεις ότι το αυθεντικό B Master DWG
              υπάρχει στο private vault, ότι το manifest είναι διαθέσιμο, ότι τα
              chunks υπάρχουν και ότι το raw DWG δεν εκτίθεται σε χρήστες.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <label className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
              Founder/Admin Water Code
            </label>
            <input
              type="password"
              value={founderCode}
              onChange={(event) => setFounderCode(event.target.value)}
              placeholder="Βάλε τον κωδικό"
              className="mt-3 w-full rounded-2xl border border-[#d8b45f]/30 bg-[#07101e] px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-[#d8b45f]"
            />
            <button
              type="button"
              onClick={loadStatus}
              disabled={loading}
              className="mt-3 w-full rounded-2xl bg-[#d8b45f] px-5 py-3 font-black text-[#07101e] transition hover:bg-[#f0cf78] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Έλεγχος..." : "Έλεγχος B Master"}
            </button>
            {error ? (
              <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-semibold text-red-200">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Connection
            </p>
            <p className="mt-2 text-2xl font-black">
              {connected ? "CONNECTED" : "WAITING"}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Source
            </p>
            <p className="mt-2 text-2xl font-black">
              {bMaster?.sourceFormat || "DWG"}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Chunks
            </p>
            <p className="mt-2 text-2xl font-black">
              {bMaster?.chunkObjectCount ?? "-"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <StatusPill ok={bMaster?.envReady} label="ENV" />
          <StatusPill ok={bMaster?.manifestAvailable} label="MANIFEST" />
          <StatusPill ok={bMaster?.chunkObjectsAvailable} label="CHUNKS" />
          <StatusPill
            ok={policy?.rawDwgDownloadAllowedForApprovedUsers === false}
            label="RAW BLOCKED"
          />
          <StatusPill ok={policy?.publicAccessAllowed === false} label="PRIVATE" />
        </div>

        {response?.ok ? (
          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <h2 className="font-black text-[#d8b45f]">B Master Registry</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-slate-400">Version</dt>
                  <dd className="break-all font-semibold">{bMaster?.version}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Storage</dt>
                  <dd className="break-all font-semibold">
                    {bMaster?.storageFormat}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Manifest Path</dt>
                  <dd className="break-all font-semibold">
                    {bMaster?.manifestPath}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Chunk Prefix</dt>
                  <dd className="break-all font-semibold">
                    {bMaster?.chunkPrefix}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <h2 className="font-black text-[#d8b45f]">Protection Policy</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-slate-400">Approved users see map view</dt>
                  <dd className="font-semibold">
                    {yesNo(policy?.approvedUsersSeeBMapViewInsidePantavion)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Raw DWG download</dt>
                  <dd className="font-semibold">
                    {yesNo(policy?.rawDwgDownloadAllowedForApprovedUsers)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Public access</dt>
                  <dd className="font-semibold">
                    {yesNo(policy?.publicAccessAllowed)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Direct master mutation</dt>
                  <dd className="font-semibold">
                    {yesNo(policy?.directMasterMutationAllowed)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        ) : null}

        <div className="mt-8 rounded-3xl border border-[#d8b45f]/20 bg-[#d8b45f]/10 p-4 text-sm leading-7 text-[#f3db9d]">
          Επόμενο στάδιο: δημιουργία ελαφριάς protected B derived προβολής και
          μετά C Intelligent Map με approved αλλαγές, φωτογραφίες, σημειώσεις,
          βλάβες, βάνες, οδούς, ζώνες, πίεση, PRV και μελλοντική τηλεμετρία.
        </div>
      </section>
    </main>
  );
}
