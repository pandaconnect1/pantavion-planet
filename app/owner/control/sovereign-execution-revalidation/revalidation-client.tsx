"use client";

import { type FormEvent, useState } from "react";

type Result = {
  ok: boolean; error?: string; detail?: string;
  decision?: "DENY" | "REVALIDATION_PASSED"; reasons?: string[];
  projectedBudget?: number; evidenceReceipt?: string;
  capabilityScopePreserved?: boolean; bundleContinuityVerified?: boolean;
  chainContinuityVerified?: boolean; replayBoundaryVerified?: boolean;
  executionAllowed?: boolean; executionStarted?: boolean; agentActivated?: boolean;
  edgeHandoffIssued?: boolean; productionWriteAllowed?: boolean; authorizationEffect?: string;
};

const receiptA = "a".repeat(64);
const receiptB = "b".repeat(64);
const receiptC = "c".repeat(64);
const nonce = "d".repeat(64);

export default function SovereignExecutionRevalidationClient() {
  const [admittedCapabilities, setAdmittedCapabilities] = useState("read_status,verify_evidence");
  const [requestedCapabilities, setRequestedCapabilities] = useState("read_status");
  const [budgetCeiling, setBudgetCeiling] = useState("100");
  const [budgetConsumed, setBudgetConsumed] = useState("25");
  const [requestedCost, setRequestedCost] = useState("10");
  const [revoked, setRevoked] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [lastSequence, setLastSequence] = useState("4");
  const [requestedSequence, setRequestedSequence] = useState("5");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);

  const parseCapabilities = (value: string) =>
    value.split(",").map(item => item.trim()).filter(Boolean);

  async function assess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/owner/sovereign-execution-revalidation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          admissionId: "founder-admission-001",
          intentId: "intent-read-status-001",
          admissionBundleReceipt: receiptA,
          currentBundleReceipt: receiptA,
          ownerAdmissionReceipt: receiptB,
          admissionRecorded: true,
          admittedAt: "2026-09-12T10:00:00.000Z",
          expiresAt: "2027-09-12T10:00:00.000Z",
          evaluationTime: "2026-09-12T11:00:00.000Z",
          revoked,
          admittedCapabilities: parseCapabilities(admittedCapabilities),
          requestedCapabilities: parseCapabilities(requestedCapabilities),
          budgetCeiling: Number(budgetCeiling),
          budgetConsumed: Number(budgetConsumed),
          requestedCost: Number(requestedCost),
          admittedChainFingerprint: receiptC,
          currentChainFingerprint: receiptC,
          disconnected,
          lastAcceptedSequence: Number(lastSequence),
          requestedSequence: Number(requestedSequence),
          replayNonce: nonce,
          previousReplayNonces: [],
        }),
      });
      setResult((await response.json()) as Result);
    } catch {
      setResult({ ok: false, error: "execution_revalidation_request_failed" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={assess} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Pre-execution evidence check</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Το REVALIDATION_PASSED δεν είναι execution authority· απαιτεί ξεχωριστό execution review.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-200 sm:col-span-2">Admitted capabilities
            <input required value={admittedCapabilities} onChange={e => setAdmittedCapabilities(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
          </label>
          <label className="text-sm font-bold text-slate-200 sm:col-span-2">Requested capabilities
            <input value={requestedCapabilities} onChange={e => setRequestedCapabilities(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
          </label>
          <label className="text-sm font-bold text-slate-200">Budget ceiling
            <input required type="number" min="0" step="1" value={budgetCeiling} onChange={e => setBudgetCeiling(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
          </label>
          <label className="text-sm font-bold text-slate-200">Budget consumed
            <input required type="number" min="0" step="1" value={budgetConsumed} onChange={e => setBudgetConsumed(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
          </label>
          <label className="text-sm font-bold text-slate-200">Requested cost
            <input required type="number" min="0" step="1" value={requestedCost} onChange={e => setRequestedCost(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
          </label>
          <label className="text-sm font-bold text-slate-200">Last sequence
            <input required type="number" min="0" step="1" value={lastSequence} onChange={e => setLastSequence(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
          </label>
          <label className="text-sm font-bold text-slate-200">Requested sequence
            <input required type="number" min="0" step="1" value={requestedSequence} onChange={e => setRequestedSequence(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
          </label>
        </div>
        <div className="flex flex-wrap gap-5">
          <label className="flex min-h-11 items-center gap-3 text-sm font-bold text-slate-200">
            <input type="checkbox" checked={revoked} onChange={e => setRevoked(e.target.checked)} className="h-5 w-5 accent-cyan-400" />
            Admission revoked
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm font-bold text-slate-200">
            <input type="checkbox" checked={disconnected} onChange={e => setDisconnected(e.target.checked)} className="h-5 w-5 accent-cyan-400" />
            Disconnected edge
          </label>
        </div>
        <button type="submit" disabled={pending}
          className="min-h-12 w-full rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-5 font-black text-cyan-100 disabled:opacity-50">
          {pending ? "Έλεγχος..." : "REVALIDATE — ΧΩΡΙΣ ΕΚΤΕΛΕΣΗ"}
        </button>
      </form>

      <section aria-live="polite" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-xl font-black text-white">Αποτέλεσμα</h2>
        {!result ? <p className="mt-4 text-sm leading-6 text-slate-400">Η deterministic απόφαση και το evidence receipt θα εμφανιστούν εδώ.</p>
        : !result.ok || !result.decision ? (
          <div className="mt-4 rounded-2xl border border-rose-700 bg-rose-950/30 p-4 text-sm text-rose-200">
            {result.error ?? "execution_revalidation_request_failed"}
            {result.detail ? <div className="mt-2 font-mono text-xs">{result.detail}</div> : null}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className={"rounded-2xl border p-4 " + (result.decision === "DENY"
              ? "border-rose-500/60 bg-rose-500/10 text-rose-200"
              : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200")}>
              <div className="text-xs font-black uppercase tracking-wider">Decision</div>
              <div className="mt-1 break-words text-2xl font-black">{result.decision}</div>
            </div>
            <ul className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
              {result.reasons?.length ? result.reasons.map(reason => <li key={reason}>• {reason}</li>) : <li>• all_revalidation_constraints_satisfied</li>}
            </ul>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Evidence SHA-256</div>
              <div className="mt-2 break-all font-mono text-xs leading-5 text-cyan-200">{result.evidenceReceipt}</div>
            </div>
            <dl className="grid gap-2 text-xs text-slate-400">
              <div className="flex justify-between gap-4"><dt>Projected budget</dt><dd>{result.projectedBudget}</dd></div>
              <div className="flex justify-between gap-4"><dt>Capability scope preserved</dt><dd>{String(result.capabilityScopePreserved)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Bundle continuity</dt><dd>{String(result.bundleContinuityVerified)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Chain continuity</dt><dd>{String(result.chainContinuityVerified)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Replay boundary</dt><dd>{String(result.replayBoundaryVerified)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Execution allowed</dt><dd>{String(result.executionAllowed)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Execution started</dt><dd>{String(result.executionStarted)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Agent activated</dt><dd>{String(result.agentActivated)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Edge handoff issued</dt><dd>{String(result.edgeHandoffIssued)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Production write allowed</dt><dd>{String(result.productionWriteAllowed)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Authorization effect</dt><dd>{result.authorizationEffect}</dd></div>
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
