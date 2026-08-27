import { implementationSyncDoctrine } from "@/core/pantavion/implementation-sync-registry";

const currentItems = [
  {
    title: "Sovereign Technology Factory",
    state: "CODED",
    detail: "Provider-neutral replacement evaluation, sovereignty gates and lifecycle foundation are in PR #315.",
  },
  {
    title: "Intent-to-Outcome Fabric",
    state: "CODED",
    detail: "Goal-oriented planning and execution foundation is being integrated in the current branch.",
  },
  {
    title: "Ephemeral Agent Swarm",
    state: "CODED",
    detail: "Temporary bounded specialist agents are being integrated in the current branch.",
  },
  {
    title: "Automatic Implementation Sync",
    state: "CODED",
    detail: "Shared registry truth drives this owner-visible implementation surface.",
  },
  {
    title: "Production verification",
    state: "BLOCKED",
    detail: "Nothing is marked VERIFIED_LIVE until deployment and runtime evidence exist.",
  },
];

export default function OwnerImplementationPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
          Owner Control · Automatic Sync
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Pantavion Implementation Truth</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
          {implementationSyncDoctrine.rule}
        </p>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">Truth chain</div>
          <div className="mt-2 text-sm font-medium text-slate-100">
            IDEA → CODED → TESTED → MERGED → DEPLOYED → VERIFIED_LIVE
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Blocked work stays visible while independent work continues.
          </div>
        </div>

        <section className="mt-6 grid gap-3">
          {currentItems.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-medium text-slate-100">{item.title}</h2>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-cyan-300">
                  {item.state}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
            </article>
          ))}
        </section>

        <div className="mt-6 text-xs text-slate-500">
          This page is a coded synchronization surface foundation. Runtime GitHub, CI, Supabase and deployment adapters must provide evidence before states advance automatically.
        </div>
      </div>
    </main>
  );
}
