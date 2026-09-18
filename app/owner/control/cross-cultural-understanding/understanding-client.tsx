"use client";

import { type FormEvent, useState } from "react";

type Decision = "DENY" | "OWNER_APPROVAL_REQUIRED" | "UNDERSTOOD" | "REPAIR_REQUIRED";
type Payload = {
  ok: boolean;
  error?: string;
  detail?: string;
  decision?: Decision;
  reasons?: string[];
  evidenceReceipt?: string;
  understandingVerified?: boolean;
  assessmentOnly?: boolean;
  messageDelivered?: boolean;
  repairExecuted?: boolean;
  executionAllowed?: boolean;
  productionWriteAllowed?: boolean;
  authorizationEffect?: string;
  repairDirective?: { maximumAttempts: 1; mode: string } | null;
};

const styles: Record<Decision, string> = {
  DENY: "border-rose-500/60 bg-rose-500/10 text-rose-200",
  OWNER_APPROVAL_REQUIRED: "border-amber-500/60 bg-amber-500/10 text-amber-200",
  UNDERSTOOD: "border-emerald-500/60 bg-emerald-500/10 text-emerald-200",
  REPAIR_REQUIRED: "border-cyan-500/60 bg-cyan-500/10 text-cyan-200",
};

export default function CrossCulturalUnderstandingClient() {
  const [signal, setSignal] = useState("UNDERSTOOD");
  const [ageBand, setAgeBand] = useState("ADULT");
  const [jurisdictionDecision, setJurisdictionDecision] = useState("ADMIT");
  const [safetySignal, setSafetySignal] = useState("NONE");
  const [deviation, setDeviation] = useState("0.10");
  const [consent, setConsent] = useState(true);
  const [intent, setIntent] = useState("Ask whether the recipient can attend a safe community meeting.");
  const [summary, setSummary] = useState("The sender asks whether I can attend the community meeting.");
  const [context, setContext] = useState("Cyprus community context");
  const [result, setResult] = useState<Payload | null>(null);
  const [pending, setPending] = useState(false);

  async function assess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/owner/cross-cultural-understanding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messageId: "founder-understanding-assessment",
          originalMessageDigest: "a".repeat(64),
          translationReceipt: "b".repeat(64),
          senderIntent: intent,
          sourceLanguage: "el",
          targetLanguage: "en",
          culturalContext: context,
          recipientAgeBand: ageBand,
          jurisdiction: "CY",
          jurisdictionDecision,
          consentToUnderstandingCheck: consent,
          understandingSignal: signal,
          recipientMeaningSummary: signal === "DECLINED" ? "" : summary,
          meaningDeviationScore: Number(deviation),
          safetySignal,
        }),
      });
      setResult((await response.json()) as Payload);
    } catch {
      setResult({ ok: false, error: "understanding_request_failed" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <form onSubmit={assess} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Νέα αξιολόγηση κατανόησης</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Read-only assessment. Το αποτέλεσμα δεν αποστέλλει ή μεταβάλλει κανένα μήνυμα.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-200 sm:col-span-2">Αρχική πρόθεση
            <textarea required maxLength={2048} value={intent} onChange={e => setIntent(e.target.value)}
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
          </label>
          <label className="text-sm font-bold text-slate-200 sm:col-span-2">Περίληψη νοήματος από τον παραλήπτη
            <textarea maxLength={2048} value={summary} onChange={e => setSummary(e.target.value)}
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
          </label>
          <label className="text-sm font-bold text-slate-200 sm:col-span-2">Πολιτισμικό πλαίσιο
            <input required maxLength={2048} value={context} onChange={e => setContext(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
          </label>
          <label className="text-sm font-bold text-slate-200">Understanding signal
            <select value={signal} onChange={e => setSignal(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white">
              <option>UNDERSTOOD</option><option>PARTIAL</option><option>NOT_UNDERSTOOD</option><option>DECLINED</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-200">Age band
            <select value={ageBand} onChange={e => setAgeBand(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white">
              <option>CHILD</option><option>TEEN</option><option>ADULT</option><option>VERIFIED_ADULT</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-200">Jurisdiction decision
            <select value={jurisdictionDecision} onChange={e => setJurisdictionDecision(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white">
              <option>ADMIT</option><option>OWNER_REVIEW</option><option>DENY</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-200">Safety signal
            <select value={safetySignal} onChange={e => setSafetySignal(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white">
              <option>NONE</option><option>POTENTIAL_HARM</option><option>IMMINENT_HARM</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-200">Meaning deviation (0–1)
            <input required type="number" min="0" max="1" step="0.01" value={deviation} onChange={e => setDeviation(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
          </label>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm font-bold text-slate-200">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="h-5 w-5 accent-cyan-400" />
            Consent to understanding check
          </label>
        </div>
        <button type="submit" disabled={pending}
          className="min-h-12 w-full rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-5 font-black text-cyan-100 disabled:opacity-50">
          {pending ? "Αξιολόγηση..." : "ΑΞΙΟΛΟΓΗΣΗ ΚΑΤΑΝΟΗΣΗΣ"}
        </button>
      </form>

      <section aria-live="polite" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-xl font-black text-white">Αποτέλεσμα</h2>
        {!result ? <p className="mt-4 text-sm leading-6 text-slate-400">Η απόφαση και το SHA-256 receipt θα εμφανιστούν εδώ.</p>
        : !result.ok || !result.decision ? (
          <div className="mt-4 rounded-2xl border border-rose-700 bg-rose-950/30 p-4 text-sm text-rose-200">
            {result.error ?? "understanding_request_failed"}
            {result.detail ? <div className="mt-2 font-mono text-xs">{result.detail}</div> : null}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className={"rounded-2xl border p-4 " + styles[result.decision]}>
              <div className="text-xs font-black uppercase tracking-wider">Decision</div>
              <div className="mt-1 break-words text-2xl font-black">{result.decision}</div>
            </div>
            <ul className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
              {result.reasons?.map(reason => <li key={reason}>• {reason}</li>)}
            </ul>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Evidence SHA-256</div>
              <div className="mt-2 break-all font-mono text-xs leading-5 text-cyan-200">{result.evidenceReceipt}</div>
            </div>
            <dl className="grid gap-2 text-xs text-slate-400">
              <div className="flex justify-between gap-4"><dt>Understanding verified</dt><dd>{String(result.understandingVerified)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Assessment only</dt><dd>{String(result.assessmentOnly)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Message delivered</dt><dd>{String(result.messageDelivered)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Repair executed</dt><dd>{String(result.repairExecuted)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Execution allowed</dt><dd>{String(result.executionAllowed)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Production write allowed</dt><dd>{String(result.productionWriteAllowed)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Authorization effect</dt><dd>{result.authorizationEffect}</dd></div>
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
