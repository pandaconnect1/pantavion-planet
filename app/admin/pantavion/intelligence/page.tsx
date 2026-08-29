import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  isPantavionKernelAccessAllowed,
  isPantavionKernelFounderIdentityAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
  PANTAVION_KERNEL_FOUNDER_QUERY,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";
import {
  getPantavionBuildQueue,
  getPantavionOpportunities,
} from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";
import {
  getPantavionCloudCronStatus,
  readLocalLedgerEvents,
} from "@/core/intelligence/pantavion-intelligence-ledger";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams?: Promise<SearchParams>;
}

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function badge(status: string) {
  if (status.includes("ready") || status === "recorded") return "border-emerald-300/40 bg-emerald-300/10 text-emerald-100";
  if (status.includes("blocked") || status.includes("failed")) return "border-rose-300/40 bg-rose-300/10 text-rose-100";
  if (status.includes("approval") || status.includes("research") || status.includes("design")) return "border-amber-300/40 bg-amber-300/10 text-amber-100";
  return "border-slate-300/30 bg-slate-300/10 text-slate-100";
}

export default async function FounderIntelligencePage({ searchParams }: PageProps) {
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

  const opportunities = getPantavionOpportunities();
  const buildQueue = getPantavionBuildQueue();
  const ledger = await readLocalLedgerEvents(25);
  const cron = getPantavionCloudCronStatus();

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-cyan-300/20 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Founder only</p>
              <h1 className="mt-2 text-3xl font-black">Pantavion Strategic Intelligence</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Live founder view of intelligence opportunities, build candidates, scheduler truth and durable-ledger warnings.
                Knowledge intake is not the same as production implementation; implementation remains gated by audit, approval, tests and verified deployment.
              </p>
            </div>
            <a href="/kernel" className="rounded-2xl border border-slate-300/30 px-4 py-2 text-sm font-bold text-slate-100">Back to Kernel</a>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-wider text-slate-400">Opportunities</p><p className="mt-2 text-3xl font-black">{opportunities.length}</p></article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-wider text-slate-400">Build queue</p><p className="mt-2 text-3xl font-black">{buildQueue.length}</p></article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-wider text-slate-400">Recent ledger</p><p className="mt-2 text-3xl font-black">{ledger.length}</p></article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-wider text-slate-400">Cron</p><p className="mt-2 text-lg font-black">{cron.hasCronSecret ? "configured" : "missing secret"}</p></article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Signal → Pantavion move</p><h2 className="mt-2 text-2xl font-black">Opportunity Radar</h2></div>
            <span className="text-xs text-slate-400">Provider-neutral · lawful sources · no competitor copying</span>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {opportunities.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap gap-2"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${badge(item.buildStatus)}`}>{item.buildStatus}</span><span className="rounded-full border border-cyan-300/20 bg-cyan-300/5 px-2.5 py-1 text-[11px] text-cyan-100">{item.sourceSignal}</span></div>
                <h3 className="mt-3 text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.whyItMatters}</p>
                <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-3"><p className="text-[11px] font-black uppercase tracking-wider text-emerald-200">What Pantavion absorbs</p><p className="mt-1 text-sm text-slate-200">{item.pantavionOwnedMove}</p></div>
                <p className="mt-3 text-xs leading-5 text-slate-400">Boundary: {item.legalBoundary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Implementation control</p>
          <h2 className="mt-2 text-2xl font-black">Build Queue</h2>
          <div className="mt-5 space-y-3">
            {buildQueue.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{item.title}</h3><p className="mt-1 text-xs text-slate-400">{item.targetModule} · {item.routeTargets.join(" · ")}</p></div><span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${badge(item.status)}`}>{item.status}</span></div>
                <p className="mt-3 text-xs text-slate-400">Brains: {item.requiredBrains.join(", ")} · Audit: {item.auditRequired ? "required" : "no"} · Founder approval: {item.founderApprovalRequired ? "required" : "no"}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">24/365 truth</p>
            <h2 className="mt-2 text-xl font-black">Scheduler & storage</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex justify-between gap-4"><dt>Cron schedule</dt><dd className="font-bold text-white">{cron.cronSchedule}</dd></div>
              <div className="flex justify-between gap-4"><dt>CRON_SECRET</dt><dd className="font-bold text-white">{cron.hasCronSecret ? "configured" : "not configured"}</dd></div>
              <div className="flex justify-between gap-4"><dt>Durable endpoint</dt><dd className="font-bold text-white">{cron.hasExternalLedgerEndpoint ? "configured" : "not configured"}</dd></div>
              <div className="flex justify-between gap-4"><dt>Ledger token</dt><dd className="font-bold text-white">{cron.hasExternalLedgerToken ? "configured" : "not configured"}</dd></div>
            </dl>
            <p className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-slate-400">{cron.storageTruth}</p>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Evidence ledger</p>
            <h2 className="mt-2 text-xl font-black">Recent intelligence ticks</h2>
            <div className="mt-4 max-h-[420px] space-y-3 overflow-auto">
              {ledger.length === 0 ? <p className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">No ledger events are visible in this runtime. This does not prove that scheduled execution is working.</p> : ledger.map((event) => (
                <div key={event.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap justify-between gap-2"><span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${badge(event.status)}`}>{event.status}</span><time className="text-xs text-slate-500">{event.createdAt}</time></div>
                  <p className="mt-2 text-sm text-slate-200">{event.summary}</p>
                  <p className="mt-2 text-xs text-slate-400">Storage: {event.storageMode} · opportunities {event.opportunityCount} · builds {event.buildQueueCount}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
