"use client";

import { useEffect, useMemo, useState } from "react";

const CONTINENTS = [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
] as const;

type Freshness = "FRESH" | "AGING" | "STALE";
type Trend = "NEW" | "RISING" | "STABLE" | "FALLING";

interface SignalRecord {
  signal: {
    id: string;
    title: string;
    domain: string;
    signalType: string;
    segment: {
      scope: string;
      continent?: string;
      countries?: string[];
    };
    evidence: Array<{
      id: string;
      publisher: string;
      title: string;
      observedAt: string;
      tier: string;
    }>;
  };
  assessment: {
    decision: string;
    evidenceScore: number;
    opportunityScore: number;
    riskScore: number;
  };
  countryValidationRefs: string[];
  trend: Trend;
  opportunityDelta: number;
  latestEvidenceAt: string | null;
}

interface CandidateRow {
  signalId: string;
  freshness: Freshness;
  candidate: {
    eligibleForFounderProposal: boolean;
    reasons: string[];
    safeguards: string[];
  };
}

interface RadarOverview {
  persisted: boolean;
  stateId: string | null;
  contentSha256: string;
  checkedAt: string;
  snapshot: {
    signals: SignalRecord[];
    sourceRefs: string[];
    aggregates: {
      totalSignals: number;
      globalSignals: number;
      continentSignals: Record<string, number>;
      byDomain: Record<string, number>;
      byDecision: Record<string, number>;
      byTrend: Record<Trend, number>;
      promotionEligible: number;
    };
  };
  promotionCandidates: CandidateRow[];
}

interface RadarApiResponse {
  ok: boolean;
  status?: string;
  marker?: string;
  overview?: RadarOverview;
  issue?: string;
  candidate?: CandidateRow["candidate"];
  intentId?: string;
  materialization?: {
    status: string;
    materialized: number;
    deduplicated: number;
    blocked: number;
    executionIds: string[];
  };
}

function badgeClass(value: string) {
  if (value === "RISING" || value === "FRESH" || value === "SPEC_CANDIDATE") {
    return "border-emerald-300/40 bg-emerald-300/10 text-emerald-200";
  }
  if (value === "FALLING" || value === "STALE") {
    return "border-rose-300/40 bg-rose-300/10 text-rose-200";
  }
  if (value === "AGING" || value === "VALIDATE_WITH_USERS") {
    return "border-amber-300/40 bg-amber-300/10 text-amber-200";
  }
  return "border-slate-300/30 bg-white/5 text-slate-200";
}

