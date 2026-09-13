"use client";

import { type FormEvent, useState } from "react";

type ActorKind = "founder" | "authenticated_user" | "system_agent";
type DataClass = "public" | "private" | "sensitive" | "regulated";
type Risk = "low" | "medium" | "high" | "critical";

type FormState = {
  intentId: string;
  actorId: string;
  actorKind: ActorKind;
  capabilities: string;
  dataClass: DataClass;
  estimatedCost: string;
  risk: Risk;
  reversible: boolean;
  legalConsentRecorded: boolean;
  writesProduction: boolean;
  publishesToUsers: boolean;
  sendsExternalMessage: boolean;
  changesIdentityOrAccess: boolean;
};

type AssessmentPayload = {
  ok: boolean;
  error?: string;
  detail?: string;
  schema?: string;
  policyVersion?: string;
  assessmentOnly?: boolean;
  executionAllowed?: boolean;
  authorizationEffect?: string;
  receiptSha256?: string;
  decision?: {
    disposition: "allow" | "owner_approval" | "deny";
    reasons: string[];
    auditRequired: boolean;
  };
};

const dispositionStyles = {
  allow: "border-emerald-500/60 bg-emerald-500/10 text-emerald-200",
  owner_approval: "border-amber-500/60 bg-amber-500/10 text-amber-200",
  deny: "border-rose-500/60 bg-rose-500/10 text-rose-200",
} as const;

export default function FounderIntentFirewallClient({ founderUserId }: { founderUserId: string }) {
  const [form, setForm] = useState<FormState>(() => ({
    intentId: "founder-intent-001",
    actorId: founderUserId,
    actorKind: "founder",
    capabilities: "read_status, verify_evidence",
    dataClass: "private",
    estimatedCost: "0",
    risk: "low",
    reversible: true,
    legalConsentRecorded: true,
    writesProduction: false,
    publishesToUsers: false,
    sendsExternalMessage: false,
    changesIdentityOrAccess: false,
  }));
  const [result, setResult] = useState<AssessmentPayload | null>(null);
  const [pending, setPending] = useState(false);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function assess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);

    try {
      const capabilities = form.capabilities
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const response = await fetch("/api/owner/intent-firewall", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intentId: form.intentId,
          actorId: form.actorId,
          actorKind: form.actorKind,
          capabilities,
          dataClasses: [form.dataClass],
          estimatedCost: Number(form.estimatedCost),
          risk: form.risk,
          reversible: form.reversible,
          legalConsentRecorded: form.legalConsentRecorded,
          writesProduction: form.writesProduction,
          publishesToUsers: form.publishesToUsers,
          sendsExternalMessage: form.sendsExternalMessage,
          changesIdentityOrAccess: form.changesIdentityOrAccess,
        }),
      });
      const payload = (await response.json()) as AssessmentPayload;
      setResult(payload);
    } catch {
      setResult({ ok: false, error: "intent_firewall_request_failed" });
    } finally {
      setPending(false);
    }
  }

  const disposition = result?.decision?.disposition;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <form onSubmit={assess} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Νέα αξιολόγηση intent</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Η αξιολόγηση είναι read-only. Ακόμη και αποτέλεσμα allow δεν εκτελεί, δεν εγκρίνει και δεν δημοσιεύει τίποτα.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-200">
            Intent ID
            <input
              required
              maxLength={160}
              value={form.intentId}
              onChange={(event) => setField("intentId", event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </label>
          <label className="text-sm font-bold text-slate-200">
            Actor ID
            <input
              required
              maxLength={160}
              value={form.actorId}
              onChange={(event) => setField("actorId", event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </label>
          <label className="text-sm font-bold text-slate-200">
            Actor type
            <select
              value={form.actorKind}
              onChange={(event) => setField("actorKind", event.target.value as ActorKind)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            >
              <option value="founder">Founder</option>
              <option value="authenticated_user">Authenticated user</option>
              <option value="system_agent">System agent</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-200">
            Data class
            <select
              value={form.dataClass}
              onChange={(event) => setField("dataClass", event.target.value as DataClass)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="sensitive">Sensitive</option>
              <option value="regulated">Regulated</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-200 sm:col-span-2">
            Capabilities, χωρισμένες με κόμμα
            <input
              required
              value={form.capabilities}
              onChange={(event) => setField("capabilities", event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </label>
          <label className="text-sm font-bold text-slate-200">
            Estimated cost
            <input
              required
              min="0"
              max="1000000000"
              step="0.01"
              type="number"
              value={form.estimatedCost}
              onChange={(event) => setField("estimatedCost", event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </label>
          <label className="text-sm font-bold text-slate-200">
            Risk
            <select
              value={form.risk}
              onChange={(event) => setField("risk", event.target.value as Risk)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>

        <fieldset className="grid gap-3 rounded-2xl border border-slate-800 p-4 sm:grid-cols-2">
          <legend className="px-2 text-sm font-black text-slate-200">Safety signals</legend>
          {([
            ["reversible", "Αναστρέψιμη ενέργεια"],
            ["legalConsentRecorded", "Καταγράφηκε νόμιμη συγκατάθεση"],
            ["writesProduction", "Γράφει σε production"],
            ["publishesToUsers", "Δημοσιεύει σε χρήστες"],
            ["sendsExternalMessage", "Στέλνει εξωτερικό μήνυμα"],
            ["changesIdentityOrAccess", "Αλλάζει identity ή access"],
          ] as const).map(([field, label]) => (
            <label key={field} className="flex min-h-11 items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form[field]}
                onChange={(event) => setField(field, event.target.checked)}
                className="h-5 w-5 accent-cyan-400"
              />
              {label}
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-5 font-black text-cyan-100 disabled:opacity-50"
        >
          {pending ? "Αξιολόγηση..." : "ΑΞΙΟΛΟΓΗΣΗ ΜΕ INTENT FIREWALL"}
        </button>
      </form>

      <section aria-live="polite" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-xl font-black text-white">Αποτέλεσμα</h2>
        {!result ? (
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Συμπλήρωσε το intent. Εδώ θα εμφανιστούν η απόφαση, οι λόγοι και το SHA-256 receipt.
          </p>
        ) : !result.ok || !disposition ? (
          <div className="mt-4 rounded-2xl border border-rose-700 bg-rose-950/30 p-4 text-sm text-rose-200">
            {result.error ?? "intent_firewall_request_failed"}
            {result.detail ? <div className="mt-2 font-mono text-xs">{result.detail}</div> : null}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className={`rounded-2xl border p-4 ${dispositionStyles[disposition]}`}>
              <div className="text-xs font-black uppercase tracking-wider">Disposition</div>
              <div className="mt-1 text-2xl font-black">{disposition.toUpperCase()}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Reasons</div>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {result.decision?.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Receipt SHA-256</div>
              <div className="mt-2 break-all font-mono text-xs leading-5 text-cyan-200">{result.receiptSha256}</div>
            </div>
            <dl className="grid gap-2 text-xs text-slate-400">
              <div className="flex justify-between gap-4"><dt>Assessment only</dt><dd>{String(result.assessmentOnly)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Execution allowed</dt><dd>{String(result.executionAllowed)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Authorization effect</dt><dd>{result.authorizationEffect}</dd></div>
              <div className="flex justify-between gap-4"><dt>Policy</dt><dd>{result.policyVersion}</dd></div>
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
