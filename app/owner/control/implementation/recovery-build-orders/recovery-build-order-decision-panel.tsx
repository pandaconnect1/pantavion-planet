"use client";

import { useEffect, useMemo, useState } from "react";

export type RecoveryBuildDecisionOption = {
  buildOrderOrdinal: number;
  buildOrderId: string;
  readinessDigest: string;
  label: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  dataClasses: string[];
};

type StoredDecision = {
  id: string;
  build_order_id: string;
  readiness_digest: string;
  decision: "approve_scoped_implementation" | "reject";
  receipt_digest: string;
  decided_at: string;
};

function shortDigest(value: string) {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

export default function RecoveryBuildOrderDecisionPanel({
  options,
}: {
  options: RecoveryBuildDecisionOption[];
}) {
  const [selectedId, setSelectedId] = useState(options[0]?.buildOrderId ?? "");
  const [note, setNote] = useState("");
  const [decisions, setDecisions] = useState<StoredDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.buildOrderId === selectedId) ?? null,
    [options, selectedId],
  );
  const recorded = useMemo(
    () => decisions.find(
      (decision) =>
        decision.build_order_id === selected?.buildOrderId &&
        decision.readiness_digest === selected.readinessDigest,
    ) ?? null,
    [decisions, selected],
  );
  const highConsequence = Boolean(
    selected &&
    (selected.riskLevel === "critical" || selected.dataClasses.includes("regulated")),
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(
          "/api/owner/control/recovery-build-orders/decisions",
          { cache: "no-store" },
        );
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.error || "decision_list_failed");
        if (active) setDecisions(payload.decisions);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "decision_list_failed");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function decide(decision: "approve_scoped_implementation" | "reject") {
    if (!selected || recorded) return;
    if (decision === "approve_scoped_implementation" && highConsequence && note.trim().length < 20) {
      setError("Για κρίσιμη ή ρυθμιζόμενη εντολή απαιτείται αιτιολόγηση τουλάχιστον 20 χαρακτήρων.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/owner/control/recovery-build-orders/decisions",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            buildOrderId: selected.buildOrderId,
            readinessDigest: selected.readinessDigest,
            decision,
            note,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "decision_failed");
      setDecisions((current) => [payload.decision, ...current]);
      setNote("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "decision_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-cyan-900/70 bg-cyan-950/20 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
        Founder AAL2 · Immutable decision receipt
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-100">
        Απόφαση για μία ακριβή build order
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Η έγκριση καταγράφει μόνο άδεια προετοιμασίας απομονωμένου κώδικα. Δεν εκδίδει agent ή budget grant και δεν επιτρέπει execution, production write, merge, deployment ή release.
      </p>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-400">
        Build order
        <select
          value={selectedId}
          onChange={(event) => {
            setSelectedId(event.target.value);
            setNote("");
            setError(null);
          }}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100"
        >
          {options.map((option) => (
            <option key={option.buildOrderId} value={option.buildOrderId}>
              #{option.buildOrderOrdinal} · {option.label}
            </option>
          ))}
        </select>
      </label>

      {selected ? (
        <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
          <div>Risk: <strong className="uppercase text-slate-200">{selected.riskLevel}</strong></div>
          <div>Data: <strong className="uppercase text-slate-200">{selected.dataClasses.join(", ")}</strong></div>
          <div>Readiness: <span className="font-mono text-slate-200">{shortDigest(selected.readinessDigest)}</span></div>
        </div>
      ) : null}

      {recorded ? (
        <div className="mt-4 rounded-xl border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-200">
          <div className="font-semibold uppercase">{recorded.decision.replaceAll("_", " ")}</div>
          <div className="mt-1 font-mono text-xs">Receipt {shortDigest(recorded.receipt_digest)}</div>
          <div className="mt-1 text-xs">{new Date(recorded.decided_at).toLocaleString()}</div>
        </div>
      ) : (
        <>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Αιτιολόγηση {highConsequence ? "(υποχρεωτική)" : "(προαιρετική)"}
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 2000))}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm normal-case text-slate-100"
              placeholder="Η απόφαση δεσμεύεται στο ακριβές readiness receipt."
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || loading || !selected}
              onClick={() => decide("approve_scoped_implementation")}
              className="min-h-11 rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50"
            >
              Έγκριση μόνο για isolated CODED stage
            </button>
            <button
              type="button"
              disabled={busy || loading || !selected}
              onClick={() => decide("reject")}
              className="min-h-11 rounded-xl border border-rose-500/60 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 disabled:opacity-50"
            >
              Απόρριψη exact readiness packet
            </button>
          </div>
        </>
      )}

      {loading ? <p className="mt-3 text-xs text-slate-500">Φόρτωση immutable receipts…</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}
