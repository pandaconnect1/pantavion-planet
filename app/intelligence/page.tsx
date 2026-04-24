import {
  getPantaAIVisibleSurfaceCards,
  getPantaAIVisibleSurfaceSummary
} from "../../core/public-surface/panta-ai-visible-surface";

export const metadata = {
  title: "PantaAI Center | Pantavion",
  description:
    "The unified Pantavion AI capability center for research, creation, work, learning, automation and execution."
};

function AccessBadge({ accessMode }: { accessMode: string }) {
  const label =
    accessMode === "public"
      ? "Public"
      : accessMode === "signed-in"
        ? "Signed-in"
        : accessMode === "restricted"
          ? "Restricted"
          : "Admin-only";

  return (
    <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
      {label}
    </span>
  );
}

function SectionList({
  title,
  items
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-200/80">
        {title}
      </h4>
      <ul className="space-y-1 text-sm leading-6 text-slate-200/85">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function IntelligencePage() {
  const summary = getPantaAIVisibleSurfaceSummary();
  const cards = getPantaAIVisibleSurfaceCards();

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.2),_transparent_34%),linear-gradient(135deg,_#020617,_#0a1f44_52%,_#020617)] px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 inline-flex rounded-full border border-amber-300/25 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
            Pantavion Prime Intelligence
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
                {summary.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
                {summary.subtitle}
              </p>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                {summary.mission}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-3xl font-black text-amber-200">
                    {summary.cardCount}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                    Capability cards
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-3xl font-black text-sky-200">
                    {summary.publicCount}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                    Public entry points
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-3xl font-black text-emerald-200">
                    {summary.signedInCount}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                    Signed-in workflows
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-3xl font-black text-rose-200">
                    {summary.restrictedCount + summary.adminOnlyCount}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                    Governed paths
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-300/25 bg-black/30 p-6 shadow-2xl shadow-amber-950/30">
              <div className="rounded-[1.5rem] border border-white/10 bg-[#07111f]/90 p-6">
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-amber-300/30 bg-[radial-gradient(circle,_rgba(255,215,0,0.28),_rgba(14,165,233,0.18)_38%,_rgba(2,6,23,1)_72%)] shadow-[0_0_70px_rgba(212,175,55,0.2)]">
                  <div className="flex h-28 w-28 rotate-45 items-center justify-center border border-amber-200/70 bg-[#020617] shadow-[0_0_40px_rgba(212,175,55,0.35)]">
                    <div className="-rotate-45 text-center">
                      <div className="text-xs font-bold uppercase tracking-[0.32em] text-amber-200">
                        Panta
                      </div>
                      <div className="text-2xl font-black text-white">AI</div>
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-center text-sm leading-6 text-slate-300">
                  One center. Many capabilities. No scattered tool chaos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-16">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white md:text-3xl">
            What the user can do here
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Each card is a public Pantavion surface. Behind it, the Prime Kernel,
            Prime AI Orchestrator, policy gates, memory and capability registries
            decide the safe execution path.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.key}
              className="rounded-[1.5rem] border border-white/10 bg-[#07111f] p-6 shadow-xl shadow-black/25"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-amber-200">
                    {card.subtitle}
                  </p>
                </div>
                <AccessBadge accessMode={card.accessMode} />
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-300">
                {card.publicExplanation}
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <SectionList title="What it does" items={card.whatItDoes} />
                <SectionList title="When to use it" items={card.whenToUseIt} />
                <SectionList title="Example requests" items={card.exampleUserRequests} />
                <SectionList title="Expected result" items={card.expectedResult} />
              </div>

              <div className="mt-6 rounded-2xl border border-sky-300/15 bg-sky-300/5 p-4">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-sky-200">
                  Internal capability families
                </h4>
                <div className="flex flex-wrap gap-2">
                  {card.internalCapabilityFamilies.map((family) => (
                    <span
                      key={family}
                      className="rounded-full border border-sky-200/15 bg-sky-200/10 px-3 py-1 text-xs text-sky-100"
                    >
                      {family}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
                  Safety boundaries
                </h4>
                <ul className="space-y-1 text-sm leading-6 text-slate-200/85">
                  {card.safetyBoundaries.map((item) => (
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
    </main>
  );
}
