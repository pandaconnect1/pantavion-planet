"use client";

import Link from "next/link";

const ecosystem = [
  { title: "People & Social", subtitle: "Ο ανθρώπινος κόσμος του Pantavion", href: "/discovery", icon: "◎", tone: "from-blue-50 to-indigo-50 border-blue-100 text-blue-700", items: ["People", "Connections", "Contacts", "Social", "Communities", "Meet People", "Dating", "Nearby", "Events", "My World"] },
  { title: "Communication", subtitle: "Επικοινωνία χωρίς σύνορα", href: "/translate", icon: "↔", tone: "from-cyan-50 to-sky-50 border-cyan-100 text-cyan-700", items: ["Chat", "Voice", "Video", "Interpreter", "Translation", "Secure"] },
  { title: "Business & Market", subtitle: "Εργασία, υπηρεσίες και οικονομία", href: "/advertise", icon: "＋", tone: "from-violet-50 to-fuchsia-50 border-violet-100 text-violet-700", items: ["Business", "Listings", "Marketplace", "Services", "Ads Center", "Work"] },
  { title: "Knowledge & Create", subtitle: "Μάθηση, γνώση και δημιουργία", href: "/newspaper", icon: "◇", tone: "from-amber-50 to-orange-50 border-amber-100 text-amber-700", items: ["PantaLearn", "News", "Library", "Mind", "PantaStudio", "Audio"] },
  { title: "Safety & World", subtitle: "Ασφάλεια, ταξίδι και παγκόσμια επίγνωση", href: "/discovery", icon: "◉", tone: "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700", items: ["SOS", "Compass", "Travel", "Crisis", "Trust", "Maps"] },
  { title: "Professional", subtitle: "Υποδομές και εξειδικευμένα εργαλεία", href: "/professional/infrastructure/water", icon: "⌁", tone: "from-slate-50 to-blue-50 border-slate-200 text-slate-700", items: ["Infrastructure", "Water", "Access", "Field Tools", "Institutional"] },
] as const;

export default function PantavionHomeClient() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,#dcecff_0,#edf5ff_32%,#f8fbff_68%,#ffffff_100%)] text-slate-950">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-8 sm:pt-6 lg:px-12">
        <nav className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl">
          <Link href="/" className="text-sm font-black tracking-[0.2em] text-[#173f72] no-underline sm:text-base">PANTAVION</Link>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 sm:gap-2 sm:text-sm"><Link href="/discovery" className="rounded-full px-3 py-2 text-inherit no-underline transition hover:bg-blue-50 hover:text-blue-700">Explore</Link><Link href="/translate" className="rounded-full px-3 py-2 text-inherit no-underline transition hover:bg-cyan-50 hover:text-cyan-700">Translate</Link></div>
        </nav>

        <header className="pb-8 pt-11 sm:pb-10 sm:pt-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#2865a8] shadow-sm sm:text-xs"><span className="h-2 w-2 rounded-full bg-cyan-500" /> PANTAVION ONE</div>
          <h1 className="mt-4 max-w-3xl text-[2.5rem] font-black leading-[0.98] tracking-[-0.045em] text-[#12365f] sm:text-6xl">Here We Are One.<span className="mt-1 block text-[#4f78a6]">For All Humanity.</span></h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-6 text-slate-600 sm:text-lg sm:leading-8">Ένα παγκόσμιο ανθρώπινο οικοσύστημα για σύνδεση, επικοινωνία, γνώση, εργασία και ασφάλεια.</p>
        </header>

        <section>
          <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#3474b8] sm:text-xs">ECOSYSTEM</p><h2 className="mt-1 text-xl font-black text-[#173f72] sm:text-2xl">Όλος ο κόσμος του Pantavion</h2></div><Link href="/discovery" className="hidden text-sm font-black text-[#3474b8] no-underline sm:block">Αναζήτηση →</Link></div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ecosystem.map((section) => (
              <Link key={section.title} href={section.href} className={`group rounded-[1.35rem] border bg-gradient-to-br ${section.tone} p-4 no-underline shadow-[0_10px_30px_rgba(40,76,120,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(40,76,120,0.11)] sm:p-5`}>
                <div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-black text-slate-900 sm:text-xl">{section.title}</h3><p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">{section.subtitle}</p></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-lg shadow-sm">{section.icon}</span></div>
                <div className="mt-4 flex flex-wrap gap-1.5">{section.items.map((item) => <span key={item} className="rounded-full border border-white/70 bg-white/65 px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm sm:text-xs">{item}</span>)}</div>
                <p className="mt-4 text-xs font-black sm:text-sm">Άνοιγμα ενότητας →</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[1.35rem] border border-blue-100 bg-white/75 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#3474b8]">QUICK ACCESS</p><h2 className="mt-1 text-lg font-black text-[#173f72]">Δίκτυο Ύδρευσης</h2><p className="mt-1 text-sm text-slate-500">Προστατευμένο επαγγελματικό περιβάλλον για εξουσιοδοτημένους χρήστες.</p></div><div className="flex flex-wrap gap-2"><Link href="/professional/infrastructure/water" className="rounded-full bg-[#2467aa] px-4 py-2 text-xs font-black text-white no-underline">Water Center</Link><Link href="/professional/infrastructure/water/access" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 no-underline">Access</Link><Link href="/professional/infrastructure/water/live" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 no-underline">Live Map</Link></div></div>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-400">Pantavion One · Here We Are One. For All Humanity.</footer>
      </section>
    </main>
  );
}
