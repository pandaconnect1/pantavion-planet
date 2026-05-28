"use client";

import { useMemo, useState } from "react";

type KernelEndpointKey =
  | "heartbeat"
  | "gap-intelligence"
  | "product-dna"
  | "research-assimilation";

type KernelEndpoint = {
  key: KernelEndpointKey;
  title: string;
  path: string;
  purpose: string;
};

type KernelCallState = {
  loading: boolean;
  ok: boolean | null;
  statusCode?: number;
  updatedAt?: string;
  error?: string;
  data?: unknown;
};

const KERNEL_ENDPOINTS: KernelEndpoint[] = [
  {
    key: "heartbeat",
    title: "Kernel Heartbeat",
    path: "/api/kernel/heartbeat",
    purpose: "Multi-core readiness, signal awareness, SOS/offline readiness, memory policy, global research atlas.",
  },
  {
    key: "gap-intelligence",
    title: "Gap Intelligence",
    path: "/api/kernel/gap-intelligence",
    purpose: "Turns Pantavion gaps and market gaps into repair, innovation, and advantage targets.",
  },
  {
    key: "product-dna",
    title: "Product DNA",
    path: "/api/kernel/product-dna",
    purpose: "Locks the one-platform vision: social, communication, inbox, contacts, media, professional, SOS, water, AI.",
  },
  {
    key: "research-assimilation",
    title: "Research Assimilation",
    path: "/api/kernel/research-assimilation",
    purpose: "Seven-continent research, legal transformation, Pantavion-owned superior systems.",
  },
];

