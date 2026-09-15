import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  isPantavionKernelAccessAllowed,
  isPantavionKernelFounderIdentityAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
  PANTAVION_KERNEL_FOUNDER_QUERY,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams?: Promise<SearchParams>;
}

interface RescueLane {
  project: string;
  projectId: string;
  nextCursor?: number | null;
  lastPageCount?: number;
  terminal: boolean;
}

interface CoordinatorStatus {
  mode?: string;
  activeLocks?: string[];
  vercelProjectCount?: number;
  noGitProjectCount?: number;
  deepPaginationDuplicated?: boolean;
  zeroDeletions?: boolean;
  zeroVercelMutations?: boolean;
  secretValuesRecorded?: boolean;
}

interface RescueStatus {
  updatedAt: string;
  phase: string;
  estimatedSourceRecords: number;
  estimatedSourceRecordsBasis: string;
  recoveredDeploymentRecordsFloor: number;
  recoveredDeploymentRecordsFloorBasis: string;
  canonical: RescueLane;
  mirror: RescueLane;
  latestBatch: {
    records: number;
    pages: number;
    note: string;
  };
  parallelCoordinator?: CoordinatorStatus;
  recentEvidence: string[];
  hardGaps: string[];
  rules: string[];
}

interface LaneAStatus {
  updatedAt: string;
  lane: "A";
  status: string;
  project: string;
  projectId: string;
  recordsCapturedThisLaneRun: number;
  terminal: boolean;
  terminalProbeCount: number;
  recoveredDeploymentRecordsFloorAfterCheckpoint: number;
  rescue_state: string;
}

interface LaneFStatus {
  updatedAt: string;
  lane: "F";
  status: string;
  canonicalizedRecordsThisCheckpoint: number;
  canonicalizedRecordsFloor: number;
  sourceRecordsAvailableFloor: number;
  canonicalArtifact: string;
  terminalEvidenceBound: boolean;
  githubEvidenceBound: boolean;
  pantavionFounderFeedBound: boolean;
  classificationState: string;
  remaining: string[];
}

const GITHUB_BASE =
  "https://api.github.com/repos/pandaconnect1/pantavion-planet/contents/";
const RECOVERY_REF = "backup%2Fpre-vercel-risk-20260914";

function sourceUrl(path: string): string {
  return `${GITHUB_BASE}${path}?ref=${RECOVERY_REF}`;
}

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

