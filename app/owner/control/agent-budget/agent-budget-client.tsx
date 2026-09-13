"use client";

import { type FormEvent, useState } from "react";

type Access = "read" | "write";
type Result = {
  ok: boolean;
  error?: string;
  detail?: string;
  policyVersion?: string;
  grantState?: string;
  assessmentOnly?: boolean;
  executionAllowed?: boolean;
  budgetConsumed?: boolean;
  authorizationEffect?: string;
  receiptSha256?: string;
  decision?: {
    eligible: boolean;
    reasons: string[];
    remainingBudget: number;
  };
};

export default function FounderAgentBudgetClient() {
  const [form, setForm] = useState({
    grantId: "",
    agentId: "",
    intentId: "",
    capability: "",
    scope: "",
    grantAccess: "read" as Access,
    budgetLimit: "0",
    spent: "0",
    issuedAt: "",
    expiresAt: "",
    requestCapability: "",
    requestScope: "",
    requestAccess: "read" as Access,
    requestCost: "0",
    requestAt: "",
  });
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);

  function setField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function assess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/owner/agent-budget/assess", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          grantId: form.grantId,
          agentId: form.agentId,
          intentId: form.intentId,
          capabilities: [{
            capability: form.capability,
            scope: form.scope,
            access: form.grantAccess,
          }],
          budgetLimit: Number(form.budgetLimit),
          spent: Number(form.spent),
          issuedAt: form.issuedAt,
          expiresAt: form.expiresAt,
          requestCapability: form.requestCapability,
          requestScope: form.requestScope,
          requestAccess: form.requestAccess,
          requestCost: Number(form.requestCost),
          requestAt: form.requestAt,
        }),
      });
      setResult((await response.json()) as Result);
    } catch {
      setResult({ ok: false, error: "agent_budget_assessment_failed" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <form onSubmit={assess} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Προτεινόμενο grant</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Η φόρμα αξιολογεί μόνο. Δεν εκδίδει grant, δεν αλλάζει spent και δεν εκτελεί agent.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["grantId", "Grant ID", 160],
            ["agentId", "Agent ID", 160],
            ["intentId", "Intent ID", 160],
            ["capability", "Allowed capability", 160],
            ["scope", "Allowed scope", 240],
          ] as const).map(([field, label, maxLength]) => (
            <label key={field} className="text-sm font-bold text-slate-200">
              {label}
              <input
                required
                maxLength={maxLength}
                value={form[field]}
                onChange={(event) => setField(field, event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
              />
            </label>
          ))}
          <label className="text-sm font-bold text-slate-200">
            Allowed access
            <select
              value={form.grantAccess}
              onChange={(event) => setField("grantAccess", event.target.value as Access)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            >
              <option value="read">Read</option>
              <option value="write">Write</option>
            </select>
          </label>
          {([
            ["budgetLimit", "Budget limit"],
            ["spent", "Already spent"],
          ] as const).map(([field, label]) => (
            <label key={field} className="text-sm font-bold text-slate-200">
              {label}
              <input
                required
                type="number"
                min="0"
                max="1000000000"
                step="0.01"
                value={form[field]}
                onChange={(event) => setField(field, event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
              />
            </label>
          ))}
          {([
            ["issuedAt", "Issued at"],
            ["expiresAt", "Expires at"],
          ] as const).map(([field, label]) => (
            <label key={field} className="text-sm font-bold text-slate-200">
              {label}
              <input
                required
                type="datetime-local"
                value={form[field]}
                onChange={(event) => setField(field, event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
              />
            </label>
          ))}
        </div>

        <fieldset className="grid gap-4 rounded-2xl border border-slate-800 p-4 sm:grid-cols-2">
          <legend className="px-2 text-sm font-black text-slate-200">Capability request</legend>
          {([
            ["requestCapability", "Requested capability", 160],
            ["requestScope", "Requested scope", 240],
          ] as const).map(([field, label, maxLength]) => (
            <label key={field} className="text-sm font-bold text-slate-200">
              {label}
              <input
                required
                maxLength={maxLength}
                value={form[field]}
                onChange={(event) => setField(field, event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
              />
            </label>
          ))}
          <label className="text-sm font-bold text-slate-200">
            Requested access
            <select
              value={form.requestAccess}
              onChange={(event) => setField("requestAccess", event.target.value as Access)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            >
              <option value="read">Read</option>
              <option value="write">Write</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-200">
            Request cost
            <input
              required
              type="number"
              min="0"
              max="1000000000"
              step="0.01"
              value={form.requestCost}
              onChange={(event) => setField("requestCost", event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </label>
          <label className="text-sm font-bold text-slate-200 sm:col-span-2">
            Request time
            <input
              required
              type="datetime-local"
              value={form.requestAt}
              onChange={(event) => setField("requestAt", event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </label>
        </fieldset>

        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-5 font-black text-cyan-100 disabled:opacity-50"
        >
          {pending ? "Αξιολόγηση..." : "ΑΞΙΟΛΟΓΗΣΗ CAPABILITY & BUDGET"}
        </button>
      </form>

      <section aria-live="polite" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-xl font-black text-white">Αποτέλεσμα</h2>
        {!result ? (
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Εδώ θα εμφανιστούν eligibility, blockers, remaining budget και το receipt.
          </p>
        ) : !result.ok || !result.decision ? (
          <div className="mt-4 rounded-2xl border border-rose-700 bg-rose-950/30 p-4 text-sm text-rose-200">
            {result.error ?? "agent_budget_assessment_failed"}
            {result.detail ? <div className="mt-2 break-all font-mono text-xs">{result.detail}</div> : null}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-cyan-500/60 bg-cyan-500/10 p-4 text-cyan-100">
              <div className="text-xs font-black uppercase tracking-wider">Eligibility</div>
              <div className="mt-1 text-2xl font-black">{result.decision.eligible ? "ELIGIBLE" : "BLOCKED"}</div>
              <div className="mt-2 text-sm">Remaining budget: {result.decision.remainingBudget}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Reasons</div>
              {result.decision.reasons.length ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {result.decision.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
                </ul>
              ) : <p className="mt-2 text-sm text-emerald-200">No assessment blockers.</p>}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Receipt SHA-256</div>
              <div className="mt-2 break-all font-mono text-xs leading-5 text-cyan-200">{result.receiptSha256}</div>
            </div>
            <dl className="grid gap-2 text-xs text-slate-400">
              <div className="flex justify-between gap-4"><dt>Grant state</dt><dd>{result.grantState}</dd></div>
              <div className="flex justify-between gap-4"><dt>Assessment only</dt><dd>{String(result.assessmentOnly)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Execution allowed</dt><dd>{String(result.executionAllowed)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Budget consumed</dt><dd>{String(result.budgetConsumed)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Authorization effect</dt><dd>{result.authorizationEffect}</dd></div>
              <div className="flex justify-between gap-4"><dt>Policy</dt><dd>{result.policyVersion}</dd></div>
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
