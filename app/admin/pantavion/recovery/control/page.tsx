import { cookies } from "next/headers";
import Link from "next/link";

import {
  isPantavionKernelAccessAllowed,
  isPantavionKernelFounderIdentityAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
  PANTAVION_KERNEL_FOUNDER_QUERY,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";
import {
  getPantavionRecoveryFounderSnapshot,
  type PantavionRecoveryFounderSnapshot,
  type PantavionRecoveryStageCounts,
} from "@/lib/supabase/oidc-founder-recovery-bridge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;
interface PageProps { searchParams?: Promise<SearchParams>; }

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

const stageOrder = ["classify", "canonicalize", "route", "audit", "work_unit_generation"] as const;

function StageCard({ name, counts }: { name: string; counts?: PantavionRecoveryStageCounts }) {
  const c = counts ?? { planned: 0, queued: 0, running: 0, paused: 0, succeeded: 0, failed: 0 };
  const terminal = c.succeeded === 165 && c.failed === 0;
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-black uppercase tracking-wide">{name.replaceAll("_", " ")}</h3>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${terminal ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-amber-300/30 bg-amber-300/10 text-amber-100"}`}>
          {terminal ? "TERMINAL" : "ACTIVE / WAITING"}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div><dt className="text-slate-500">Succeeded</dt><dd className="text-lg font-black">{c.succeeded}</dd></div>
        <div><dt className="text-slate-500">Running</dt><dd className="text-lg font-black">{c.running}</dd></div>
        <div><dt className="text-slate-500">Planned</dt><dd className="text-lg font-black">{c.planned}</dd></div>
        <div><dt className="text-slate-500">Paused</dt><dd className="text-lg font-black">{c.paused}</dd></div>
        <div><dt className="text-slate-500">Queued</dt><dd className="text-lg font-black">{c.queued}</dd></div>
        <div><dt className="text-slate-500">Failed</dt><dd className={`text-lg font-black ${c.failed ? "text-rose-200" : ""}`}>{c.failed}</dd></div>
      </dl>
    </article>
  );
}

export default async function FounderRecoveryControlPage({ searchParams }: PageProps) {
  const resolved = searchParams ? await searchParams : {};
  const queryToken = firstParam(resolved[PANTAVION_KERNEL_ACCESS_QUERY]) ?? firstParam(resolved[PANTAVION_KERNEL_FOUNDER_QUERY]);
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PANTAVION_KERNEL_SESSION_COOKIE)?.value ?? null;
  const secretAllowed = isPantavionKernelAccessAllowed(queryToken) || isPantavionKernelAccessAllowed(sessionToken);
  const founderAllowed = secretAllowed && (await isPantavionKernelFounderIdentityAllowed());

  if (!founderAllowed) {
    return (
      <main className="min-h-screen bg-[#05070d] px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-300/20 bg-white/[0.03] p-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">Founder protected control plane</p>
          <h1 className="mt-3 text-3xl font-black">Founder Access Required</h1>
          <p className="mt-4 text-sm text-slate-300">Operational recovery data is available only after founder authentication.</p>
          <Link href="/auth/login" className="mt-6 inline-flex rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100">Founder sign in</Link>
        </div>
      </main>
    );
  }

  let snapshot: PantavionRecoveryFounderSnapshot | null = null;
  let snapshotError: string | null = null;
  try {
    snapshot = await getPantavionRecoveryFounderSnapshot();
  } catch (error) {
    snapshotError = error instanceof Error ? error.message : "founder_snapshot_unavailable";
  }

  const gaps = snapshot?.gaps;
  const completionPercent = snapshot ? Math.round((snapshot.catalogRecords / snapshot.expectedRecords) * 10000) / 100 : 0;

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-cyan-300/20 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Founder only · control plane</p>
              <h1 className="mt-2 text-3xl font-black">Pantavion Recovery Control Room</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">Live durable truth from Supabase. Classification, canonicalization, module routing, audit and work-unit generation are counted only from durable execution state.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/pantavion/recovery" className="rounded-2xl border border-cyan-300/25 px-4 py-2 text-sm font-bold text-cyan-100">Recovery evidence</Link>
              <Link href="/admin/pantavion/intelligence" className="rounded-2xl border border-cyan-300/25 px-4 py-2 text-sm font-bold text-cyan-100">Intelligence</Link>
              <Link href="/kernel" className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-bold text-slate-200">Kernel</Link>
            </div>
          </div>
        </header>

        {snapshotError || !snapshot ? (
          <section className="rounded-3xl border border-rose-300/25 bg-rose-300/5 p-6">
            <h2 className="text-xl font-black text-rose-100">Live Supabase control snapshot unavailable</h2>
            <p className="mt-2 text-sm text-slate-300">{snapshotError ?? "unknown"}. This is a visibility fault, not evidence that recovery data was lost.</p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase text-slate-400">Catalog records</p><p className="mt-2 text-3xl font-black">{snapshot.catalogRecords.toLocaleString()} / {snapshot.expectedRecords.toLocaleString()}</p></article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase text-slate-400">Operational absorption</p><p className="mt-2 text-3xl font-black">{completionPercent}%</p></article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase text-slate-400">Review required</p><p className="mt-2 text-3xl font-black">{(snapshot.reviewStatus.REVIEW_REQUIRED ?? 0).toLocaleString()}</p></article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase text-slate-400">Last live snapshot</p><p className="mt-2 text-sm font-black">{snapshot.generatedAt}</p></article>
            </section>

            <section>
              <div className="mb-3"><p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">Durable pipeline</p><h2 className="mt-1 text-2xl font-black">165 partitions × 5 stages</h2></div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">{stageOrder.map((stage) => <StageCard key={stage} name={stage} counts={snapshot.stages[stage]} />)}</div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-3xl border border-amber-300/20 bg-amber-300/5 p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Gaps / holds</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between"><dt>Missing module</dt><dd className="font-black">{gaps?.missingModule ?? 0}</dd></div>
                  <div className="flex justify-between"><dt>Missing subsystem</dt><dd className="font-black">{gaps?.missingSubsystem ?? 0}</dd></div>
                  <div className="flex justify-between"><dt>Missing capability</dt><dd className="font-black">{gaps?.missingCapability ?? 0}</dd></div>
                  <div className="flex justify-between"><dt>Missing canonical target</dt><dd className="font-black">{gaps?.missingCanonicalTarget ?? 0}</dd></div>
                  <div className="flex justify-between"><dt>REVIEW_REQUIRED</dt><dd className="font-black">{gaps?.reviewRequired ?? 0}</dd></div>
                </dl>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Runtime lanes</p>
                <dl className="mt-4 space-y-3 text-sm">{Object.entries(snapshot.runtimeLanes).map(([name, count]) => <div key={name} className="flex justify-between gap-4"><dt>{name.replaceAll("_", " ")}</dt><dd className="font-black">{count.toLocaleString()}</dd></div>)}</dl>
              </article>
            </section>

            <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Modules / nuclei</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400"><tr><th className="p-3">Module</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Classified</th><th className="p-3 text-right">Hold</th><th className="p-3 text-right">Recursive</th></tr></thead>
                  <tbody>{snapshot.modules.map((row) => <tr key={row.module} className="border-t border-white/10"><td className="p-3 font-bold">{row.module}</td><td className="p-3 text-right">{row.total.toLocaleString()}</td><td className="p-3 text-right">{row.classifiedCandidates.toLocaleString()}</td><td className="p-3 text-right">{row.governedHold.toLocaleString()}</td><td className="p-3 text-right">{row.recursiveQuarantine.toLocaleString()}</td></tr>)}</tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-slate-300">
              <p className="font-black text-white">Founder authority boundary</p>
              <p className="mt-1">This page exposes full recovery-control visibility to the authenticated founder. Execution remains fenced and audited: administrative control does not require disabling provenance, idempotency, lease/fencing or secret-protection boundaries.</p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
