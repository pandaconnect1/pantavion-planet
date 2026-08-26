"use client";

import { useMemo, useState } from "react";
import type { OwnerDecisionItem, OwnerDecisionStatus } from "@/lib/owner-control/decision-queue";

type Filter = "all" | OwnerDecisionStatus;

export default function OwnerControlClient({ initialItems }: { initialItems: OwnerDecisionItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const filtered = filter === "all" ? items : items.filter((item) => item.status === filter);
    const rank = { critical: 4, high: 3, medium: 2, low: 1 } as const;
    return [...filtered].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (b.status === "pending" && a.status !== "pending") return 1;
      const severity = rank[b.severity] - rank[a.severity];
      if (severity) return severity;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filter, items]);

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch("/api/owner/control/decisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "decision_failed");
      setItems((current) => current.map((item) =>
        item.id === id
          ? { ...item, status: decision, decided_at: payload.result.decided_at, updated_at: payload.result.decided_at }
          : item,
      ));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "decision_failed");
    } finally {
      setBusyId(null);
    }
  }

  const counts = {
    pending: items.filter((item) => item.status === "pending").length,
    approved: items.filter((item) => item.status === "approved").length,
    rejected: items.filter((item) => item.status === "rejected").length,
  };

  return (
    <section className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as Filter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold ${filter === value ? "border-cyan-400 bg-cyan-400/10 text-cyan-200" : "border-slate-700 bg-slate-900 text-slate-300"}`}
          >
            {value === "pending" ? `Εκκρεμή (${counts.pending})` : value === "approved" ? `Εγκεκριμένα (${counts.approved})` : value === "rejected" ? `Απορριφθέντα (${counts.rejected})` : `Όλα (${items.length})`}
          </button>
        ))}
      </div>

      {error ? <div className="rounded-2xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">{error}</div> : null}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">Δεν υπάρχουν θέματα σε αυτή την κατηγορία.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                <span>{item.category}</span><span>•</span><span>{item.severity}</span><span>•</span><span>{item.source}</span>
              </div>
              <h2 className="mt-2 text-xl font-black text-white">{item.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.summary}</p>
              {item.recommended_action ? (
                <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-300">
                  <strong className="text-slate-100">Προτεινόμενη ενέργεια:</strong> {item.recommended_action}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold uppercase text-slate-300">{item.status}</span>
                <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</span>
              </div>
              {item.status === "pending" ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => decide(item.id, "approved")}
                    className="min-h-11 rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-5 py-2 text-sm font-black text-emerald-200 disabled:opacity-50"
                  >
                    {busyId === item.id ? "Εκτέλεση..." : "ΕΓΚΡΙΣΗ"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => decide(item.id, "rejected")}
                    className="min-h-11 rounded-xl border border-red-500/60 bg-red-500/10 px-5 py-2 text-sm font-black text-red-200 disabled:opacity-50"
                  >
                    {busyId === item.id ? "Εκτέλεση..." : "ΑΠΟΡΡΙΨΗ"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
