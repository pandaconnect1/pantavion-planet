"use client";

import { useEffect, useMemo, useState } from "react";
import { loadKernelState, saveKernelState, resetKernelState } from "../../kernel/store";
import { addMemoryEntry } from "../../kernel/memory";
import { addPlannerEntry } from "../../kernel/planner";
import { addTaskEntry } from "../../kernel/runner";
import { addSignalEntry, promoteTopSignal } from "../../kernel/intelligence";
import { addAuditEntry } from "../../kernel/audit";
import { runEvolutionCycle } from "../../kernel/evolution";
import { getKernelStats } from "../../kernel/stats";
import type { KernelState, KernelPriority } from "../../kernel/types";

function box(title: string, value: string | number) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function badge(v: string) {
  let c = "border-white/10 bg-white/5 text-zinc-300";
  if (v === "green" || v === "active" || v === "adopt") c = "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (v === "yellow" || v === "watch" || v === "high") c = "border-amber-500/30 bg-amber-500/10 text-amber-200";
  if (v === "critical" || v === "red") c = "border-rose-500/30 bg-rose-500/10 text-rose-200";
  if (v === "trial") c = "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
  return `inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${c}`;
}

export default function EvolutionPage() {
  const [state, setState] = useState<KernelState>(loadKernelState());
  const [memoryText, setMemoryText] = useState("");
  const [plannerTitle, setPlannerTitle] = useState("");
  const [plannerDetail, setPlannerDetail] = useState("");
  const [signalName, setSignalName] = useState("");
  const [signalDescription, setSignalDescription] = useState("");
  const [priority, setPriority] = useState<KernelPriority>("high");

  useEffect(() => {
    saveKernelState(state);
  }, [state]);

  const stats = useMemo(() => getKernelStats(state), [state]);

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-violet-500/10 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                Pantavion Kernel App / Builder Brain
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">Evolution Console</h1>
              <p className="mt-3 text-zinc-300">
                Governed kernel for Pantavion: memory, planner, runner, registry, intelligence, radar, audit, evolution.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setState((s) => runEvolutionCycle(s))}
                className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200"
              >
                Run Evolution
              </button>
              <button
                onClick={() => setState((s) => addTaskEntry(s, { title: "Manual Kernel Task", area: "kernel.manual", priority: "high" }))}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100"
              >
                Queue Task
              </button>
              <button
                onClick={() => setState(resetKernelState())}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {box("Memory", stats.memory)}
          {box("Planner", stats.planner)}
          {box("Tasks Done", stats.tasksDone)}
          {box("Radar", stats.radar)}
          {box("Signals", stats.signals)}
          {box("Audit", stats.audit)}
          {box("Queued Tasks", stats.tasksQueued)}
          {box("Healthy Modules", `${stats.healthyModules}/${state.modules.length}`)}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-lg font-semibold text-white">Memory</h2>
              <div className="mt-4 flex gap-3">
                <input
                  value={memoryText}
                  onChange={(e) => setMemoryText(e.target.value)}
                  placeholder="Store durable kernel memory"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                />
                <button
                  onClick={() => {
                    if (!memoryText.trim()) return;
                    setState((s) => addAuditEntry(addMemoryEntry(s, { text: memoryText, tags: ["kernel"], kind: "directive" }), "memory.add", "memory", memoryText));
                    setMemoryText("");
                  }}
                  className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200"
                >
                  Save
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {state.memory.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{m.text}</div>
                      <span className={badge(m.kind)}>{m.kind}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.tags.map((tag) => (
                        <span key={tag} className={badge(tag)}>{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-lg font-semibold text-white">Planner</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  value={plannerTitle}
                  onChange={(e) => setPlannerTitle(e.target.value)}
                  placeholder="Planner title"
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as KernelPriority)}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </div>
              <textarea
                value={plannerDetail}
                onChange={(e) => setPlannerDetail(e.target.value)}
                placeholder="Exact next kernel move"
                className="mt-3 min-h-[96px] w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <button
                onClick={() => {
                  if (!plannerTitle.trim() || !plannerDetail.trim()) return;
                  setState((s) =>
                    addAuditEntry(
                      addPlannerEntry(s, {
                        title: plannerTitle,
                        detail: plannerDetail,
                        domain: "kernel.next",
                        priority,
                      }),
                      "planner.add",
                      "planner",
                      plannerTitle
                    )
                  );
                  setPlannerTitle("");
                  setPlannerDetail("");
                  setPriority("high");
                }}
                className="mt-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200"
              >
                Add Planner Entry
              </button>

              <div className="mt-4 space-y-3">
                {state.planner.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{p.title}</div>
                        <div className="mt-1 text-xs text-zinc-500">{p.domain}</div>
                      </div>
                      <span className={badge(p.priority)}>{p.priority}</span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">{p.detail}</p>
                    <div className="mt-2 text-xs text-zinc-400">status: {p.status}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-lg font-semibold text-white">Signals + Radar</h2>
              <input
                value={signalName}
                onChange={(e) => setSignalName(e.target.value)}
                placeholder="Signal name"
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <textarea
                value={signalDescription}
                onChange={(e) => setSignalDescription(e.target.value)}
                placeholder="Signal description"
                className="mt-3 min-h-[88px] w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => {
                    if (!signalName.trim() || !signalDescription.trim()) return;
                    setState((s) =>
                      addAuditEntry(
                        addSignalEntry(s, {
                          name: signalName,
                          category: "kernel",
                          description: signalDescription,
                          impact: 5,
                          confidence: 4,
                          urgency: 4,
                        }),
                        "signal.add",
                        "signal",
                        signalName
                      )
                    );
                    setSignalName("");
                    setSignalDescription("");
                  }}
                  className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200"
                >
                  Add Signal
                </button>
                <button
                  onClick={() => setState((s) => addAuditEntry(promoteTopSignal(s), "radar.promote", "radar", "Promoted top signal."))}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-100"
                >
                  Promote Top Signal
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  {state.signals.map((s) => (
                    <div key={s.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-sm font-semibold text-white">{s.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">{s.category}</div>
                      <p className="mt-3 text-sm text-zinc-300">{s.description}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {state.radar.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{r.label}</div>
                          <div className="mt-1 text-xs text-zinc-500">{r.category} • score {r.score}</div>
                        </div>
                        <span className={badge(r.ring)}>{r.ring}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-lg font-semibold text-white">Modules</h2>
              <div className="mt-4 space-y-3">
                {state.modules.map((m) => (
                  <div key={m.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{m.title}</div>
                        <div className="mt-1 text-xs text-zinc-500">runs {m.runs} • changes {m.changes} • errors {m.errors}</div>
                      </div>
                      <div className="flex gap-2">
                        <span className={badge(m.health)}>{m.health}</span>
                        <span className={badge(m.state)}>{m.state}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-lg font-semibold text-white">Capabilities</h2>
              <div className="mt-4 space-y-3">
                {state.capabilities.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">{c.title}</div>
                    <div className="mt-1 text-xs text-zinc-500">{c.key} • {c.owner}</div>
                    <div className="mt-3 flex gap-2">
                      <span className={badge(c.maturity)}>{c.maturity}</span>
                      <span className={badge(c.status)}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-lg font-semibold text-white">Tasks</h2>
              <div className="mt-4 space-y-3">
                {state.tasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                    No tasks yet.
                  </div>
                ) : null}
                {state.tasks.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{t.title}</div>
                        <div className="mt-1 text-xs text-zinc-500">{t.area}</div>
                      </div>
                      <span className={badge(t.status)}>{t.status}</span>
                    </div>
                    {t.result ? <p className="mt-3 text-sm text-zinc-300">{t.result}</p> : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-lg font-semibold text-white">Audit</h2>
              <div className="mt-4 space-y-3">
                {state.audit.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">{a.action}</div>
                    <div className="mt-1 text-xs text-zinc-500">{a.entity}</div>
                    <p className="mt-3 text-sm text-zinc-300">{a.message}</p>
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


