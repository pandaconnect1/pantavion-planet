"use client";

import { type FormEvent, useState } from "react";

const components = [
  ["intent_firewall", 476, "4fa03685a7277d4696873996ddd0b5b94b6514e0"],
  ["intent_outcome", 482, "0d90c1906e0f22120eb00ee3a2c194065763f49b"],
  ["capability_budget", 478, "94791f0ab08fc8746d37977bb73e597fe8c4bf2a"],
  ["swarm_admission", 481, "0d19340415546a63d7148a82d8b3746ff5e49bce"],
  ["edge_preflight", 479, "67baa0fab093a7406af703619dec89bd48304d0e"],
] as const;

const example = JSON.stringify({
  bundleId: "sovereign-bundle-001",
  intentId: "intent-001",
  components: components.map(([componentId, sourcePr, sourceHead], index) => ({
    componentId,
    sourcePr,
    sourceHead,
    receiptSha256: String(index + 1).repeat(64),
    disposition: "owner_approval",
    authorizationEffect: "none",
    executionAllowed: false,
  })),
}, null, 2);

type BundleResponse = {
  ok: boolean;
  error?: string;
  detail?: string;
  readiness?: string;
  deniedComponents?: string[];
  ownerApprovalComponents?: string[];
  completeReceiptChain?: boolean;
  admissionRecorded?: boolean;
  executionPlanIssued?: boolean;
  agentsCreated?: boolean;
  edgeHandoffIssued?: boolean;
  budgetConsumed?: boolean;
  executionAllowed?: boolean;
  authorizationEffect?: string;
  preflightOnly?: boolean;
  ownerAdmissionRequired?: boolean;
  receiptSha256?: string;
};

export default function SovereignAdmissionClient() {
  const [payload, setPayload] = useState(example);
  const [result, setResult] = useState<BundleResponse | null>(null);
  const [pending, setPending] = useState(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      setResult({ ok: false, error: "invalid_json" });
      setPending(false);
      return;
    }

    try {
      const response = await fetch("/api/owner/sovereign-admission", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed),
      });
      setResult((await response.json()) as BundleResponse);
    } catch {
      setResult({ ok: false, error: "sovereign_admission_request_failed" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <form onSubmit={verify} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-xl font-black text-white">Receipt-chain bundle</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Σύνδεσε τα πέντε πραγματικά receipts. Αλλαγή PR, SHA, σειράς ή authority απορρίπτεται.
        </p>
        <label className="mt-5 block text-sm font-bold text-slate-200">
          Sovereign bundle JSON
          <textarea
            required
            rows={25}
            spellCheck={false}
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-4 min-h-12 w-full rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-5 font-black text-cyan-100 disabled:opacity-50"
        >
          {pending ? "Έλεγχος..." : "VERIFY SOVEREIGN BUNDLE"}
        </button>
      </form>

      <section aria-live="polite" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-xl font-black text-white">Admission truth</h2>
        {!result ? (
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Η readiness και το deterministic bundle receipt θα εμφανιστούν εδώ.
          </p>
        ) : !result.ok || !result.readiness ? (
          <div className="mt-4 rounded-2xl border border-rose-700 bg-rose-950/30 p-4 text-sm text-rose-200">
            {result.error ?? "sovereign_admission_request_failed"}
            {result.detail ? <div className="mt-2 break-all font-mono text-xs">{result.detail}</div> : null}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-cyan-500/60 bg-cyan-500/10 p-4 text-cyan-100">
              <div className="text-xs font-black uppercase tracking-wider">Readiness</div>
              <div className="mt-2 text-2xl font-black">{result.readiness}</div>
            </div>
            <dl className="grid gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
              <div className="flex justify-between gap-4"><dt>Receipt chain complete</dt><dd>{String(result.completeReceiptChain)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Admission recorded</dt><dd>{String(result.admissionRecorded)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Execution plan issued</dt><dd>{String(result.executionPlanIssued)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Agents created</dt><dd>{String(result.agentsCreated)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Edge handoff issued</dt><dd>{String(result.edgeHandoffIssued)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Budget consumed</dt><dd>{String(result.budgetConsumed)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Execution allowed</dt><dd>{String(result.executionAllowed)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Authorization effect</dt><dd>{result.authorizationEffect}</dd></div>
            </dl>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Bundle receipt SHA-256</div>
              <div className="mt-2 break-all font-mono text-xs leading-5 text-cyan-200">{result.receiptSha256}</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
