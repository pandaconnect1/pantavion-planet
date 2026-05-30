"use client";

import { useMemo, useState } from "react";

type KernelApiKey = "heartbeat" | "gap" | "product" | "research";

interface KernelApiTarget {
  key: KernelApiKey;
  title: string;
  description: string;
  endpoint: string;
}

interface KernelApiResult {
  key: KernelApiKey;
  title: string;
  endpoint: string;
  http: number;
  ok: boolean;
  marker: string;
  status: string;
  checkedAt: string;
  data: unknown;
  error?: string;
}

const TARGETS: KernelApiTarget[] = [
  {
    key: "heartbeat",
    title: "Kernel Heartbeat",
    description: "Multi-core readiness, signal awareness, SOS/offline readiness, memory policy, global research atlas.",
    endpoint: "/api/kernel/heartbeat",
  },
  {
    key: "gap",
    title: "Gap Intelligence",
    description: "Turns Pantavion gaps and market gaps into repair, innovation, and advantage targets.",
    endpoint: "/api/kernel/gap-intelligence",
  },
  {
    key: "product",
    title: "Product DNA",
    description: "Locks the one-platform vision: social, communication, inbox, contacts, media, professional, SOS, water, AI.",
    endpoint: "/api/kernel/product-dna",
  },
  {
    key: "research",
    title: "Research Assimilation",
    description: "Seven-continent research, legal transformation, Pantavion-owned superior systems.",
    endpoint: "/api/kernel/research-assimilation",
  },
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function textValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function boolValue(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeResult(target: KernelApiTarget, http: number, data: unknown): KernelApiResult {
  const root = asRecord(data);
  const kernel = asRecord(root?.kernel);

  const marker =
    textValue(root?.marker) ??
    textValue(kernel?.marker) ??
    textValue(root?.name) ??
    "unknown";

  const status =
    textValue(root?.status) ??
    textValue(kernel?.status) ??
    "checked";

  const ok =
    boolValue(root?.ok) ??
    (http >= 200 && http < 300);

  const checkedAt =
    textValue(root?.checkedAt) ??
    textValue(root?.generatedAt) ??
    new Date().toISOString();

  return {
    key: target.key,
    title: target.title,
    endpoint: target.endpoint,
    http,
    ok,
    marker,
    status,
    checkedAt,
    data,
  };
}

export default function KernelLivePanelClient() {
  const [results, setResults] = useState<Partial<Record<KernelApiKey, KernelApiResult>>>({});
  const [selectedKey, setSelectedKey] = useState<KernelApiKey>("heartbeat");
  const [running, setRunning] = useState(false);

  const selectedTarget = TARGETS.find((target) => target.key === selectedKey) ?? TARGETS[0];
  const selectedResult = results[selectedTarget.key];

  const checkedResults = useMemo(
    () => TARGETS.map((target) => results[target.key]).filter((result): result is KernelApiResult => Boolean(result)),
    [results]
  );

  const passedCount = checkedResults.filter((result) => result.ok).length;

  async function callTarget(target: KernelApiTarget): Promise<void> {
    setSelectedKey(target.key);

    try {
      const response = await fetch(target.endpoint, { cache: "no-store" });
      let data: unknown = null;

      try {
        data = await response.json();
      } catch {
        data = { ok: false, status: "invalid-json", marker: "pantavion_kernel_invalid_json" };
      }

      const next = normalizeResult(target, response.status, data);
      setResults((current) => ({ ...current, [target.key]: next }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown client fetch failure";

      setResults((current) => ({
        ...current,
        [target.key]: {
          key: target.key,
          title: target.title,
          endpoint: target.endpoint,
          http: 0,
          ok: false,
          marker: "pantavion_kernel_client_fetch_failed",
          status: "client-error",
          checkedAt: new Date().toISOString(),
          data: null,
          error: message,
        },
      }));
    }
  }

  async function runAllChecks(): Promise<void> {
    setRunning(true);

    try {
      for (const target of TARGETS) {
        await callTarget(target);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070d] px-5 py-8 text-white">
      <section className="mx-auto max-w-7xl rounded-[2rem] border border-yellow-400/25 bg-slate-950/80 p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.5em] text-yellow-300">
          Pantavion Guardian Kernel
        </p>

        <h1 className="mt-4 text-4xl font-black md:text-6xl">
          Live Kernel Control Panel
        </h1>

        <p className="mt-4 max-w-4xl text-base leading-8 text-slate-200">
          Ζωντανή founder-only οθόνη ελέγχου. Κάθε κουμπί καλεί πραγματικό Kernel API.
          Δεν είναι στατικό panel.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-sky-200">Live API checks passed</p>
            <p className="mt-3 text-3xl font-black text-emerald-300">{passedCount}/4</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-sky-200">Founder-only production surface</p>
            <p className="mt-3 text-3xl font-black text-yellow-300">protected</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-sky-200">Dead buttons allowed</p>
            <p className="mt-3 text-3xl font-black text-rose-200">false</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runAllChecks}
            disabled={running}
            className="rounded-2xl bg-yellow-300 px-6 py-3 font-bold text-black shadow-lg disabled:opacity-60"
          >
            {running ? "Running checks..." : "Run all Kernel checks"}
          </button>

          <a
            href="/api/kernel/heartbeat"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/40 px-6 py-3 font-bold text-white"
          >
            Open heartbeat JSON
          </a>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          {TARGETS.map((target) => {
            const result = results[target.key];
            const selected = selectedKey === target.key;

            return (
              <article
                key={target.key}
                className={`rounded-3xl border p-5 ${
                  selected ? "border-yellow-300 bg-yellow-300/5" : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black">{target.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-200">{target.description}</p>
                  </div>
                  <span className={result?.ok ? "text-emerald-300" : "text-slate-300"}>
                    {result ? (result.ok ? "live" : "error") : "not checked"}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => callTarget(target)}
                    className="rounded-xl border border-white/30 px-4 py-2 text-sm font-bold"
                  >
                    Call API
                  </button>

                  <a
                    href={target.endpoint}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold"
                  >
                    Open JSON
                  </a>
                </div>

                <p className="mt-3 text-xs text-slate-400">{target.endpoint}</p>
              </article>
            );
          })}
        </div>

        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-yellow-300">
            Selected live result
          </p>

          <h2 className="mt-4 text-3xl font-black">{selectedTarget.title}</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-sm text-sky-200">HTTP</p>
              <p className="mt-3 text-2xl font-black">{selectedResult?.http ?? "—"}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-sm text-sky-200">Marker</p>
              <p className="mt-3 break-words font-bold">{selectedResult?.marker ?? "—"}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-sm text-sky-200">Generated / checked</p>
              <p className="mt-3 break-words font-bold">{selectedResult?.checkedAt ?? "—"}</p>
            </div>
          </div>

          {selectedResult?.error ? (
            <div className="mt-5 rounded-2xl border border-rose-400/40 bg-rose-950/40 p-4 text-rose-100">
              {selectedResult.error}
            </div>
          ) : null}

          <details className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
            <summary className="cursor-pointer font-bold text-yellow-100">Raw JSON response</summary>
            <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap break-words text-xs text-slate-200">
              {selectedResult ? JSON.stringify(selectedResult.data, null, 2) : "Press a Kernel API button to load live data."}
            </pre>
          </details>
        </article>
      </section>
    </main>
  );
}