export default function KernelDemandRadarClient() {
  const [overview, setOverview] = useState<RadarOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sourceRef, setSourceRef] = useState("founder:manual-research-intake");
  const [ingestJson, setIngestJson] = useState("");

  async function loadRadar() {
    setLoading(true);
    try {
      const response = await fetch("/api/kernel/demand-radar", { cache: "no-store" });
      const body = (await response.json()) as RadarApiResponse;
      if (!response.ok || !body.ok || !body.overview) {
        throw new Error(body.issue || body.status || `HTTP ${response.status}`);
      }
      setOverview(body.overview);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Radar fetch failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRadar();
  }, []);

  const candidateBySignal = useMemo(() => {
    return new Map((overview?.promotionCandidates ?? []).map((row) => [row.signalId, row]));
  }, [overview]);

  async function postAction(payload: Record<string, unknown>): Promise<RadarApiResponse> {
    const response = await fetch("/api/kernel/demand-radar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as RadarApiResponse;
    if (!response.ok && response.status !== 409) {
      throw new Error(body.issue || body.status || `HTTP ${response.status}`);
    }
    return body;
  }

  async function initialize() {
    setWorking("initialize");
    try {
      const body = await postAction({ action: "initialize" });
      setMessage(body.ok ? "Canonical demand radar initialized." : body.status || "Initialization blocked.");
      await loadRadar();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Initialization failed");
    } finally {
      setWorking(null);
    }
  }

  async function promote(signalId: string) {
    setWorking(signalId);
    try {
      const body = await postAction({ action: "promote", signalId });
      if (body.ok) {
        const count = body.materialization?.materialized ?? 0;
        setMessage(`Promotion recorded. Intent ${body.intentId ?? "created"}; materialized ${count}.`);
      } else {
        setMessage(`Promotion blocked: ${(body.candidate?.reasons ?? []).join(", ") || body.status || "governance"}.`);
      }
      await loadRadar();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Promotion failed");
    } finally {
      setWorking(null);
    }
  }

  async function ingest() {
    setWorking("ingest");
    try {
      const parsed = JSON.parse(ingestJson) as unknown;
      const items = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { items?: unknown }).items)
          ? (parsed as { items: unknown[] }).items
          : null;
      if (!items?.length) throw new Error("Provide a JSON array of ingest items or an object with an items array.");
      const body = await postAction({ action: "ingest", sourceRef, items });
      setMessage(body.ok ? `Research intake ${body.status ?? "accepted"}.` : body.status || "Ingest blocked.");
      setIngestJson("");
      await loadRadar();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Research ingest failed");
    } finally {
      setWorking(null);
    }
  }

  const aggregates = overview?.snapshot.aggregates;

  return (
    <main className="min-h-screen bg-[#05070d] px-5 py-8 text-white">
      <section className="mx-auto max-w-7xl rounded-[2rem] border border-cyan-300/25 bg-slate-950/85 p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-cyan-300">Pantavion Founder Intelligence</p>
            <h1 className="mt-4 text-4xl font-black md:text-6xl">Global Human Demand Radar</h1>
            <p className="mt-4 max-w-4xl leading-8 text-slate-200">
              Founder-only canonical view of human needs, evidence freshness, regional differences and governed implementation candidates.
            </p>
          </div>
          <a href="/kernel" className="rounded-2xl border border-white/30 px-5 py-3 text-sm font-black">Back to Kernel</a>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={() => void loadRadar()} disabled={loading} className="rounded-2xl bg-cyan-300 px-5 py-3 font-black text-black disabled:opacity-50">
            {loading ? "Refreshing..." : "Refresh live state"}
          </button>
          {overview && !overview.persisted ? (
            <button type="button" onClick={() => void initialize()} disabled={working !== null} className="rounded-2xl border border-yellow-300/60 bg-yellow-300/10 px-5 py-3 font-black text-yellow-100 disabled:opacity-50">
              Initialize canonical seed
            </button>
          ) : null}
        </div>

        {message ? <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">{message}</p> : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Stat label="Canonical state" value={overview?.persisted ? "PERSISTED" : "SEED ONLY"} />
          <Stat label="Signals" value={String(aggregates?.totalSignals ?? 0)} />
          <Stat label="Rising" value={String(aggregates?.byTrend.RISING ?? 0)} />
          <Stat label="Promotion eligible" value={String(aggregates?.promotionEligible ?? 0)} />
          <Stat label="Global signals" value={String(aggregates?.globalSignals ?? 0)} />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-6 text-slate-300">
          <p>state_id: {overview?.stateId ?? "not persisted"}</p>
          <p>sha256: {overview?.contentSha256 ?? "-"}</p>
          <p>checked: {overview?.checkedAt ?? "-"}</p>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        <h2 className="text-2xl font-black">Seven-continent coverage</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTINENTS.map((continent) => (
            <article key={continent} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="font-black">{continent}</p>
              <p className="mt-3 text-3xl font-black text-cyan-200">{aggregates?.continentSignals[continent] ?? 0}</p>
              <p className="mt-2 text-xs text-slate-400">current evidence-backed signal(s)</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Signals and governed actions</h2>
            <p className="mt-2 text-sm text-slate-300">Promotion remains proposal-only and is tied to the exact canonical snapshot.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {(overview?.snapshot.signals ?? []).map((record) => {
            const row = candidateBySignal.get(record.signal.id);
            const eligible = row?.candidate.eligibleForFounderProposal ?? false;
            return (
              <article key={record.signal.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className={`rounded-full border px-3 py-1 ${badgeClass(record.trend)}`}>{record.trend}</span>
                  <span className={`rounded-full border px-3 py-1 ${badgeClass(row?.freshness ?? "STALE")}`}>{row?.freshness ?? "STALE"}</span>
                  <span className={`rounded-full border px-3 py-1 ${badgeClass(record.assessment.decision)}`}>{record.assessment.decision}</span>
                </div>

                <h3 className="mt-4 text-xl font-black">{record.signal.title}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  {record.signal.segment.scope}{record.signal.segment.continent ? ` · ${record.signal.segment.continent}` : ""}
                  {record.signal.segment.countries?.length ? ` · ${record.signal.segment.countries.join(", ")}` : ""}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
                  <Metric label="Evidence" value={record.assessment.evidenceScore} />
                  <Metric label="Opportunity" value={record.assessment.opportunityScore} />
                  <Metric label="Risk" value={record.assessment.riskScore} />
                </div>

                <div className="mt-5 text-sm leading-6 text-slate-300">
                  <p>Domain: {record.signal.domain}</p>
                  <p>Latest evidence: {record.latestEvidenceAt ?? "unknown"}</p>
                  <p>Country validation refs: {record.countryValidationRefs.length}</p>
                  <p>Opportunity delta: {record.opportunityDelta >= 0 ? "+" : ""}{record.opportunityDelta}</p>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-6 text-slate-300">
                  {eligible ? (
                    <p className="text-emerald-200">Eligible for founder proposal under current evidence/risk thresholds.</p>
                  ) : (
                    <p>Blocked: {(row?.candidate.reasons ?? ["not evaluated"]).join(", ")}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void promote(record.signal.id)}
                  disabled={!overview?.persisted || !eligible || working !== null}
                  className="mt-5 rounded-2xl border border-emerald-300/50 bg-emerald-300/10 px-5 py-3 text-sm font-black text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {working === record.signal.id ? "Promoting..." : "Create governed work-order proposal"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-black">Founder research intake</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
          Accepts validated Pantavion demand-signal JSON from research agents or reviewed external research. Intake updates canonical research state only; it never grants production authority.
        </p>
        <input
          value={sourceRef}
          onChange={(event) => setSourceRef(event.target.value)}
          className="mt-5 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm outline-none"
          placeholder="source reference"
        />
        <textarea
          value={ingestJson}
          onChange={(event) => setIngestJson(event.target.value)}
          className="mt-3 min-h-48 w-full rounded-2xl border border-white/15 bg-black/30 p-4 font-mono text-xs outline-none"
          placeholder='[{"signal": {...}, "countryValidationRefs": ["evidence-id"]}]'
        />
        <button type="button" onClick={() => void ingest()} disabled={working !== null || !ingestJson.trim()} className="mt-3 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black disabled:opacity-40">
          {working === "ingest" ? "Validating and canonicalizing..." : "Ingest research into Pantavion"}
        </button>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-3 break-words text-2xl font-black text-cyan-100">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
