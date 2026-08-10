import Link from "next/link";

export type SurfaceCard = {
  title: string;
  body: string;
  status?: string;
  href?: string;
};

export type Surface = {
  kicker: string;
  title: string;
  lead: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  cards: SurfaceCard[];
  notes?: string[];
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/messages", label: "Messages" },
  { href: "/market", label: "Market" },
  { href: "/media", label: "Media" },
  { href: "/radio", label: "Radio" },
  { href: "/pricing", label: "Plans" },
  { href: "/legal", label: "Safety & Privacy" },
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06111f]/92 backdrop-blur" data-pantavion-static-ui="true">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-10">
        <Link href="/" className="font-black tracking-tight text-white" data-pantavion-no-translate>
          Pantavion One
        </Link>
        <div className="flex max-w-full gap-2 overflow-x-auto">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-[#e8b94f]/60 hover:text-[#f4d37a]">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export function SurfacePage({ surface }: { surface: Surface }) {
  return (
    <main className="min-h-screen bg-[#06111f] text-white" data-pantavion-static-ui="true">
      <TopNav />
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <div className="rounded-[2rem] border border-[#e8b94f]/25 bg-black/35 p-7 shadow-2xl shadow-cyan-950/30 md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e8b94f]">{surface.kicker}</p>
          <h1 className="mt-5 max-w-6xl text-4xl font-black leading-[1.04] sm:text-5xl md:text-7xl">{surface.title}</h1>
          <p className="mt-6 max-w-5xl text-lg leading-8 text-slate-200 md:text-xl">{surface.lead}</p>

          <div className="mt-10 flex flex-wrap gap-3">
            {surface.primaryHref && surface.primaryLabel ? (
              <Link href={surface.primaryHref} className="rounded-full bg-[#e8b94f] px-5 py-3 font-black text-black">{surface.primaryLabel}</Link>
            ) : null}
            {surface.secondaryHref && surface.secondaryLabel ? (
              <Link href={surface.secondaryHref} className="rounded-full border border-cyan-400/50 px-5 py-3 font-black text-cyan-100">{surface.secondaryLabel}</Link>
            ) : null}
          </div>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {surface.cards.map((card) => (
            <article key={card.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20">
              <h2 className="text-2xl font-black">{card.title}</h2>
              <p className="mt-4 leading-7 text-slate-300">{card.body}</p>
              {card.href ? (
                <Link href={card.href} className="mt-6 inline-flex rounded-full border border-[#e8b94f]/50 px-4 py-2 text-sm font-black text-[#f4d37a]">Open</Link>
              ) : null}
            </article>
          ))}
        </section>

        {surface.notes && surface.notes.length > 0 ? (
          <section className="mt-10 rounded-[2rem] border border-[#e8b94f]/20 bg-black/25 p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e8b94f]">Important information</p>
            <ul className="mt-6 grid gap-3">
              {surface.notes.map((note) => (
                <li key={note} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-slate-200">{note}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </main>
  );
}

export function HomeSurface({ pillars, revenue }: { pillars: SurfaceCard[]; revenue: SurfaceCard[] }) {
  return (
    <main className="min-h-screen bg-[#06111f] text-white" data-pantavion-static-ui="true">
      <TopNav />
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <div className="rounded-[2.4rem] border border-[#e8b94f]/25 bg-black/40 p-7 shadow-2xl shadow-cyan-950/30 md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e8b94f]" data-pantavion-no-translate>Pantavion One</p>
          <h1 className="mt-5 max-w-6xl text-4xl font-black leading-[1.02] sm:text-5xl md:text-7xl">One place for communication, people, work, media, services and global language access.</h1>
          <p className="mt-6 max-w-5xl text-lg leading-8 text-slate-200 md:text-xl">Choose what you need. Pantavion keeps the complexity behind the scenes and gives each person a clear way into the services that are available to them.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/messages" className="rounded-full bg-[#e8b94f] px-5 py-3 font-black text-black">Messages</Link>
            <Link href="/market" className="rounded-full border border-cyan-400/50 px-5 py-3 font-black text-cyan-100">Market</Link>
            <Link href="/translate" className="rounded-full border border-white/20 px-5 py-3 font-black text-white">Translation</Link>
          </div>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar) => pillar.href ? (
            <Link key={pillar.title} href={pillar.href} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 transition hover:border-[#e8b94f]/50">
              <h2 className="text-2xl font-black">{pillar.title}</h2>
              <p className="mt-4 leading-7 text-slate-300">{pillar.body}</p>
            </Link>
          ) : (
            <article key={pillar.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20">
              <h2 className="text-2xl font-black">{pillar.title}</h2>
              <p className="mt-4 leading-7 text-slate-300">{pillar.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <h2 className="text-3xl font-black md:text-5xl">Business options stay separate from private communication.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {revenue.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h3 className="text-xl font-black">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-300">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
