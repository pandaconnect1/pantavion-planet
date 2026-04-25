import Link from "next/link";

const pillars = [
  { title: "AI Execution", href: "/intelligence/routing", body: "Intent, planning, routing, capability matching and governed execution." },
  { title: "Messages & Connect", href: "/messages", body: "Native communication, groups, secure channels, contacts and future live translation." },
  { title: "Market & Ads", href: "/market", body: "Professional listings, services, sponsored placements and business discovery without intrusive ads." },
  { title: "Creator Studio", href: "/studio", body: "Video, cartoon, voice, music, dubbing, radio messages and multilingual media creation." },
  { title: "Build Services", href: "/build-services", body: "Websites, apps, automations, AI assistants, dashboards and professional digital systems." },
  { title: "Kernel Control", href: "/kernel/run", body: "The sovereign internal brain for routing, monitoring, resilience and future self-repair." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="rounded-[2.4rem] border border-[#e8b94f]/25 bg-black/40 p-7 shadow-2xl shadow-cyan-950/30 md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e8b94f]">
            Pantavion One
          </p>

          <h1 className="mt-5 max-w-6xl text-5xl font-black leading-none md:text-7xl">
            One living platform for AI, communication, social connection, work,
            media, services and global language access.
          </h1>

          <p className="mt-6 max-w-5xl text-lg leading-8 text-slate-200 md:text-xl">
            Pantavion helps people, creators, families, professionals,
            communities and businesses organize intelligence, messages, media,
            work, services, relationships and execution inside one governed
            global ecosystem.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/pricing" className="rounded-full bg-[#e8b94f] px-5 py-3 font-black text-black">
              Start Founding Trial
            </Link>
            <Link href="/messages" className="rounded-full border border-cyan-400/50 px-5 py-3 font-black text-cyan-100">
              Open Messages
            </Link>
            <Link href="/market" className="rounded-full border border-white/20 px-5 py-3 font-black text-white">
              Open Market
            </Link>
            <Link href="/studio" className="rounded-full border border-white/20 px-5 py-3 font-black text-white">
              Creator Studio
            </Link>
          </div>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <Link
              key={pillar.title}
              href={pillar.href}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 transition hover:border-[#e8b94f]/50"
            >
              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                Live Route
              </span>
              <h2 className="mt-5 text-2xl font-black">{pillar.title}</h2>
              <p className="mt-4 leading-7 text-slate-300">{pillar.body}</p>
            </Link>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e8b94f]">
            Launch Position
          </p>
          <h2 className="mt-4 text-3xl font-black md:text-5xl">
            Public foundation is live. Advanced providers, payments and regulated systems release progressively.
          </h2>
          <p className="mt-5 max-w-5xl leading-8 text-slate-300">
            Pantavion does not promise user income, medical outcomes, financial
            results or instant completion. It provides access, tools, work
            surfaces, communication, media, marketplace, safety and governed AI
            execution foundations.
          </p>
        </section>
      </section>
    </main>
  );
}
