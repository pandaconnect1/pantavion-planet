"use client";

import { type FormEvent, useState } from "react";

type Source = "pantavion_native" | "open_source" | "open_standard" | "external_provider";
type Maturity = "research" | "prototype" | "production_proven";
type EvidenceKind = "source" | "benchmark" | "security" | "privacy" | "license";

type AssessmentPayload = {
  ok: boolean;
  error?: string;
  detail?: string;
  policyVersion?: string;
  assessmentOnly?: boolean;
  installationAuthorized?: boolean;
  deploymentAuthorized?: boolean;
  authorizationEffect?: string;
  receiptSha256?: string;
  assessment?: {
    readiness: "hold" | "prototype_ready" | "owner_approval_required";
    blockers: string[];
  };
};

const evidenceKinds: EvidenceKind[] = ["source", "benchmark", "security", "privacy", "license"];

export default function FounderTechnologyLibraryClient() {
  const [identity, setIdentity] = useState({
    id: "",
    name: "",
    capability: "",
    source: "open_source" as Source,
    maturity: "research" as Maturity,
    licenseId: "",
    observedAt: "",
  });
  const [evidence, setEvidence] = useState<Record<EvidenceKind, string>>({
    source: "",
    benchmark: "",
    security: "",
    privacy: "",
    license: "",
  });
  const [signals, setSignals] = useState({
    commercialUseAllowed: false,
    sourceAvailable: false,
    reversibleIntegration: false,
    securityReviewed: false,
    privacyReviewed: false,
  });
  const [result, setResult] = useState<AssessmentPayload | null>(null);
  const [pending, setPending] = useState(false);

  async function assess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/owner/technology-library/assess", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: identity.id,
          name: identity.name,
          capability: identity.capability,
          source: identity.source,
          maturity: identity.maturity,
          licenseId: identity.licenseId,
          ...signals,
          evidence: evidenceKinds.map((kind) => ({
            kind,
            reference: evidence[kind],
            observedAt: identity.observedAt,
          })),
        }),
      });
      setResult((await response.json()) as AssessmentPayload);
    } catch {
      setResult({ ok: false, error: "technology_assessment_request_failed" });
    } finally {
      setPending(false);
    }
  }

  const readiness = result?.assessment?.readiness;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <form onSubmit={assess} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Νέα αξιολόγηση τεχνολογίας</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Καταχώρισε μόνο πραγματικά τεκμήρια. Κενό ή ασύμφωνο στοιχείο οδηγεί σε HOLD.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["id", "Technology ID", 160],
            ["name", "Όνομα", 240],
            ["licenseId", "License ID", 160],
          ] as const).map(([field, label, maxLength]) => (
            <label key={field} className="text-sm font-bold text-slate-200">
              {label}
              <input
                required
                maxLength={maxLength}
                value={identity[field]}
                onChange={(event) => setIdentity((current) => ({ ...current, [field]: event.target.value }))}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
              />
            </label>
          ))}
          <label className="text-sm font-bold text-slate-200">
            Source
            <select
              value={identity.source}
              onChange={(event) => setIdentity((current) => ({ ...current, source: event.target.value as Source }))}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            >
              <option value="pantavion_native">Pantavion native</option>
              <option value="open_source">Open source</option>
              <option value="open_standard">Open standard</option>
              <option value="external_provider">External provider</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-200">
            Maturity
            <select
              value={identity.maturity}
              onChange={(event) => setIdentity((current) => ({ ...current, maturity: event.target.value as Maturity }))}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            >
              <option value="research">Research</option>
              <option value="prototype">Prototype</option>
              <option value="production_proven">Production proven</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-200">
            Evidence observed at
            <input
              required
              type="datetime-local"
              value={identity.observedAt}
              onChange={(event) => setIdentity((current) => ({ ...current, observedAt: event.target.value }))}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </label>
          <label className="text-sm font-bold text-slate-200 sm:col-span-2">
            Capability
            <textarea
              required
              maxLength={2000}
              rows={3}
              value={identity.capability}
              onChange={(event) => setIdentity((current) => ({ ...current, capability: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            />
          </label>
        </div>

        <fieldset className="grid gap-4 rounded-2xl border border-slate-800 p-4 sm:grid-cols-2">
          <legend className="px-2 text-sm font-black text-slate-200">Evidence references</legend>
          {evidenceKinds.map((kind) => (
            <label key={kind} className="text-sm font-bold capitalize text-slate-200">
              {kind}
              <input
                required
                maxLength={1024}
                value={evidence[kind]}
                onChange={(event) => setEvidence((current) => ({ ...current, [kind]: event.target.value }))}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
              />
            </label>
          ))}
        </fieldset>

        <fieldset className="grid gap-3 rounded-2xl border border-slate-800 p-4 sm:grid-cols-2">
          <legend className="px-2 text-sm font-black text-slate-200">Verified signals</legend>
          {(Object.keys(signals) as Array<keyof typeof signals>).map((field) => (
            <label key={field} className="flex min-h-11 items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={signals[field]}
                onChange={(event) => setSignals((current) => ({ ...current, [field]: event.target.checked }))}
                className="h-5 w-5 accent-cyan-400"
              />
              {field}
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-5 font-black text-cyan-100 disabled:opacity-50"
        >
          {pending ? "Αξιολόγηση..." : "ΑΞΙΟΛΟΓΗΣΗ TECHNOLOGY LIBRARY"}
        </button>
      </form>

      <section aria-live="polite" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-xl font-black text-white">Αποτέλεσμα</h2>
        {!result ? (
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Η readiness, οι blockers και το SHA-256 receipt θα εμφανιστούν εδώ.
          </p>
        ) : !result.ok || !readiness ? (
          <div className="mt-4 rounded-2xl border border-rose-700 bg-rose-950/30 p-4 text-sm text-rose-200">
            {result.error ?? "technology_assessment_request_failed"}
            {result.detail ? <div className="mt-2 break-all font-mono text-xs">{result.detail}</div> : null}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-cyan-500/60 bg-cyan-500/10 p-4 text-cyan-100">
              <div className="text-xs font-black uppercase tracking-wider">Readiness</div>
              <div className="mt-1 text-2xl font-black">{readiness.toUpperCase()}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Blockers</div>
              {result.assessment?.blockers.length ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {result.assessment.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}
                </ul>
              ) : <p className="mt-2 text-sm text-emerald-200">No assessment blockers.</p>}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Receipt SHA-256</div>
              <div className="mt-2 break-all font-mono text-xs leading-5 text-cyan-200">{result.receiptSha256}</div>
            </div>
            <dl className="grid gap-2 text-xs text-slate-400">
              <div className="flex justify-between gap-4"><dt>Assessment only</dt><dd>{String(result.assessmentOnly)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Install authorized</dt><dd>{String(result.installationAuthorized)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Deploy authorized</dt><dd>{String(result.deploymentAuthorized)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Authorization effect</dt><dd>{result.authorizationEffect}</dd></div>
              <div className="flex justify-between gap-4"><dt>Policy</dt><dd>{result.policyVersion}</dd></div>
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
