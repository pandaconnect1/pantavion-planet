// app/intelligence/page.tsx

import {
  getPantaAIVisibleSurfaceCards,
  getPantaAIVisibleSurfaceSummary
} from "../../core/public-surface/panta-ai-visible-surface";

const accessLabel: Record<string, string> = {
  public: "Public",
  "signed-in": "Signed-in",
  restricted: "Restricted",
  "admin-only": "Admin-only"
};

const truthLabel: Record<string, string> = {
  deterministic: "Deterministic",
  verified: "Verified",
  assisted: "AI-assisted",
  creative: "Creative",
  restricted: "Restricted"
};

export default function IntelligencePage() {
  const summary = getPantaAIVisibleSurfaceSummary();
  const cards = getPantaAIVisibleSurfaceCards();

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
        <header className="rounded-[2rem] border border-[#d4af37]/35 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_34%),linear-gradient(135deg,#061528,#020617_68%)] p-6 shadow-[0_0_60px_rgba(212,175,55,0.12)] md:p-8">
          <div className="mb-4 inline-flex rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-[#f5d56a]">
            Pantavion Prime Kernel Surface
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                {summary.title}
              </h1>

              <p className="mt-4 max-w-4xl text-base leading-8 text-slate-200 md:text-lg">
                {summary.subtitle}
              </p>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">
                {summary.mission}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#f5d56a]">
                Surface Status
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Metric label="Cards" value={summary.cardCount} />
                <Metric label="Public" value={summary.publicCount} />
                <Metric label="Signed-in" value={summary.signedInCount} />
                <Metric label="Restricted" value={summary.restrictedCount} />
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {summary.doctrine.map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-slate-200"
            >
              {item}
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/[0.04] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Όλα μαζεμένα σε μία οργανωμένη επιφάνεια
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-300">
                Το Pantavion μπορεί να απορροφά νόμιμα ιδέες, πρότυπα εργασίας και capability families από όλο το παγκόσμιο AI οικοσύστημα,
                αλλά να τα προσφέρει με δικό του τρόπο: καθαρά, ασφαλή, ενιαία, χωρίς tool chaos και χωρίς να αντιγράφει ξένες πλατφόρμες.
              </p>
            </div>

            <a
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-[#d4af37]/50 bg-[#d4af37] px-5 py-3 text-sm font-bold text-[#061528] transition hover:bg-[#f5d56a]"
            >
              Επιστροφή στην αρχική
            </a>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {summary.capabilityFamilies.slice(0, 24).map((family) => (
              <span
                key={family}
                className="rounded-full border border-sky-200/15 bg-sky-200/10 px-3 py-1 text-xs text-sky-100"
              >
                {family}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          {cards.map((card, index) => (
            <article
              key={card.key}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#071426] shadow-[0_0_40px_rgba(15,23,42,0.35)]"
            >
              <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 md:p-6 lg:border-b-0 lg:border-r">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 text-xs font-bold text-[#f5d56a]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                      {accessLabel[card.accessMode]}
                    </span>
                    <span className="rounded-full border border-sky-200/15 bg-sky-200/10 px-3 py-1 text-xs text-sky-100">
                      {truthLabel[card.truthMode]}
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl font-black tracking-tight md:text-3xl">
                    {card.title}
                  </h2>

                  <p className="mt-2 text-sm font-semibold text-[#f5d56a]">
                    {card.subtitle}
                  </p>

                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    {card.publicExplanation}
                  </p>

                  <div className="mt-5 rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-[#f5d56a]">
                      Prime Kernel Role
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-200">
                      {card.kernelRole}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 p-5 md:p-6">
                  <InfoBlock title="Τι κάνει" items={card.whatItDoes} />
                  <InfoBlock title="Πότε το χρησιμοποιώ" items={card.whenToUseIt} />

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-300">
                      Παραδείγματα εργασιών
                    </h3>

                    <div className="grid gap-3">
                      {card.workActions.map((action) => (
                        <div
                          key={action.title}
                          className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4"
                        >
                          <div className="font-bold text-white">{action.title}</div>
                          <div className="mt-2 text-sm leading-6 text-sky-100">
                            Χρήστης: {action.userCanAsk}
                          </div>
                          <div className="mt-2 text-sm leading-6 text-slate-300">
                            {action.explanation}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-[#f5d56a]">
                            Αποτέλεσμα: {action.expectedResult}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <InfoBlock title="Internal capability families" items={card.internalCapabilityFamilies} />
                    <InfoBlock title="Safety boundaries" items={card.safetyBoundaries} />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <InfoBlock title="Reference signals" items={card.referenceSignals} />
                    <InfoBlock title="Expected result" items={card.expectedResult} />
                  </div>
                </div>
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

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-300">
        {title}
      </h3>

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