function safeString(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function extractMarker(data: unknown): string {
  if (!data || typeof data !== "object") return "—";
  const record = data as { marker?: unknown };
  return typeof record.marker === "string" ? record.marker : "—";
}

function extractGeneratedAt(data: unknown): string {
  if (!data || typeof data !== "object") return "—";
  const record = data as { generatedAt?: unknown; kernel?: { checkedAt?: unknown } };
  if (typeof record.generatedAt === "string") return record.generatedAt;
  if (record.kernel && typeof record.kernel.checkedAt === "string") return record.kernel.checkedAt;
  return "—";
}

function extractSummary(data: unknown): Array<{ label: string; value: string }> {
  if (!data || typeof data !== "object") return [];

  const record = data as Record<string, unknown>;
  const rows: Array<{ label: string; value: string }> = [];

  if ("ok" in record) rows.push({ label: "ok", value: safeString(record.ok) });
  if ("marker" in record) rows.push({ label: "marker", value: safeString(record.marker) });
  if ("status" in record) rows.push({ label: "status", value: safeString(record.status) });

  const kernel = record.kernel as Record<string, unknown> | undefined;
  if (kernel) {
    rows.push({ label: "kernel status", value: safeString(kernel.status) });
    rows.push({ label: "mode", value: safeString(kernel.mode) });
    rows.push({ label: "founder PC required", value: safeString(kernel.founderPcRequired) });
    rows.push({ label: "runtime", value: safeString(kernel.runtimeEnvironment) });
  }

  const signal = record.signalAwareness as Record<string, unknown> | undefined;
  if (signal) {
    rows.push({ label: "offline survival", value: safeString(signal.userDeviceOfflineMode) });
    rows.push({ label: "satellite channel", value: safeString(signal.satelliteSupportedChannel) });
    rows.push({ label: "false satellite guarantee", value: safeString(signal.falseSatelliteGuarantee) });
  }

  const memory = record.memoryPolicy as Record<string, unknown> | undefined;
  if (memory) {
    rows.push({ label: "memory strategy", value: safeString(memory.strategy) });
    rows.push({ label: "lightweight retrieval", value: safeString(memory.lightweightFastRetrievalRequired) });
  }

  const atlas = record.globalResearchAtlas as Record<string, unknown> | undefined;
  if (atlas) {
    rows.push({ label: "research atlas", value: safeString(atlas.enabledByDoctrine) });
    rows.push({ label: "7-continent coverage", value: safeString(atlas.sixContinentCoverageRequired) });
  }

  return rows.slice(0, 10);
}

const KERNEL_ACCESS_QUERY = "kernelToken";

function withKernelToken(path: string): string {
  if (typeof window === "undefined") return path;

  const token = new URLSearchParams(window.location.search).get(KERNEL_ACCESS_QUERY);
  if (!token) return path;

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${KERNEL_ACCESS_QUERY}=${encodeURIComponent(token)}`;
}

export function KernelLivePanelClient() {
  const initialState = useMemo(() => {
    return KERNEL_ENDPOINTS.reduce<Record<KernelEndpointKey, KernelCallState>>((acc, endpoint) => {
      acc[endpoint.key] = { loading: false, ok: null };
      return acc;
    }, {} as Record<KernelEndpointKey, KernelCallState>);
  }, []);

  const [state, setState] = useState<Record<KernelEndpointKey, KernelCallState>>(initialState);
  const [selectedKey, setSelectedKey] = useState<KernelEndpointKey>("heartbeat");

  async function callEndpoint(endpoint: KernelEndpoint) {
    setSelectedKey(endpoint.key);
    setState((current) => ({
      ...current,
      [endpoint.key]: {
        ...current[endpoint.key],
        loading: true,
        error: undefined,
      },
    }));

    try {
      const response = await fetch(withKernelToken(endpoint.path), {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const data = (await response.json()) as unknown;

      setState((current) => ({
        ...current,
        [endpoint.key]: {
          loading: false,
          ok: response.ok,
          statusCode: response.status,
          updatedAt: new Date().toISOString(),
          data,
        },
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        [endpoint.key]: {
          loading: false,
          ok: false,
          updatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown Kernel API error",
        },
      }));
    }
  }

  async function refreshAll() {
    for (const endpoint of KERNEL_ENDPOINTS) {
      await callEndpoint(endpoint);
    }
  }

  const selectedEndpoint = KERNEL_ENDPOINTS.find((endpoint) => endpoint.key === selectedKey) ?? KERNEL_ENDPOINTS[0];
  const selectedState = state[selectedKey];

  const healthyCount = KERNEL_ENDPOINTS.filter((endpoint) => state[endpoint.key].ok === true).length;

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-8 text-white sm:px-6 lg:px-10">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-[#111827] via-[#08111f] to-[#05070d] p-6 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">
            Pantavion Guardian Kernel
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Live Kernel Control Panel
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
            Ζωντανή οθόνη ελέγχου για heartbeat, gap intelligence, Product DNA και research assimilation.
            Κάθε κουμπί καλεί πραγματικό API route. Δεν είναι στατικό panel.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Live API checks passed</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                {healthyCount}/{KERNEL_ENDPOINTS.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Founder PC required</p>
              <p className="mt-2 text-2xl font-semibold text-amber-200">false</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Dead buttons allowed</p>
              <p className="mt-2 text-2xl font-semibold text-rose-200">false</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={refreshAll}
              className="rounded-2xl border border-amber-300/40 bg-amber-300 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-500/10 transition hover:bg-amber-200"
            >
              Run all Kernel checks
            </button>
            <a
              href={withKernelToken("/api/kernel/heartbeat")}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open heartbeat JSON
            </a>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="space-y-3">
            {KERNEL_ENDPOINTS.map((endpoint) => {
              const endpointState = state[endpoint.key];
              const isSelected = endpoint.key === selectedKey;

              return (
                <article
                  key={endpoint.key}
                  className={[
                    "rounded-3xl border p-4 transition",
                    isSelected
                      ? "border-amber-300/50 bg-amber-300/10"
                      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-white">{endpoint.title}</h2>
                      <p className="mt-2 text-xs leading-5 text-slate-300">{endpoint.purpose}</p>
                    </div>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        endpointState.ok === true
                          ? "bg-emerald-400/15 text-emerald-200"
                          : endpointState.ok === false
                            ? "bg-rose-400/15 text-rose-200"
                            : "bg-slate-400/15 text-slate-200",
                      ].join(" ")}
                    >
                      {endpointState.loading
                        ? "checking"
                        : endpointState.ok === true
                          ? "live"
                          : endpointState.ok === false
                            ? "error"
                            : "not checked"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => callEndpoint(endpoint)}
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                    >
                      Call API
                    </button>
                    <a
                      href={withKernelToken(endpoint.path)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                    >
                      Open JSON
                    </a>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-500">{endpoint.path}</p>
                </article>
              );
            })}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-200/70">
                  Selected live result
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{selectedEndpoint.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => callEndpoint(selectedEndpoint)}
                className="rounded-2xl border border-amber-300/40 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/10"
              >
                Refresh selected
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-400">HTTP</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {selectedState.statusCode ?? "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-400">Marker</p>
                <p className="mt-2 break-words text-sm font-semibold text-white">
                  {extractMarker(selectedState.data)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-slate-400">Generated / checked</p>
                <p className="mt-2 break-words text-sm font-semibold text-white">
                  {extractGeneratedAt(selectedState.data)}
                </p>
              </div>
            </div>

            {selectedState.error ? (
              <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                {selectedState.error}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              {extractSummary(selectedState.data).map((row) => (
                <div
                  key={`${row.label}-${row.value}`}
                  className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[220px_1fr]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {row.label}
                  </p>
                  <p className="break-words text-sm text-white">{row.value}</p>
                </div>
              ))}
            </div>

            <details className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-amber-100">
                Raw JSON response
              </summary>
              <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/40 p-4 text-xs leading-5 text-slate-200">
                {selectedState.data
                  ? JSON.stringify(selectedState.data, null, 2)
                  : "Press a Kernel API button to load live data."}
              </pre>
            </details>
          </section>
        </div>
      </section>
    </main>
  );
}
