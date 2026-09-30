"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type SubmitState =
  | { kind: "idle"; message: string }
  | { kind: "working"; message: string }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export default function FounderAgendaClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [command, setCommand] = useState("");
  const [target, setTarget] = useState("pantavion_internal");
  const [state, setState] = useState<SubmitState>({
    kind: "idle",
    message: "Η εντολή παραμένει founder-only και μπαίνει στο canonical execution pipeline.",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const founderIntent = command.trim();
    if (!founderIntent) return;

    setState({ kind: "working", message: "Καταχώρηση και materialization…" });

    try {
      const response = await fetch("/api/kernel/canonical-state", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "capture",
          founderIntent,
          title: title.trim() || undefined,
          target,
        }),
      });

      const json = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; materialization?: { status?: string } }
        | null;

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || `agenda_capture_failed_${response.status}`);
      }

      setCommand("");
      setTitle("");
      setState({
        kind: "ok",
        message: `Καταχωρήθηκε. Execution pipeline: ${json.materialization?.status || "accepted"}.`,
      });
      router.refresh();
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "agenda_capture_failed",
      });
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-violet-500/25 bg-violet-500/5 p-5">
      <form onSubmit={submit} className="grid gap-4">
        <div>
          <label className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">
            Νέα Founder Εντολή
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={240}
            placeholder="Τίτλος (προαιρετικό)"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
          />
        </div>

        <textarea
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          maxLength={12000}
          required
          rows={5}
          placeholder="Γράψε ακριβώς τι θέλεις να γίνει…"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-violet-400"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
          >
            <option value="pantavion_internal">Pantavion Internal</option>
            <option value="water_infrastructure">Water Infrastructure</option>
            <option value="translation">Translation</option>
            <option value="social_universe">Social Universe</option>
            <option value="pantaai_center">PantaAI Center</option>
            <option value="admin_tool">Admin Tool</option>
            <option value="safety_system">Safety System</option>
          </select>

          <button
            type="submit"
            disabled={state.kind === "working" || !command.trim()}
            className="rounded-2xl bg-violet-300 px-5 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.kind === "working" ? "Καταχώρηση…" : "Καταχώρηση & Εκτέλεση"}
          </button>
        </div>

        <p
          className={
            state.kind === "error"
              ? "text-sm text-rose-300"
              : state.kind === "ok"
                ? "text-sm text-emerald-300"
                : "text-sm text-slate-400"
          }
        >
          {state.message}
        </p>
      </form>
    </section>
  );
}
