"use client";

import { useEffect, useState } from "react";

type KernelPlanStep = {
  id: string;
  title: string;
  module: string;
  status: string;
  reason: string;
  targetFile?: string;
};

type KernelRun = {
  id: string;
  input: string;
  classification: {
    detectedType: string;
    targetModule: string;
    userSegment: string;
    incomeRelated: boolean;
    learningRelated: boolean;
    toolDiscovery: boolean;
    businessFramework: boolean;
    deliveryMode: string;
    cleanConclusion: string;
  };
  plan: KernelPlanStep[];
  outputs: string[];
  createdAt: string;
};

type KernelMemory = {
  id: string;
  kind: string;
  content: string;
  createdAt: string;
};

type KernelStatePayload = {
  ok: boolean;
  state: {
    kernelName: string;
    constitutionVersion: number;
    memories: KernelMemory[];
    runs: KernelRun[];
    lastUpdatedAt: string;
  };
  capabilities: {
    key: string;
    title: string;
    description: string;
  }[];
};

type KernelRunPayload = {
  ok: boolean;
  result: {
    run: KernelRun;
    stateSummary: {
      totalRuns: number;
      totalMemories: number;
      lastUpdatedAt: string;
    };
  };
};

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "gold" | "green" | "blue";
}) {
  const style =
    tone === "gold"
      ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
      : tone === "green"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
        : tone === "blue"
          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
          : "border-white/10 bg-white/5 text-zinc-300";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${style}`}>
      {children}
    </span>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm text-zinc-300">{label}</span>
      <Badge tone={value ? "green" : "default"}>{value ? "yes" : "no"}</Badge>
    </div>
  );
}

export default function KernelRunPage() {
  const [input, setInput] = useState("");
  const [state, setState] = useState<KernelStatePayload["state"] | null>(null);
  const [capabilities, setCapabilities] = useState<KernelStatePayload["capabilities"]>([]);
  const [lastRun, setLastRun] = useState<KernelRun | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [running, setRunning] = useState(false);

  async function loadState() {
    setLoadingState(true);

    const res = await fetch("/api/kernel/state", { cache: "no-store" });
    const data: KernelStatePayload = await res.json();

    if (data.ok) {
      setState(data.state);
      setCapabilities(data.capabilities);
      setLastRun(data.state.runs[0] ?? null);
    }

    setLoadingState(false);
  }

  useEffect(() => {
    loadState();
  }, []);

  async function runKernel() {
    if (!input.trim()) return;

    setRunning(true);

    const res = await fetch("/api/kernel/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ input })
    });

    const data: KernelRunPayload = await res.json();

    if (data.ok) {
      setLastRun(data.result.run);
      await loadState();
    }

    setRunning(false);
  }

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[30px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-violet-500/10 p-6">
          <div className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/80">
            Pantavion Kernel OS
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Real Kernel Run Console</h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Server-side constitution, canonical memory, planner, orchestrator and state persistence.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="γράψε input π.χ. build multilingual voice agent for business support"
              className="min-h-[120px] rounded-3xl border border-white/10 bg-black/20 px-5 py-4 text-sm text-white outline-none placeholder:text-zinc-500"
            />
            <div className="flex flex-col gap-3">
              <button
                onClick={runKernel}
                disabled={running}
                className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 disabled:opacity-50"
              >
                {running ? "running..." : "run kernel"}
              </button>

              <button
                onClick={loadState}
                disabled={loadingState}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-zinc-100 disabled:opacity-50"
              >
                refresh state
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Kernel</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {state?.kernelName ?? "loading"}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Constitution</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              v{state?.constitutionVersion ?? "…"}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Runs</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {state?.runs.length ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Memory</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {state?.memories.length ?? 0}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold text-white">Capabilities</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {capabilities.map((cap) => (
                  <Badge key={cap.key} tone="blue">{cap.title}</Badge>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold text-white">Last Run</h2>

              {!lastRun ? (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                  No runs yet.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">{lastRun.input}</div>
                    <div className="mt-2 text-xs text-zinc-500">{lastRun.createdAt}</div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Detected type</div>
                      <div className="mt-2 text-xl font-semibold text-white">{lastRun.classification.detectedType}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Target module</div>
                      <div className="mt-2 text-xl font-semibold text-white">{lastRun.classification.targetModule}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">User segment</div>
                      <div className="mt-2 text-xl font-semibold text-white">{lastRun.classification.userSegment}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Delivery mode</div>
                      <div className="mt-2 text-xl font-semibold text-white">{lastRun.classification.deliveryMode}</div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-5">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-yellow-200">
                      Πολύ καθαρό συμπέρασμα
                    </div>
                    <p className="mt-3 text-sm leading-7 text-yellow-100">
                      {lastRun.classification.cleanConclusion}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <BoolRow label="Income-related" value={lastRun.classification.incomeRelated} />
                    <BoolRow label="Learning-related" value={lastRun.classification.learningRelated} />
                    <BoolRow label="Tool-discovery" value={lastRun.classification.toolDiscovery} />
                    <BoolRow label="Business-framework" value={lastRun.classification.businessFramework} />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">Plan</div>
                    <div className="mt-4 space-y-3">
                      {lastRun.plan.map((step) => (
                        <div key={step.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">{step.title}</div>
                              <div className="mt-1 text-xs text-zinc-500">{step.reason}</div>
                            </div>
                            <Badge tone="blue">{step.module}</Badge>
                          </div>
                          {step.targetFile ? (
                            <div className="mt-3 text-xs text-cyan-200">
                              target: {step.targetFile}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">Outputs</div>
                    <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                      {lastRun.outputs.map((output, index) => (
                        <li key={`${output}-${index}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                          {output}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold text-white">Canonical Memory</h2>
              <div className="mt-4 space-y-3">
                {state?.memories.slice(0, 20).map((memory) => (
                  <div key={memory.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{memory.kind}</div>
                      <Badge>{memory.createdAt}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">{memory.content}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
