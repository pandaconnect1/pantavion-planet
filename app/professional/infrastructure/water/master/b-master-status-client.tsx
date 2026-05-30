"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BMasterApiResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  status?: string;
  source?: string;
  mode?: string;
  marker?: string;
  filename?: string;
  fileName?: string;
  pathname?: string;
  path?: string;
  manifestPath?: string;
  chunkPrefix?: string;
  chunks?: unknown;
  manifest?: unknown;
  policy?: unknown;
  diagnostics?: unknown;
  [key: string]: unknown;
};

type LoadState = "idle" | "loading" | "ready" | "locked" | "error";

const FOUNDER_CODE_KEYS = [
  "pantavion_water_founder_code",
  "waterFounderCode",
  "waterFounderCodeClean",
];

function readStoredFounderCode(): string | null {
  if (typeof window === "undefined") return null;

  for (const key of FOUNDER_CODE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value && value.trim().length > 0) return value.trim();
  }

  return null;
}

function textValue(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "—";
}

function yesNo(value: unknown): string {
  if (value === true) return "YES";
  if (value === false) return "NO";
  return "UNKNOWN";
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export default function BMasterStatusClient() {
  const [state, setState] = useState<LoadState>("idle");
  const [response, setResponse] = useState<BMasterApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const policy = useMemo(() => readObject(response?.policy), [response]);
  const diagnostics = useMemo(() => readObject(response?.diagnostics), [response]);
  const manifest = useMemo(() => readObject(response?.manifest), [response]);

  const loadStatus = useCallback(async () => {
    const founderCode = readStoredFounderCode();

    if (!founderCode) {
      setState("locked");
      setError(
        "Δεν βρέθηκε founder/admin unlock σε αυτή τη συσκευή. Άνοιξε πρώτα το Mobile Founder unlock."
      );
      setResponse(null);
      return;
    }

    setState("loading");
    setError(null);

    try {
      const result = await fetch("/api/professional/infrastructure/water/master/b", {
        method: "GET",
        headers: {
          "x-pantavion-water-founder-code": founderCode,
        },
        cache: "no-store",
      });

      const payload = (await result.json()) as BMasterApiResponse;

      if (!result.ok || payload.ok === false) {
        setResponse(payload);
        setState(result.status === 401 || result.status === 404 ? "locked" : "error");
        setError(
          payload.message ||
            payload.error ||
            "Το B Master source proof δεν εγκρίθηκε για αυτή τη συσκευή."
        );
        return;
      }

      setResponse(payload);
      setState("ready");
    } catch (requestError) {
      setState("error");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Άγνωστο σφάλμα σύνδεσης."
      );
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const statusLabel =
    state === "ready"
      ? "CONNECTED"
      : state === "loading"
        ? "CHECKING"
        : state === "locked"
          ? "LOCKED"
          : state === "error"
            ? "ERROR"
            : "WAITING";

  return (
    <main className="min-h-screen bg-[#06101f] px-4 py-8 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 shadow-2xl shadow-black/40 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#d8b45f]">
          Pantavion Protected Water Infrastructure
        </p>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              B Map — Γνήσιο DWG Source Proof
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">
              Ελαφρύς έλεγχος του αυθεντικού B Master DWG από το private vault.
              Δεν φορτώνει raw DWG στο άνοιγμα, δεν εκθέτει αρχείο δημόσια και
              δεν επιτρέπει άμεση αλλαγή master δικτύου.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-300">
              Founder/Admin Session
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Η σελίδα χρησιμοποιεί το ήδη αποθηκευμένο founder unlock της
              συσκευής. Δεν ζητάει κωδικό μέσα στο B Map.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadStatus()}
                disabled={state === "loading"}
                className="rounded-2xl border border-[#f2c766] bg-[#f2c766]/15 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#f8e6ad] transition hover:bg-[#f2c766]/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state === "loading" ? "CHECKING" : "REFRESH B STATUS"}
              </button>

              <a
                href="/professional/infrastructure/water/mobile-founder"
                className="rounded-2xl border border-white/25 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                Founder Unlock
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
              Connection
            </p>
            <p className="mt-3 text-2xl font-black">{statusLabel}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
              Source
            </p>
            <p className="mt-3 text-2xl font-black">DWG</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
              Raw Load
            </p>
            <p className="mt-3 text-2xl font-black text-[#f8e6ad]">BLOCKED</p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-950/35 p-4 text-sm leading-6 text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-lg font-black">B Source Status</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-slate-400">File</dt>
                <dd className="break-all font-semibold">
                  {textValue(
                    response?.filename ??
                      response?.fileName ??
                      response?.pathname ??
                      response?.path
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Manifest</dt>
                <dd className="break-all font-semibold">
                  {textValue(response?.manifestPath ?? manifest.path)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Chunk prefix</dt>
                <dd className="break-all font-semibold">
                  {textValue(response?.chunkPrefix ?? manifest.chunkPrefix)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-lg font-black">Protection Policy</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-slate-400">Private vault</dt>
                <dd className="font-semibold">
                  {yesNo(policy.privateVault ?? diagnostics.privateVault)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Raw DWG exposed on open</dt>
                <dd className="font-semibold text-[#f8e6ad]">NO</dd>
              </div>
              <div>
                <dt className="text-slate-400">Direct master mutation</dt>
                <dd className="font-semibold text-[#f8e6ad]">NO</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 p-4 text-sm leading-7 text-[#fff2c2]">
          Επόμενο πρακτικό στάδιο: B derived lightweight map view και μετά C
          Intelligent Map με approved αλλαγές, φωτογραφίες, σημειώσεις, βλάβες,
          βάνες, οδούς, ζώνες, πίεση, PRV και μελλοντική τηλεμετρία.
        </div>

        <details className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-sm font-bold text-[#f8e6ad]">
            Raw protected status JSON
          </summary>
          <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/40 p-4 text-xs text-slate-200">
            {response
              ? JSON.stringify(response, null, 2)
              : "Δεν έχει φορτωθεί protected B status ακόμα."}
          </pre>
        </details>
      </section>
    </main>
  );
}
