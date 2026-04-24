// app/intelligence/routing/page.tsx

import {
  getPantaAIRoutingSnapshot,
  resolvePantaAIRoute,
} from "../../../core/intelligence/panta-ai-capability-router";

const demoIntents = [
  "I want to build an app",
  "Research AI competitors",
  "Write a business presentation",
  "Translate this with voice",
  "Analyze my data",
  "Improve account security",
];

export default function PantaAIRoutingPage() {
  const snapshot = getPantaAIRoutingSnapshot();

  const demos = demoIntents.map((query) => ({
    query,
    result: resolvePantaAIRoute({
      query,
      userAccess: "signed-in",
      source: "intelligence",
    }),
  }));

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
        <header className="rounded-[2rem] border border-[#d4af37]/35 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_34%),linear-gradient(135deg,#061528,#020617_68%)] p-6 md:p-8">
          <div className="mb-4 inline-flex rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-[#f5d56a]">
            Prime Kernel Routing Link
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            PantaAI Routing Spine
          </h1>

          <p className="mt-4 max-w-5xl text-base leading-8 text-slate-200 md:text-lg">
            This page verifies the bridge from public PantaAI cards into governed internal capability routing:
            intent, capability family, execution mode, access policy, safety boundary and kernel route.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <Metric label="Cards" value={snapshot.cardCount} />
          <Metric label="Public" value={snapshot.publicRouteCount} />
          <Metric label="Signed-in" value={snapshot.signedInRouteCount} />
          <Metric label="Restricted" value={snapshot.restrictedRouteCount} />
          <Metric label="Admin-only" value={snapshot.adminOnlyRouteCount} />
        </section>

        <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/[0.04] p-5 md:p-6">
          <h2 className="text-2xl font-bold">Execution modes</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {snapshot.executionModes.map((mode) => (
              <span
                key={mode}
                className="rounded-full border border-sky-200/15 bg-sky-200/10 px-3 py-1 text-xs text-sky-100"
              >
                {mode}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <h2 className="text-2xl font-bold">Demo intent routing</h2>

          {demos.map(({ query, result }) => (
            <article
              key={query}
              className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#f5d56a]">
                User intent
              </div>

              <h3 className="mt-2 text-xl font-black">{query}</h3>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Info label="Disposition" value={result.disposition} />
                <Info
                  label="Selected surface"
                  value={result.selected?.title ?? "Unresolved"}
                />
                <Info
                  label="Kernel route"
                  value={result.selected?.kernelRoute ?? "None"}
                />
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                {result.reason}
              </p>

              {result.selected ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <Block
                    title="Orchestration path"
                    items={result.selected.orchestrationPath}
                  />
                  <Block
                    title="Required action"
                    items={result.requiredAction}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section className="grid gap-5">
          <h2 className="text-2xl font-bold">Full routing map</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {snapshot.routes.map((route) => (
              <article
                key={route.cardKey}
                className="rounded-3xl border border-white/10 bg-[#071426] p-5"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 text-xs text-[#f5d56a]">
                    {route.executionMode}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                    {route.accessMode}
                  </span>
                  <span className="rounded-full border border-sky-200/15 bg-sky-200/10 px-3 py-1 text-xs text-sky-100">
                    {route.truthMode}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-black">{route.title}</h3>

                <div className="mt-3 text-sm leading-7 text-slate-300">
                  <strong className="text-slate-100">Kernel route:</strong>{" "}
                  {route.kernelRoute}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {route.internalCapabilityFamilies.slice(0, 8).map((family) => (
                    <span
                      key={family}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200"
                    >
                      {family}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617]/50 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617]/50 p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-300">
        {title}
      </h4>

      <ul className="space-y-2 text-sm leading-6 text-slate-200">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4af37]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