async function loadJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(sourceUrl(path), {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github.raw+json",
        "User-Agent": "pantavion-founder-recovery",
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function truthBadge(ok: boolean, yes: string, no: string) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black ${
        ok
          ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
          : "border-amber-300/30 bg-amber-300/10 text-amber-100"
      }`}
    >
      {ok ? yes : no}
    </span>
  );
}

export default async function FounderRecoveryPage({ searchParams }: PageProps) {
  const resolved = searchParams ? await searchParams : {};
  const queryToken =
    firstParam(resolved[PANTAVION_KERNEL_ACCESS_QUERY]) ??
    firstParam(resolved[PANTAVION_KERNEL_FOUNDER_QUERY]);
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PANTAVION_KERNEL_SESSION_COOKIE)?.value ?? null;

  const secretAllowed =
    isPantavionKernelAccessAllowed(queryToken) ||
    isPantavionKernelAccessAllowed(sessionToken);

  if (!secretAllowed || !(await isPantavionKernelFounderIdentityAllowed())) {
    notFound();
  }

  const [status, laneA, laneF] = await Promise.all([
    loadJson<RescueStatus>("docs/recovery/live/VERCEL_RESCUE_STATUS.json"),
    loadJson<LaneAStatus>("docs/recovery/live/shards/lane-a-canonical.json"),
    loadJson<LaneFStatus>("docs/recovery/live/shards/lane-f-canonical-ingestion.json"),
  ]);

  const recoveredFloor = Math.max(
    status?.recoveredDeploymentRecordsFloor ?? 0,
    laneA?.recoveredDeploymentRecordsFloorAfterCheckpoint ?? 0,
  );
  const activeLocks = status?.parallelCoordinator?.activeLocks ?? [];

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-cyan-300/20 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
                Founder only · live recovery truth
              </p>
              <h1 className="mt-2 text-3xl font-black">Pantavion Vercel Rescue</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
                Recovery, canonicalization and Pantavion ingestion across all preserved projects. READY or production is historical evidence only until direct runtime verification proves VERIFIED_LIVE.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/admin/pantavion" className="rounded-2xl border border-cyan-300/25 px-4 py-2 text-sm font-bold text-cyan-100">Admin</a>
              <a href="/admin/pantavion/intelligence" className="rounded-2xl border border-cyan-300/25 px-4 py-2 text-sm font-bold text-cyan-100">Intelligence</a>
              <a href="/kernel" className="rounded-2xl border border-slate-300/30 px-4 py-2 text-sm font-bold text-slate-100">Kernel</a>
            </div>
          </div>
        </header>

        {!status && !laneA && !laneF ? (
          <section className="rounded-3xl border border-rose-300/25 bg-rose-300/5 p-6">
            <h2 className="text-xl font-black text-rose-100">Recovery feed unavailable</h2>
            <p className="mt-2 text-sm text-slate-300">The recovery manifests could not be read. This is a visibility failure, not proof that rescue work stopped.</p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">Phase</p>
                <p className="mt-2 text-lg font-black text-amber-100">{status?.phase ?? "RECOVERY"}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">Recovered floor</p>
                <p className="mt-2 text-3xl font-black">≥ {recoveredFloor.toLocaleString()}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">Projects</p>
                <p className="mt-2 text-3xl font-black">{status?.parallelCoordinator?.vercelProjectCount ?? 15}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">Canonicalized</p>
                <p className="mt-2 text-3xl font-black">≥ {(laneF?.canonicalizedRecordsFloor ?? 0).toLocaleString()}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">Last evidence update</p>
                <p className="mt-2 text-sm font-black">{laneF?.updatedAt ?? laneA?.updatedAt ?? status?.updatedAt ?? "unknown"}</p>
              </article>
            </section>

            <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Parallel lanes</p>
                  <h2 className="mt-2 text-2xl font-black">A–L rescue architecture</h2>
                </div>
                <span className="rounded-full border border-cyan-300/25 bg-black/20 px-3 py-1 text-xs font-black text-cyan-100">
                  Active reported: {activeLocks.length ? activeLocks.join(", ") : "read from lane shards"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">Deep history lanes capture evidence; canonical lanes classify, deduplicate and bind it to GitHub evidence plus this founder feed. No lane may claim completion from raw capture alone.</p>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Lane A · canonical project history</p>
                    <h2 className="mt-2 text-xl font-black">{laneA?.project ?? status?.canonical.project ?? "pantavion-planet"}</h2>
                  </div>
                  {truthBadge(Boolean(laneA?.terminal ?? status?.canonical.terminal), "terminal 0 proven", "history still open")}
                </div>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">Captured this lane run</dt><dd className="font-black">{laneA?.recordsCapturedThisLaneRun ?? "—"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">Terminal probe count</dt><dd className="font-black">{laneA?.terminalProbeCount ?? "—"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">Rescue state</dt><dd className="font-mono text-xs">{laneA?.rescue_state ?? "—"}</dd></div>
                </dl>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">Lane F · canonical ingestion</p>
                    <h2 className="mt-2 text-xl font-black">GitHub → Pantavion classified feed</h2>
                  </div>
                  {truthBadge(Boolean(laneF?.pantavionFounderFeedBound), "feed bound", "binding pending")}
                </div>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">Canonicalized floor</dt><dd className="font-black">≥ {laneF?.canonicalizedRecordsFloor ?? 0}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">Source evidence floor</dt><dd className="font-black">≥ {laneF?.sourceRecordsAvailableFloor ?? recoveredFloor}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">Classification</dt><dd className="font-mono text-xs">{laneF?.classificationState ?? "pending"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">GitHub evidence</dt><dd>{laneF?.githubEvidenceBound ? "BOUND" : "pending"}</dd></div>
                </dl>
              </article>
            </section>

            {laneF?.remaining?.length ? (
              <section className="rounded-3xl border border-amber-300/20 bg-amber-300/5 p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Canonical ingestion queue</p>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {laneF.remaining.map((item) => <p key={item} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">{item}</p>)}
                </div>
              </section>
            ) : null}

            {status ? (
              <section className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Recovered evidence</p>
                  <div className="mt-4 space-y-2">
                    {status.recentEvidence.map((item) => <p key={item} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">{item}</p>)}
                  </div>
                </article>
                <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-200">Hard gaps</p>
                  <div className="mt-4 space-y-2">
                    {status.hardGaps.map((item) => <p key={item} className="rounded-xl border border-rose-300/15 bg-rose-300/5 p-3 text-sm text-slate-200">{item}</p>)}
                  </div>
                </article>
              </section>
            ) : null}

            <section className="rounded-3xl border border-amber-300/20 bg-amber-300/5 p-5 text-sm leading-6 text-amber-50">
              <p className="font-black">Completion rule</p>
              <p className="mt-1">CAPTURED → CLASSIFIED → CANONICALIZED → GITHUB_EVIDENCE_BOUND → PANTAVION_FOUNDER_FEED_BOUND → VERIFIED_OR_EXPLICIT_GAP</p>
              <p className="mt-2 text-slate-300">Raw captured data is not counted as finished until it is classified, provenance-bound and visible through the founder recovery feed or explicitly recorded as a gap.</p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
