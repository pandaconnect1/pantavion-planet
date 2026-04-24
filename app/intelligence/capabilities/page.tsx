// app/intelligence/capabilities/page.tsx

import {
  getPantaAIActionSummary,
  getPantaAIActionSurfaces,
} from "../../../core/intelligence/panta-ai-action-engine";

export default function PantaAICapabilitiesPage() {
  const summary = getPantaAIActionSummary();
  const surfaces = getPantaAIActionSurfaces();

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
        <header className="rounded-[2rem] border border-[#d4af37]/35 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.2),transparent_35%),linear-gradient(135deg,#061528,#020617_72%)] p-6 md:p-8">
          <div className="mb-4 inline-flex rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#f5d56a]">
            PantaAI Real Action Layer
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            One AI button. Infinite governed work.
          </h1>

          <p className="mt-4 max-w-5xl text-base leading-8 text-slate-200 md:text-lg">
            This is not a static tool directory. Each capability is now connected
            to a real Pantavion action engine that can classify the user goal,
            select the capability family, create a kernel action packet, apply
            safety boundaries and return an execution route.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/intelligence"
              className="rounded-full bg-[#d4af37] px-5 py-3 text-sm font-black text-[#020617]"
            >
              Open PantaAI Center
            </a>
            <a
              href="/api/intelligence/actions"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white"
            >
              View action API
            </a>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <Metric label="Capabilities" value={summary.visibleCapabilityCount} />
          <Metric label="Public ready" value={summary.publicReadyCount} />
          <Metric label="Restricted" value={summary.restrictedCount} />
          <Metric label="Admin-only" value={summary.adminOnlyCount} />
          <Metric label="Kernel lanes" value={summary.kernelLanes.length} />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
          <h2 className="text-2xl font-black">Implementation contract</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              "The user sees work families, not scattered tools.",
              "Pantavion uses lawful references and legal integrations only.",
              "The Prime Kernel owns routing, truth, safety and access.",
              "Each capability has detail route, API route and action packet.",
              "Restricted/cyber/security work never becomes casual misuse.",
              "The same PantaAI button can expand forever without UI chaos.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/[0.05] p-4 text-sm leading-6 text-slate-200"
              >
                <span className="mr-2 text-[#d4af37]">◆</span>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {surfaces.map((surface) => (
            <article
              key={surface.key}
              className="rounded-[2rem] border border-white/10 bg-[#071426] p-5 shadow-xl shadow-black/20"
            >
              <div className="flex flex-wrap gap-2">
                <Badge>{surface.kernelLane}</Badge>
                <Badge>{surface.actionMode}</Badge>
                <Badge>{surface.accessMode}</Badge>
                <Badge>{surface.truthMode}</Badge>
              </div>

              <h3 className="mt-4 text-2xl font-black">{surface.title}</h3>
              <p className="mt-2 text-sm font-semibold text-[#f5d56a]">
                {surface.subtitle}
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                {surface.explanation}
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InfoBlock title="User can ask" items={surface.examples.slice(0, 4)} />
                <InfoBlock title="Pantavion does" items={surface.whatItDoes.slice(0, 4)} />
              </div>

              <div className="mt-4 rounded-2xl border border-sky-300/15 bg-sky-300/[0.04] p-4">
                <h4 className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-sky-200">
                  Internal capability families
                </h4>
                <div className="flex flex-wrap gap-2">
                  {surface.internalCapabilityFamilies.slice(0, 8).map((family) => (
                    <span
                      key={`${surface.key}-${family}`}
                      className="rounded-full border border-sky-200/15 bg-sky-200/10 px-3 py-1 text-xs text-sky-100"
                    >
                      {family}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={surface.detailRoute}
                  className="rounded-full bg-[#d4af37] px-4 py-2 text-sm font-black text-[#020617]"
                >
                  View details
                </a>
                <a
                  href={surface.defaultRoute}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white"
                >
                  Start via Kernel
                </a>
                <a
                  href={surface.actionApiRoute}
                  className="rounded-full border border-sky-200/20 bg-sky-200/10 px-4 py-2 text-sm font-bold text-sky-100"
                >
                  API packet
                </a>
              </div>
            </article>
          ))}
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

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-xs text-[#f5d56a]">
      {children}
    </span>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <h4 className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-slate-300">
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
