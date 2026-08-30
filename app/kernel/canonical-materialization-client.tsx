"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CanonicalIntent = {
  intent_id?: string;
  intentId?: string;
  title?: string;
  status?: string;
  work_order_execution_id?: string | null;
  workOrderExecutionId?: string | null;
  last_error?: string | null;
  lastError?: string | null;
};

type CanonicalStateResponse = {
  ok?: boolean;
  marker?: string;
  executionIntents?: CanonicalIntent[];
};

type MaterializationResponse = {
  ok?: boolean;
  marker?: string;
  status?: string;
  materialization?: unknown;
};

function intentStatus(intent: CanonicalIntent): string {
  return intent.status ?? "unknown";
}

export default function CanonicalMaterializationClient() {
  const [intents, setIntents] = useState<CanonicalIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [materializing, setMaterializing] = useState(false);
  const [message, setMessage] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/kernel/canonical-state", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await response.json()) as CanonicalStateResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.marker ?? `canonical_state_http_${response.status}`);
      }
      setIntents(Array.isArray(data.executionIntents) ? data.executionIntents : []);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "canonical_state_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const result = {
      pending: 0,
      materializing: 0,
      materialized: 0,
      blocked: 0,
      other: 0,
    };

    for (const intent of intents) {
      const status = intentStatus(intent);
      if (status === "pending_materialization") result.pending += 1;
      else if (status === "materializing") result.materializing += 1;
      else if (status === "materialized") result.materialized += 1;
      else if (status === "blocked") result.blocked += 1;
      else result.other += 1;
    }

    return result;
  }, [intents]);

  async function materialize(): Promise<void> {
    setMaterializing(true);
    setMessage("");

    try {
      const response = await fetch("/api/kernel/canonical-state", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "materialize", limit: 50 }),
      });
      const data = (await response.json()) as MaterializationResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.marker ?? `canonical_materialization_http_${response.status}`);
      }

      setMessage(`Materialization result: ${data.status ?? "checked"}`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "canonical_materialization_failed");
    } finally {
      setMaterializing(false);
    }
  }

  return (
    <section className="mx-auto mt-6 max-w-7xl rounded-[2rem] border border-emerald-300/25 bg-emerald-950/20 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">
            Pantavion-native continuity
          </p>
          <h2 className="mt-3 text-2xl font-black">Canonical Intake → Work Orders</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
            Founder-only control for materializing private canonical execution intents through the existing Pantavion Work Order, Nervous System, Foundry and durable-execution pipeline. This action does not grant direct file-write or production-deploy authority.
          </p>
        </div>

        <button
          type="button"
          onClick={materialize}
          disabled={materializing || loading || counts.pending === 0}
          className="rounded-2xl bg-emerald-300 px-6 py-3 font-black text-black shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {materializing ? "Materializing…" : "Materialize pending intents"}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs text-slate-300">Pending</p>
          <p className="mt-2 text-2xl font-black text-yellow-200">{loading ? "—" : counts.pending}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs text-slate-300">Materializing</p>
          <p className="mt-2 text-2xl font-black text-sky-200">{loading ? "—" : counts.materializing}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs text-slate-300">Materialized</p>
          <p className="mt-2 text-2xl font-black text-emerald-300">{loading ? "—" : counts.materialized}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs text-slate-300">Blocked</p>
          <p className="mt-2 text-2xl font-black text-rose-200">{loading ? "—" : counts.blocked}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs text-slate-300">Total intents</p>
          <p className="mt-2 text-2xl font-black">{loading ? "—" : intents.length}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || materializing}
          className="rounded-xl border border-white/25 px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh canonical state"}
        </button>
        <span className="self-center text-xs text-slate-300">
          direct file write: false · direct production deploy: false
        </span>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-100">
          {message}
        </p>
      ) : null}
    </section>
  );
}
