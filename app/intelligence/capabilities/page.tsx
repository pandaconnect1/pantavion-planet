// app/intelligence/capabilities/page.tsx

import {
  getPantaAICapabilityIndexSummary,
  getPantaAIPublicCapabilityFamilies,
} from "../../../core/intelligence/panta-ai-capability-index";

export default function PantaAICapabilitiesPage() {
  const summary = getPantaAICapabilityIndexSummary();
  const families = getPantaAIPublicCapabilityFamilies();

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
        <header className="rounded-[2rem] border border-[#d4af37]/35 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_34%),linear-gradient(135deg,#061528,#020617_68%)] p-6 md:p-8">
          <div className="mb-4 inline-flex rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#f5d56a]">
            PantaAI Capability Index
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Everything gathered, nothing scattered.
          </h1>

          <p className="mt-4 max-w-5xl text-base leading-8 text-slate-200 md:text-lg">
            Pantavion organizes AI assistants, research, coding, builders, design, media,
            notes, learning, automation, data, business, finance-aware guidance, voice and
            defensive security into governed capability families. External tools are treated
            as legal references or integration candidates, not copied products.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <Metric label="Families" value={summary.familyCount} />
          <Metric label="Visible" value={summary.publicVisibleCount} />
          <Metric label="Restricted" value={summary.restrictedCount} />
          <Metric label="Admin-only" value={summary.adminOnlyCount} />
          <Metric label="References" value={summary.referenceEcosystemCount} />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
          <h2 className="text-2xl font-black">Legal operating model</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              "Pantavion-native capability layer first.",
              "Official APIs, partner routes or user-approved workflows only.",
              "No cloning, no unauthorized scraping, no bypassing terms.",
              "Public simplicity; internal capability depth.",
              "Tool names are references, not dependency chains.",
              "Prime Kernel decides routing, access, truth and safety.",
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

        <section className="grid gap-5">
          <div>
            <h2 className="text-2xl font-black">Public capability families</h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-300">
              These are the visible or semi-visible user-facing families. Behind each one,
              the Prime Kernel can route to internal capabilities, safe providers, memory,
              evidence, creation, build, automation or review paths.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {families.map((family) => (
              <article
                key={family.key}
                className="rounded-[2rem] border border-white/10 bg-[#071426] p-5 shadow-xl shadow-black/20"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge>{family.area}</Badge>
                  <Badge>{family.truthMode}</Badge>
                  <Badge>{family.access}</Badge>
                </div>

                <h3 className="mt-4 text-2xl font-black">{family.publicName}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {family.publicExplanation}
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Block title="User can ask" items={family.userCanAsk.slice(0, 4)} />
                  <Block title="Pantavion does" items={family.pantavionDoes.slice(0, 4)} />
                </div>

                <div className="mt-4 rounded-2xl border border-sky-300/15 bg-sky-300/[0.04] p-4">
                  <h4 className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-sky-200">
                    Reference ecosystems
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {family.referenceEcosystems.slice(0, 7).map((reference) => (
                      <span
                        key={`${family.key}-${reference.name}`}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200"
                        title={reference.purposeInsidePantavion}
                      >
                        {reference.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
                  <h4 className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                    Boundaries
                  </h4>

                  <ul className="space-y-2 text-sm leading-6 text-slate-300">
                    {family.legalBoundaries.slice(0, 2).map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
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

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-xs text-[#f5d56a]">
      {children}
    </span>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
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
