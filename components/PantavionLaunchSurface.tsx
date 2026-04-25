import Link from "next/link";

export type LaunchCard = {
  title: string;
  body: string;
  href?: string;
  status?: string;
};

export type LaunchSectionProps = {
  kicker: string;
  title: string;
  lead: string;
  cards: LaunchCard[];
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function PantavionLaunchSurface({
  kicker,
  title,
  lead,
  cards,
  primaryHref = "/pricing",
  primaryLabel = "View Pricing",
  secondaryHref = "/",
  secondaryLabel = "Back Home",
}: LaunchSectionProps) {
  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="rounded-[2rem] border border-[#e8b94f]/25 bg-black/35 p-7 shadow-2xl shadow-cyan-950/30 md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e8b94f]">
            {kicker}
          </p>

          <h1 className="mt-5 max-w-6xl text-5xl font-black leading-none md:text-7xl">
            {title}
          </h1>

          <p className="mt-6 max-w-5xl text-lg leading-8 text-slate-200 md:text-xl">
            {lead}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-[#e8b94f] px-5 py-3 font-black text-black"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="rounded-full border border-cyan-400/50 px-5 py-3 font-black text-cyan-100"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20"
            >
              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                {card.status ?? "Foundation"}
              </span>
              <h2 className="mt-5 text-2xl font-black">{card.title}</h2>
              <p className="mt-4 leading-7 text-slate-300">{card.body}</p>
              {card.href ? (
                <Link
                  href={card.href}
                  className="mt-6 inline-flex rounded-full border border-[#e8b94f]/50 px-4 py-2 text-sm font-black text-[#f4d37a]"
                >
                  Open
                </Link>
              ) : null}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

export function SimpleLegalPage({
  title,
  lead,
  sections,
}: {
  title: string;
  lead: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <section className="mx-auto max-w-5xl px-6 py-16 md:px-10">
        <Link href="/" className="text-sm font-bold text-[#f4d37a]">
          ← Pantavion Home
        </Link>

        <p className="mt-10 text-xs font-black uppercase tracking-[0.35em] text-[#e8b94f]">
          Pantavion Trust Layer
        </p>

        <h1 className="mt-5 text-5xl font-black leading-none md:text-7xl">
          {title}
        </h1>

        <p className="mt-6 text-lg leading-8 text-slate-200">{lead}</p>

        <div className="mt-10 grid gap-5">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6"
            >
              <h2 className="text-2xl font-black">{section.title}</h2>
              <p className="mt-4 leading-8 text-slate-300">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
