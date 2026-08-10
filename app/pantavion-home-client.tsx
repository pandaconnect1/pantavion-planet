"use client";

import Link from "next/link";

type EcosystemItem = {
  title: string;
  subtitle: string;
  icon: string;
  href?: string;
  items: string[];
};

const ecosystem: EcosystemItem[] = [
  { title: "People & Social", subtitle: "People, relationships and communities", icon: "◎", items: ["People", "Contacts", "Connections", "Communities", "Nearby", "Dating", "Private circles"] },
  { title: "Communication", subtitle: "Talk and understand across languages", icon: "↔", href: "/messages", items: ["Messages", "Voice", "Video", "Interpreter", "Translation", "Subtitles"] },
  { title: "Work & Services", subtitle: "Practical help for people and businesses", icon: "＋", href: "/build-services", items: ["Work", "Services", "Business", "Professional help", "Digital services"] },
  { title: "Market & Listings", subtitle: "Buy, sell, offer, request and discover", icon: "◇", href: "/listings", items: ["Classifieds", "Jobs", "Services", "Property", "Events", "Marketplace"] },
  { title: "News, Sports & Media", subtitle: "Information, audio, video and public media", icon: "◫", href: "/media", items: ["News", "Sports", "Radio", "Podcasts", "Channels", "Events"] },
  { title: "Knowledge & Learning", subtitle: "Learning, libraries, culture and languages", icon: "◇", items: ["Learning", "Libraries", "Courses", "Culture", "Research", "Languages"] },
  { title: "Maps, Travel & Local Life", subtitle: "Places, travel and everyday local discovery", icon: "⌖", items: ["Maps", "Travel", "Places", "Local services", "City information"] },
  { title: "Safety & SOS", subtitle: "Safety, crisis information and trusted alerts", icon: "◉", href: "/sos", items: ["SOS", "Crisis", "Alerts", "Offline support", "Trusted contacts"] },
  { title: "Business", subtitle: "Presence, services, listings and promotion", icon: "€", href: "/market", items: ["Business pages", "Listings", "Services", "Promotion", "Payments"] },
  { title: "Professional Areas", subtitle: "Protected tools for approved professional users", icon: "⌁", href: "/professional/infrastructure/water", items: ["Water", "Field tools", "Access", "Infrastructure"] },
  { title: "Local Human Life", subtitle: "Services adapted to country, language and way of life", icon: "🌐", items: ["Family", "Home", "Food", "Mobility", "Culture", "Local services"] },
];

export default function PantavionHomeClient() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,#d9eaff_0,#edf5ff_32%,#f7fbff_67%,#ffffff_100%)] text-slate-950" data-pantavion-static-ui="true">
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-4 sm:px-8 sm:pt-6 lg:px-12">
        <nav className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl">
          <Link href="/" className="text-sm font-black tracking-[0.2em] text-[#153c6b] no-underline sm:text-base" data-pantavion-no-translate>PANTAVION</Link>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 sm:gap-2 sm:text-sm">
            <Link href="/ecosystem" className="rounded-full px-3 py-2 text-inherit no-underline transition hover:bg-blue-50 hover:text-blue-700">Explore</Link>
            <Link href="/messages" className="rounded-full px-3 py-2 text-inherit no-underline transition hover:bg-blue-50 hover:text-blue-700">Messages</Link>
            <Link href="/translate" className="rounded-full px-3 py-2 text-inherit no-underline transition hover:bg-cyan-50 hover:text-cyan-700">Translation</Link>
          </div>
        </nav>

        <header className="pb-8 pt-11 sm:pb-12 sm:pt-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#2865a8] shadow-sm sm:text-xs" data-pantavion-no-translate>
            <span className="h-2 w-2 rounded-full bg-cyan-500" /> PANTAVION ONE
          </div>
          <h1 className="mt-4 max-w-4xl text-[2.55rem] font-black leading-[0.98] tracking-[-0.045em] text-[#11345d] sm:text-6xl lg:text-7xl">
            Here We Are One.<span className="mt-1 block text-[#4e77a6]">For All Humanity.</span>
          </h1>
          <p className="mt-5 max-w-3xl text-[15px] leading-6 text-slate-600 sm:text-lg sm:leading-8">
            One global human ecosystem for communication, people, work, knowledge, safety, services and professional tools.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/ecosystem" className="rounded-full bg-[#1e5f9f] px-5 py-2.5 text-sm font-black text-white no-underline shadow-sm">Explore Pantavion</Link>
            <Link href="/messages" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 no-underline">Messages</Link>
            <Link href="/translate" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 no-underline">Translation</Link>
          </div>
        </header>

        <section>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#3474b8] sm:text-xs">Explore</p>
            <h2 className="mt-1 text-xl font-black text-[#173f72] sm:text-2xl">Pantavion worlds</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Choose an area that is available now. Areas still being completed are shown as information, not as fake buttons.</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ecosystem.map((section) => {
              const card = (
                <article className="h-full rounded-[1.4rem] border border-slate-200/80 bg-white/85 p-4 shadow-[0_12px_34px_rgba(34,71,112,0.07)] transition sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 sm:text-xl">{section.title}</h3>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">{section.subtitle}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-lg text-[#1d5c9c] shadow-sm">{section.icon}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {section.items.map((item) => <span key={item} className="rounded-full border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[10px] font-bold text-slate-600 sm:text-xs">{item}</span>)}
                  </div>
                  <p className="mt-4 text-xs font-black text-[#2d6ca9] sm:text-sm">{section.href ? "Open" : "In development"}{section.href ? " →" : ""}</p>
                </article>
              );
              return section.href ? <Link key={section.title} href={section.href} className="no-underline">{card}</Link> : <div key={section.title}>{card}</div>;
            })}
          </div>
        </section>

        <section className="mt-9 rounded-[1.5rem] border border-blue-100 bg-[#123b67] p-5 text-white shadow-xl shadow-blue-950/10 sm:p-7">
          <h2 className="text-2xl font-black sm:text-3xl">Simple outside. Powerful behind the scenes.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">People should not need to understand the technology underneath Pantavion. The system coordinates identity, safety, language, permissions and services in the background while the public experience stays clear.</p>
        </section>

        <section className="mt-8 rounded-[1.35rem] border border-slate-200 bg-white/85 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#3474b8]">Professional access</p>
              <h2 className="mt-1 text-lg font-black text-[#173f72]">Water network</h2>
              <p className="mt-1 text-sm text-slate-500">Protected professional environment for approved users.</p>
            </div>
            <Link href="/professional/infrastructure/water" className="rounded-full bg-[#2467aa] px-4 py-2 text-xs font-black text-white no-underline">Open water tools</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
