"use client";

import { type FormEvent, useState } from "react";

type Result = {
  ok: boolean;
  error?: string;
  detail?: string;
  policyVersion?: string;
  handoffIssued?: boolean;
  assessmentOnly?: boolean;
  executionAllowed?: boolean;
  productionWriteAllowed?: boolean;
  authorizationEffect?: string;
  receiptSha256?: string;
  preflight?: {
    readyForOwnerReview: boolean;
    reasons: string[];
    payloadDigest: string | null;
  };
};

export default function FounderEdgePreflightClient() {
  const [form, setForm] = useState({
    taskId: "",
    intentId: "",
    capability: "",
    payload: "{}",
    allowedCapabilities: "",
    maximumPayloadBytes: "16384",
    issuedAt: "",
    expiresAt: "",
    verificationAt: "",
    consumedDigests: "",
    deterministic: true,
    reversible: true,
    requiresNetwork: false,
    writesProduction: false,
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
      let payload: unknown;
      try {
        payload = JSON.parse(form.payload);
      } catch {
        setResult({ ok: false, error: "invalid_payload_json" });
        return;
      }
      const response = await fetch("/api/owner/edge-preflight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taskId: form.taskId,
          intentId: form.intentId,
          capability: form.capability,
          payload,
          deterministic: form.deterministic,
          reversible: form.reversible,
          requiresNetwork: form.requiresNetwork,
          writesProduction: form.writesProduction,
          issuedAt: form.issuedAt,
          expiresAt: form.expiresAt,
          allowedCapabilities: form.allowedCapabilities.split(",").map((value) => value.trim()).filter(Boolean),
          maximumPayloadBytes: Number(form.maximumPayloadBytes),
          verificationAt: form.verificationAt,
          consumedDigests: form.consumedDigests.split(",").map((value) => value.trim()).filter(Boolean),
        }),
      });
      setResult((await response.json()) as Result);
    } catch {
      setResult({ ok: false, error: "edge_preflight_request_failed" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <form onSubmit={assess} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Νέο edge preflight</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Το payload αξιολογείται στη μνήμη και δεν αποθηκεύεται ούτε αποστέλλεται σε edge συσκευή.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["taskId", "Task ID", 160],
            ["intentId", "Intent ID", 160],
            ["capability", "Capability", 160],
            ["allowedCapabilities", "Allowed capabilities, comma separated", 1000],
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
          {([
            ["issuedAt", "Issued at"],
            ["expiresAt", "Expires at"],
            ["verificationAt", "Verification at"],
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
          <label className="text-sm font-bold text-slate-200">
            Maximum payload bytes
            <input
              required
              type="number"
              min="0"
              max="16384"
              step="1"
              value={form.maximumPayloadBytes}
              onChange={(event) => setField("maximumPayloadBytes", event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </label>
          <label className="text-sm font-bold text-slate-200 sm:col-span-2">
            Payload JSON
            <textarea
              required
              rows={6}
              value={form.payload}
              onChange={(event) => setField("payload", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-white"
            />
          </label>
          <label className="text-sm font-bold text-slate-200 sm:col-span-2">
            Previously consumed digests, comma separated
            <input
              value={form.consumedDigests}
              onChange={(event) => setField("consumedDigests", event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </label>
        </div>

        <fieldset className="grid gap-3 rounded-2xl border border-slate-800 p-4 sm:grid-cols-2">
          <legend className="px-2 text-sm font-black text-slate-200">Isolation signals</legend>
          {([
            ["deterministic", "Deterministic"],
            ["reversible", "Reversible"],
            ["requiresNetwork", "Requires network"],
            ["writesProduction", "Writes production"],
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
          {pending ? "Έλεγχος..." : "ΕΛΕΓΧΟΣ DISCONNECTED EDGE"}
        </button>
      </form>

      <section aria-live="polite" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-xl font-black text-white">Αποτέλεσμα</h2>
        {!result ? (
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Εδώ θα εμφανιστούν readiness, blockers, payload digest και receipt.
          </p>
        ) : !result.ok || !result.preflight ? (
          <div className="mt-4 rounded-2xl border border-rose-700 bg-rose-950/30 p-4 text-sm text-rose-200">
            {result.error ?? "edge_preflight_request_failed"}
            {result.detail ? <div className="mt-2 break-all font-mono text-xs">{result.detail}</div> : null}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-cyan-500/60 bg-cyan-500/10 p-4 text-cyan-100">
              <div className="text-xs font-black uppercase tracking-wider">Preflight</div>
              <div className="mt-1 text-2xl font-black">
                {result.preflight.readyForOwnerReview ? "READY FOR OWNER REVIEW" : "BLOCKED"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Reasons</div>
              {result.preflight.reasons.length ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {result.preflight.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
                </ul>
              ) : <p className="mt-2 text-sm text-emerald-200">No preflight blockers.</p>}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Payload digest</div>
              <div className="mt-2 break-all font-mono text-xs text-cyan-200">{result.preflight.payloadDigest ?? "not-created"}</div>
              <div className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">Receipt SHA-256</div>
              <div className="mt-2 break-all font-mono text-xs text-cyan-200">{result.receiptSha256}</div>
            </div>
            <dl className="grid gap-2 text-xs text-slate-400">
              <div className="flex justify-between gap-4"><dt>Handoff issued</dt><dd>{String(result.handoffIssued)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Assessment only</dt><dd>{String(result.assessmentOnly)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Execution allowed</dt><dd>{String(result.executionAllowed)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Production write</dt><dd>{String(result.productionWriteAllowed)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Authorization effect</dt><dd>{result.authorizationEffect}</dd></div>
              <div className="flex justify-between gap-4"><dt>Policy</dt><dd>{result.policyVersion}</dd></div>
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
