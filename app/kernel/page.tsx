"use client";

import { useEffect, useMemo, useState } from "react";

type KernelApiResult = {
  ok: boolean;
  result?: {
    normalized: {
      id: string;
      timestamp: string;
      title: string;
      text: string;
      source: string;
      keywords: string[];
      signals: string[];
    };
    classification: {
      type: string;
      domain: string;
      intent: string;
      confidence: number;
      tags: string[];
      reasoning: string[];
    };
    registry: {
      mapping: {
        workspace: string;
        category: string;
        module: string;
        core: string;
        policyZone: string;
        entityFamily: string;
      };
      reasons: string[];
      collections: string[];
    };
    capability: {
      capabilities: string[];
      actions: string[];
      reasons: string[];
    };
    gaps: {
      status: string;
      items: Array<{
        code: string;
        severity: string;
        message: string;
        suggestedFix: string;
      }>;
      buildTasks: string[];
    };
    security: {
      status: string;
      riskScore: number;
      findings: Array<{
        code: string;
        level: string;
        message: string;
      }>;
      requiresHumanApproval: boolean;
    };
    policy: {
      status: string;
      reason: string[];
      policyZone: string;
    };
    priority: {
      bucket: string;
      score: number;
      reason: string[];
    };
    execution: {
      state: string;
      executionMode: string;
      reason: string[];
    };
  };
  error?: string;
};

type MemoryApiResult = {
  ok: boolean;
  memory?: {
    total: number;
    items: Array<{
      id: string;
      timestamp: string;
      input: {
        title: string;
        text: string;
        source: string;
        keywords: string[];
        signals: string[];
      };
      classification: {
        type: string;
        domain: string;
        intent: string;
        confidence: number;
        tags: string[];
      };
      mapping: {
        workspace: string;
        category: string;
        module: string;
        core: string;
        policyZone: string;
      };
      execution: {
        decision: string;
        priority: string;
        reason: string[];
      };
    }>;
  };
  error?: string;
};

const EXAMPLES = [
  {
    title: "AI tools για marketing",
    text: "έλω να βρει, να ομαδοποιήσει και να τα βάλει σωστά σε workspace, category και module."
  },
  {
    title: "Voice translation architecture",
    text: "Build kernel routing for STT, TTS, language detect, bidirectional translation and fallback continuity."
  },
  {
    title: "RAG vs CAG",
    text: "Compare retrieval augmented generation and cache augmented generation for Pantavion knowledge runtime."
  }
];

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#2A4D7A] bg-[#0A1A31] px-3 py-1 text-xs text-[#D7E3F8]">
      {children}
    </span>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-[#20447A] bg-[linear-gradient(180deg,rgba(8,24,53,0.96)_0%,rgba(8,30,68,0.93)_100%)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <div className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#D6A646]">{title}</div>
      {children}
    </section>
  );
}

