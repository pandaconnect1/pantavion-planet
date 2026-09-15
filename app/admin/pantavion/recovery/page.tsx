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
  nextCursor: number;
  lastPageCount: number;
  terminal: boolean;
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
  recentEvidence: string[];
  hardGaps: string[];
  rules: string[];
}

const STATUS_URL =
  "https://api.github.com/repos/pandaconnect1/pantavion-planet/contents/docs/recovery/live/VERCEL_RESCUE_STATUS.json?ref=backup%2Fpre-vercel-risk-20260914";

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

async function loadStatus(): Promise<RescueStatus | null> {
  try {
    const response = await fetch(STATUS_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github.raw+json",
        "User-Agent": "pantavion-founder-recovery",
      },
    });

    if (!response.ok) return null;
    return (await response.json()) as RescueStatus;
  } catch {
    return null;
  }
}

function laneLabel(lane: RescueLane): string {
  if (lane.terminal) return "terminal 0 reached";
  return `open · last page ${lane.lastPageCount}/20`;
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

  const status = await loadStatus();

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-cyan-300/20 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Founder only</p>
              <h1 className="mt-2 text-3xl font-black">Pantavion Recovery Live Truth</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
                Emergency Vercel preservation status. This surface shows evidence and current cursors only; a READY or production deployment is not promoted to VERIFIED_LIVE without runtime proof.
              </p>
            </div>
            <div className="flex gap-2">
              <a href="/admin/pantavion/intelligence" className="rounded-2xl border border-cyan-300/25 px-4 py-2 text-sm font-bold text-cyan-100">Intelligence</a>
              <a href="/kernel" className="rounded-2xl border border-slate-300/30 px-4 py-2 text-sm font-bold text-slate-100">Kernel</a>
            </div>
          </div>
        </header>

        {!status ? (
          <section className="rounded-3xl border border-rose-300/25 bg-rose-300/5 p-6">
            <h2 className="text-xl font-black text-rose-100">Recovery feed unavailable</h2>
            <p className="mt-2 text-sm text-slate-300">The live recovery manifest could not be read. This is a visibility failure, not proof that rescue work stopped.</p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">Phase</p>
                <p className="mt-2 text-lg font-black text-amber-100">{status.phase}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">Recovered floor</p>
                <p className="mt-2 text-3xl font-black">≥ {status.recoveredDeploymentRecordsFloor.toLocaleString()}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">Source estimate</p>
                <p className="mt-2 text-3xl font-black">~ {status.estimatedSourceRecords.toLocaleString()}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">Last update</p>
                <p className="mt-2 text-sm font-black">{status.updatedAt}</p>
              </article>
            </section>

            <section className="rounded-3xl border border-amber-300/20 bg-amber-300/5 p-5 text-sm leading-6 text-amber-50">
              <p className="font-black">Truth boundary</p>
              <p className="mt-1">{status.estimatedSourceRecordsBasis}</p>
              <p>{status.recoveredDeploymentRecordsFloorBasis}</p>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              {[status.canonical, status.mirror].map((lane) => (
                <article key={lane.projectId} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Vercel lane</p>
                      <h2 className="mt-2 text-xl font-black">{lane.project}</h2>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${lane.terminal ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-amber-300/30 bg-amber-300/10 text-amber-100"}`}>
                      {laneLabel(lane)}
                    </span>
                  </div>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-slate-400">Project ID</dt><dd className="break-all text-right font-mono text-xs">{lane.projectId}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-400">Next cursor</dt><dd className="font-mono text-xs">{lane.nextCursor}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-400">Last page</dt><dd className="font-bold">{lane.lastPageCount}</dd></div>
                  </dl>
                </article>
              ))}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">Latest batch</p>
              <h2 className="mt-2 text-2xl font-black">{status.latestBatch.records} records · {status.latestBatch.pages} pages</h2>
              <p className="mt-2 text-sm text-slate-300">{status.latestBatch.note}</p>
            </section>

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

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Recovery rules</p>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {status.rules.map((item) => <p key={item} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">{item}</p>)}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
