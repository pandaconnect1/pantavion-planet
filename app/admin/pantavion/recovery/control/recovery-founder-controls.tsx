"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Stage = "classify" | "canonicalize" | "route" | "audit" | "work_unit_generation";
type Action = "pause_stage" | "resume_stage" | "retry_failed" | "pause_all" | "resume_all";

const stages: Stage[] = ["classify", "canonicalize", "route", "audit", "work_unit_generation"];

export function RecoveryFounderControls() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: Action, stage?: Stage) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/pantavion/recovery/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, stage }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true) {
        throw new Error(payload.detail ?? payload.code ?? `HTTP ${response.status}`);
      }
      const affected = payload.result?.affectedCount ?? 0;
      setMessage(`${action}${stage ? ` · ${stage}` : ""}: ${affected} durable jobs affected.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "control_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-violet-300/20 bg-violet-300/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">Founder controls</p>
          <h2 className="mt-2 text-2xl font-black">Durable pipeline control</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Pause/resume/retry changes only durable stage state. Running fenced jobs are never force-killed, provenance and idempotency remain intact, and every action is written to the founder action audit log.</p>
        </div>
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => run("resume_all")} className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-100 disabled:opacity-50">Resume all</button>
          <button disabled={busy} onClick={() => run("pause_all")} className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-100 disabled:opacity-50">Pause all</button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-5">
        {stages.map((stage) => (
          <article key={stage} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-black uppercase text-slate-300">{stage.replaceAll("_", " ")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => run("resume_stage", stage)} className="rounded-lg border border-emerald-300/25 px-3 py-1.5 text-xs font-bold text-emerald-100 disabled:opacity-50">Resume</button>
              <button disabled={busy} onClick={() => run("pause_stage", stage)} className="rounded-lg border border-amber-300/25 px-3 py-1.5 text-xs font-bold text-amber-100 disabled:opacity-50">Pause</button>
              <button disabled={busy} onClick={() => run("retry_failed", stage)} className="rounded-lg border border-cyan-300/25 px-3 py-1.5 text-xs font-bold text-cyan-100 disabled:opacity-50">Retry failed</button>
            </div>
          </article>
        ))}
      </div>

      {message ? <p className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">{message}</p> : null}
    </section>
  );
}