export default function PantavionKernelPage() {
  const [title, setTitle] = useState("AI tools για marketing");
  const [text, setText] = useState(
    "έλω να βρει, να ομαδοποιήσει και να τα βάλει σωστά σε workspace, category και module."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KernelApiResult["result"]>();
  const [error, setError] = useState("");
  const [memory, setMemory] = useState<MemoryApiResult["memory"]>();

  async function loadMemory() {
    try {
      const response = await fetch("/api/kernel", { cache: "no-store" });
      const data: MemoryApiResult = await response.json();
      if (data.ok) {
        setMemory(data.memory);
      }
    } catch {}
  }

  useEffect(() => {
    loadMemory();
  }, []);

  async function runKernel() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/kernel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          text,
          kind: "text",
        }),
      });

      const data: KernelApiResult = await response.json();

      if (!data.ok || !data.result) {
        setError(data.error || "Kernel execution failed.");
        setResult(undefined);
      } else {
        setResult(data.result);
        await loadMemory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown execution error.");
      setResult(undefined);
    } finally {
      setLoading(false);
    }
  }

  const confidenceLabel = useMemo(() => {
    if (!result) return "";
    return `${Math.round(result.classification.confidence * 100)}%`;
  }, [result]);

  return (
    <main className="min-h-screen bg-[#041633] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.45em] text-[#D6A646]">
              Pantavion Kernel Studio
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Kernel 0 Execution Surface
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#D3E0F6] md:text-base">
              Intake → Classification → Gap Detection → Mapping → Security Review →
              Policy Decision → Priority Scoring → Execution Decision
            </p>
          </div>

          <a
            href="/"
            className="inline-flex rounded-2xl border border-[#D6A646]/50 bg-[#0B234F] px-5 py-3 text-sm font-medium text-[#F1C86A] transition hover:bg-[#12316A]"
          >
            Back to Pantavion
          </a>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCard title="Kernel Input">
            <div className="space-y-4">
              <label className="block">
                <div className="mb-2 text-sm text-[#D9E5F8]">Title</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-[#2B4C7D] bg-[#08172D] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D6A646]"
                  placeholder="Write a kernel title..."
                />
              </label>

              <label className="block">
                <div className="mb-2 text-sm text-[#D9E5F8]">Text</div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-[#2B4C7D] bg-[#08172D] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D6A646]"
                  placeholder="Describe the request or research signal..."
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={runKernel}
                  disabled={loading}
                  className="rounded-2xl border border-[#F0C76B]/75 bg-[linear-gradient(180deg,#E5BD68_0%,#BE8C2F_100%)] px-5 py-3 text-sm font-semibold text-[#07152D] shadow-[0_0_22px_rgba(213,166,62,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Running Kernel..." : "Run Kernel"}
                </button>

                <button
                  onClick={() => {
                    setTitle("");
                    setText("");
                    setError("");
                    setResult(undefined);
                  }}
                  className="rounded-2xl border border-[#3967BB] bg-[#0D327C] px-5 py-3 text-sm font-medium text-[#E2EBFB] transition hover:bg-[#124094]"
                >
                  Clear
                </button>
              </div>

              <div>
                <div className="mb-3 text-sm text-[#D9E5F8]">Quick examples</div>
                <div className="flex flex-wrap gap-3">
                  {EXAMPLES.map((example) => (
                    <button
                      key={example.title}
                      onClick={() => {
                        setTitle(example.title);
                        setText(example.text);
                      }}
                      className="rounded-2xl border border-[#23477C] bg-[#081A34] px-4 py-2 text-left text-xs text-[#D9E5F8] transition hover:bg-[#0D2345]"
                    >
                      {example.title}
                    </button>
                  ))}
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title="Structured Output">
              {!result ? (
                <div className="rounded-2xl border border-dashed border-[#2A4874] bg-[#08172D]/70 px-5 py-8 text-sm text-[#AFC2E6]">
                  No kernel result yet. Run the input to see classification, registry mapping,
                  capability profile, policy, security and execution.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[#214991] bg-[#0A1B35] p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-[#D6A646]">Type</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {result.classification.type}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#214991] bg-[#0A1B35] p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-[#D6A646]">Domain</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {result.classification.domain}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#214991] bg-[#0A1B35] p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-[#D6A646]">Intent</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {result.classification.intent}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#214991] bg-[#0A1B35] p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-[#D6A646]">Confidence</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {confidenceLabel}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[#214991] bg-[#0A1B35] p-4">
                      <div className="mb-3 text-sm font-semibold text-white">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {result.classification.tags.map((tag) => (
                          <Chip key={tag}>{tag}</Chip>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#214991] bg-[#0A1B35] p-4">
                      <div className="mb-3 text-sm font-semibold text-white">Registry Mapping</div>
                      <div className="grid gap-2 text-sm text-[#DDE7F9]">
                        <div>Workspace: {result.registry.mapping.workspace}</div>
                        <div>Category: {result.registry.mapping.category}</div>
                        <div>Module: {result.registry.mapping.module}</div>
                        <div>Core: {result.registry.mapping.core}</div>
                        <div>Policy Zone: {result.registry.mapping.policyZone}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#214991] bg-[#0A1B35] p-4">
                      <div className="mb-3 text-sm font-semibold text-white">Capabilities</div>
                      <div className="flex flex-wrap gap-2">
                        {result.capability.capabilities.map((item) => (
                          <Chip key={item}>{item}</Chip>
                        ))}
                      </div>
                      <div className="mt-4 mb-3 text-sm font-semibold text-white">Actions</div>
                      <div className="flex flex-wrap gap-2">
                        {result.capability.actions.map((item) => (
                          <Chip key={item}>{item}</Chip>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#214991] bg-[#0A1B35] p-4">
                      <div className="mb-3 text-sm font-semibold text-white">Execution</div>
                      <div className="grid gap-2 text-sm text-[#DDE7F9]">
                        <div>State: {result.execution.state}</div>
                        <div>Mode: {result.execution.executionMode}</div>
                        <div>Priority: {result.priority.bucket} ({result.priority.score})</div>
                        <div>Policy: {result.policy.status}</div>
                        <div>Security: {result.security.status} / risk {result.security.riskScore}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[#214991] bg-[#0A1B35] p-4">
                      <div className="mb-3 text-sm font-semibold text-white">Reasoning</div>
                      <ul className="space-y-2 text-sm text-[#DDE7F9]">
                        {result.classification.reasoning.map((item, index) => (
                          <li key={`${item}-${index}`}>• {item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-[#214991] bg-[#0A1B35] p-4">
                      <div className="mb-3 text-sm font-semibold text-white">Gap Report</div>
                      <div className="mb-3 text-sm text-[#DDE7F9]">
                        Status: {result.gaps.status}
                      </div>
                      {result.gaps.items.length ? (
                        <ul className="space-y-3 text-sm text-[#DDE7F9]">
                          {result.gaps.items.map((gap) => (
                            <li key={gap.code} className="rounded-xl border border-[#2A4874] bg-[#0C203C] p-3">
                              <div className="font-semibold text-white">
                                {gap.code} · {gap.severity}
                              </div>
                              <div className="mt-1">{gap.message}</div>
                              <div className="mt-2 text-[#BFD0EE]">
                                Fix: {gap.suggestedFix}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-[#DDE7F9]">No gap items.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Kernel Memory">
              <div className="mb-4 text-sm text-[#D7E3F8]">
                Stored records: {memory?.total ?? 0}
              </div>

              <div className="space-y-3">
                {!memory?.items?.length ? (
                  <div className="rounded-2xl border border-dashed border-[#2A4874] bg-[#08172D]/70 px-5 py-6 text-sm text-[#AFC2E6]">
                    No memory records yet.
                  </div>
                ) : (
                  memory.items.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#214991] bg-[#0A1B35] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white">
                          {item.input.title || "Untitled kernel input"}
                        </div>
                        <div className="text-xs text-[#B2C4E5]">{item.timestamp}</div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Chip>{item.classification.type}</Chip>
                        <Chip>{item.classification.domain}</Chip>
                        <Chip>{item.classification.intent}</Chip>
                        <Chip>{item.mapping.module}</Chip>
                        <Chip>{item.execution.decision}</Chip>
                      </div>

                      <div className="mt-3 text-sm text-[#D7E3F8]">
                        {item.input.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}
