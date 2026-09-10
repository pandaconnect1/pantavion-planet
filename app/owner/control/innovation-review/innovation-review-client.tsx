"use client";

import { type FormEvent, useState } from "react";

const queueFingerprint =
  "f9149725957a173c9dc02c16858503c766744165ddb6f9ebc92191f7182afcb7";

const example = JSON.stringify(
  {
    batchId: "founder-review-batch-001",
    sourceQueueFingerprint: queueFingerprint,
    items: [
      {
        queueItemId: "queue-item-001",
        atomId: "atom-001",
        sourceCandidateId: "candidate-001",
        atomFingerprint: "a".repeat(64),
        decision: "HOLD",
        rationale: "Αναμονή για πρόσθετα τεκμήρια πριν από οποιαδήποτε απόφαση.",
        evidenceRefs: [],
        sourcePreserved: true,
        semanticMergeAuthorized: false,
        noveltyClaimed: false,
        executionAuthorized: false,
      },
    ],
  },
  null,
  2,
);

type PreflightResponse = {
  ok: boolean;
  error?: string;
  detail?: string;
  receiptSha256?: string;
  preflightOnly?: boolean;
  ownerRecordingRequired?: boolean;
  summary?: {
    itemCount: number;
    holdCount: number;
    readyForOwnerRecordingCount: number;
    decisionsRecorded: number;
    semanticMergesPerformed: number;
    noveltyClaimsAllowed: number;
    executionAuthorizations: number;
  };
  results?: Array<{
    queueItemId: string;
    atomId: string;
    proposedDecision: string;
    readiness: string;
    evidenceCount: number;
    decisionRecorded: boolean;
    semanticMergePerformed: boolean;
    executionAllowed: boolean;
    authorizationEffect: string;
  }>;
};

export default function FounderInnovationReviewClient() {
  const [payload, setPayload] = useState(example);
  const [result, setResult] = useState<PreflightResponse | null>(null);
  const [pending, setPending] = useState(false);

  async function preflight(event: FormEvent<HTMLFormElement>) {
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
      const response = await fetch("/api/owner/innovation-review/preflight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed),
      });
      setResult((await response.json()) as PreflightResponse);
    } catch {
      setResult({ ok: false, error: "innovation_review_preflight_failed" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <form onSubmit={preflight} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-xl font-black text-white">Batch preflight</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Έως 100 queue items ανά έλεγχο. Το preflight δεν καταγράφει απόφαση και δεν συγχωνεύει atoms.
        </p>
        <label className="mt-5 block text-sm font-bold text-slate-200">
          Review batch JSON
          <textarea
            required
            rows={24}
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
          {pending ? "Έλεγχος..." : "ΕΛΕΓΧΟΣ REVIEW BATCH"}
        </button>
      </form>

      <section aria-live="polite" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-xl font-black text-white">Αποτέλεσμα</h2>
        {!result ? (
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Το deterministic receipt και τα fail-closed αποτελέσματα θα εμφανιστούν εδώ.
          </p>
        ) : !result.ok || !result.summary ? (
          <div className="mt-4 rounded-2xl border border-rose-700 bg-rose-950/30 p-4 text-sm text-rose-200">
            {result.error ?? "innovation_review_preflight_failed"}
            {result.detail ? <div className="mt-2 break-all font-mono text-xs">{result.detail}</div> : null}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-cyan-500/60 bg-cyan-500/10 p-4 text-cyan-100">
              <div className="text-xs font-black uppercase tracking-wider">Preflight summary</div>
              <div className="mt-2 text-2xl font-black">{result.summary.itemCount} ITEMS CHECKED</div>
              <div className="mt-2 text-sm">
                {result.summary.readyForOwnerRecordingCount} ready · {result.summary.holdCount} hold
              </div>
            </div>
            <dl className="grid gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
              <div className="flex justify-between gap-4"><dt>Decisions recorded</dt><dd>{result.summary.decisionsRecorded}</dd></div>
              <div className="flex justify-between gap-4"><dt>Semantic merges</dt><dd>{result.summary.semanticMergesPerformed}</dd></div>
              <div className="flex justify-between gap-4"><dt>Novelty claims</dt><dd>{result.summary.noveltyClaimsAllowed}</dd></div>
              <div className="flex justify-between gap-4"><dt>Execution authorizations</dt><dd>{result.summary.executionAuthorizations}</dd></div>
              <div className="flex justify-between gap-4"><dt>Preflight only</dt><dd>{String(result.preflightOnly)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Owner recording required</dt><dd>{String(result.ownerRecordingRequired)}</dd></div>
            </dl>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Receipt SHA-256</div>
              <div className="mt-2 break-all font-mono text-xs leading-5 text-cyan-200">{result.receiptSha256}</div>
            </div>
            <div className="space-y-2">
              {result.results?.map((item) => (
                <article key={item.queueItemId} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="break-all font-mono text-xs text-cyan-200">{item.atomId}</div>
                  <div className="mt-2 text-sm font-black text-white">{item.readiness}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {item.proposedDecision} · evidence {item.evidenceCount} · recorded {String(item.decisionRecorded)}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
