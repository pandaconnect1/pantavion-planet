"use client";

import { useEffect, useMemo, useState } from "react";
import { loadKernelState, resetKernelState, saveKernelState } from "../../kernel/store";
import { addMemoryEntry } from "../../kernel/memory";
import { addPlannerEntry } from "../../kernel/planner";
import { addAuditEntry } from "../../kernel/audit";
import { addTaskEntry } from "../../kernel/runner";
import { runEvolutionCycle } from "../../kernel/evolution";
import { getKernelStats } from "../../kernel/stats";
import type { KernelPriority, KernelState } from "../../kernel/types";

function statBox(title: string, value: string | number) {
  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function safeKernelState(): KernelState {
  return loadKernelState() as KernelState;
}

function enabledModulesCount(state: KernelState): number {
  const enabled = (state as any)?.capabilities?.enabled;
  return Array.isArray(enabled) ? enabled.length : 0;
}

function recommendedCapabilities(state: KernelState): string[] {
  const items = (state as any)?.capabilities?.recommended;
  return Array.isArray(items) ? items.filter((item: unknown) => typeof item === "string") : [];
}

export default function EvolutionPage() {
  const [state, setState] = useState<KernelState>(() => safeKernelState());
  const [memoryText, setMemoryText] = useState("");
  const [plannerText, setPlannerText] = useState("");
  const [taskText, setTaskText] = useState("");
  const [priority, setPriority] = useState<KernelPriority>("HIGH");

  useEffect(() => {
    saveKernelState(state as any);
  }, [state]);

  const stats = useMemo(() => getKernelStats(state as any), [state]);
  const healthyModulesDisplay = `${stats.healthyModules}/${enabledModulesCount(state) || stats.healthyModules || 0}`;
  const recommended = recommendedCapabilities(state);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.35em] text-cyan-300">Pantavion Kernel</div>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">Evolution Console</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300">
              Controlled kernel evolution surface for memory, planning, tasks, signals, audit continuity, and
              governed runtime checks.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setState((current) => runEvolutionCycle(current as any) as KernelState)}
              className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200"
            >
              Run Evolution Cycle
            </button>

            <button
              onClick={() => setState(() => resetKernelState() as KernelState)}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200"
            >
              Reset Kernel State
            </button>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statBox("Memory", stats.memory)}
          {statBox("Planner", stats.planner)}
          {statBox("Tasks Done", stats.tasksDone)}
          {statBox("Radar", stats.radar)}
          {statBox("Signals", stats.signals)}
          {statBox("Audit", stats.audit)}
          {statBox("Queued Tasks", stats.tasksQueued)}
          {statBox("Healthy Modules", healthyModulesDisplay)}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">Kernel Inputs</h2>
              <p className="mt-2 text-sm text-slate-400">
                Add governed memory, planning directives, and execution tasks without touching the live stable UI.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                <div className="mb-3 text-sm font-semibold text-cyan-300">Add Memory Entry</div>
                <textarea
                  value={memoryText}
                  onChange={(event) => setMemoryText(event.target.value)}
                  placeholder="Write a governed memory directive for the kernel..."
                  className="min-h-[120px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      if (!memoryText.trim()) return;

                      setState((current) =>
                        addAuditEntry(
                          addMemoryEntry(current as any, {
                            text: memoryText,
                            content: memoryText,
                            summary: memoryText,
                            tags: ["kernel"],
                            kind: "directive",
                          }),
                          {
                            action: "memory.add",
                            level: "info",
                            message: memoryText,
                            metadata: { category: "memory" },
                          }
                        ) as KernelState
                      );

                      setMemoryText("");
                    }}
                    className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200"
                  >
                    Save Memory
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                <div className="mb-3 text-sm font-semibold text-cyan-300">Add Planner Entry</div>
                <textarea
                  value={plannerText}
                  onChange={(event) => setPlannerText(event.target.value)}
                  placeholder="Write a plan goal or kernel direction..."
                  className="min-h-[120px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as KernelPriority)}
                    className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                    <option value="BACKGROUND">BACKGROUND</option>
                  </select>

                  <button
                    onClick={() => {
                      if (!plannerText.trim()) return;

                      setState((current) =>
                        addAuditEntry(
                          addPlannerEntry(current as any, {
                            title: plannerText,
                            goal: plannerText,
                            summary: plannerText,
                            priorityBand: priority,
                          }),
                          {
                            action: "planner.add",
                            level: "info",
                            message: plannerText,
                            metadata: { category: "planner", priority },
                          }
                        ) as KernelState
                      );

                      setPlannerText("");
                    }}
                    className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200"
                  >
                    Save Plan
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                <div className="mb-3 text-sm font-semibold text-cyan-300">Add Task Entry</div>
                <input
                  value={taskText}
                  onChange={(event) => setTaskText(event.target.value)}
                  placeholder="Describe the next queued kernel task..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      if (!taskText.trim()) return;

                      setState((current) =>
                        addAuditEntry(
                          addTaskEntry(current as any, {
                            title: taskText,
                            description: taskText,
                            status: "pending",
                            kind: "execute",
                          }),
                          {
                            action: "task.add",
                            level: "info",
                            message: taskText,
                            metadata: { category: "task" },
                          }
                        ) as KernelState
                      );

                      setTaskText("");
                    }}
                    className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200"
                  >
                    Queue Task
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-semibold text-white">Kernel Summary</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Priority Band</div>
                <div className="mt-2 text-lg font-semibold text-white">{String(stats.priorityBand)}</div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Radar Ring</div>
                <div className="mt-2 text-lg font-semibold text-white">{String(stats.radarRing)}</div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Health Status</div>
                <div className="mt-2 text-lg font-semibold text-white">{String(stats.healthStatus)}</div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Active Goals</div>
                <div className="mt-2 text-lg font-semibold text-white">{stats.activeGoalCount}</div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Recommended Capabilities</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recommended.length > 0 ? (
                    recommended.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">No recommendations yet.</span>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

