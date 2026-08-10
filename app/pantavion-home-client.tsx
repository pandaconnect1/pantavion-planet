"use client";

import Link from "next/link";

type Status = "LIVE" | "FOUNDATION" | "BUILDING" | "GATED";

type EcosystemItem = {
  title: string;
  subtitle: string;
  icon: string;
  href?: string;
  status: Status;
  revenue: "DIRECT" | "INDIRECT" | "PUBLIC" | "INSTITUTIONAL" | "FUTURE";
  items: string[];
};

const ecosystem: EcosystemItem[] = [
  { title: "People & Social", subtitle: "Άνθρωποι, σχέσεις και κοινότητες", icon: "◎", href: "/ecosystem#people", status: "BUILDING", revenue: "INDIRECT", items: ["People", "Contacts", "Connections", "Messages", "Communities", "Nearby", "Dating", "Elite"] },
  { title: "Communication", subtitle: "Επικοινωνία χωρίς σύνορα", icon: "↔", href: "/translate", status: "LIVE", revenue: "INDIRECT", items: ["Chat", "Voice", "Video", "Interpreter", "Translation", "Secure", "Subtitles"] },
  { title: "PantaAI & Agents", subtitle: "Κεντρική νοημοσύνη και εξειδικευμένοι πυρήνες", icon: "✦", href: "/ecosystem#ai", status: "FOUNDATION", revenue: "DIRECT", items: ["PantaAI", "Guardian", "Agents", "Research", "Builder", "Memory", "Workflows"] },
  { title: "Business, Market & Work", subtitle: "Έσοδα, εργασία, υπηρεσίες και εμπόριο", icon: "＋", href: "/ecosystem#business", status: "BUILDING", revenue: "DIRECT", items: ["Business", "Listings", "Classifieds", "Marketplace", "Jobs", "Services", "Ads Center", "Payments"] },
  { title: "News, Sports & Live", subtitle: "Ενημέρωση, αθλητισμός και ζωντανές ροές", icon: "◫", href: "/ecosystem#media", status: "FOUNDATION", revenue: "DIRECT", items: ["News", "Sports", "Radio", "Podcasts", "Channels", "Pulse", "Events"] },
  { title: "Knowledge & Learning", subtitle: "Γνώση, βιβλιοθήκες και εκπαίδευση", icon: "◇", href: "/ecosystem#knowledge", status: "FOUNDATION", revenue: "DIRECT", items: ["PantaLearn", "Libraries", "Courses", "Culture", "Research", "Mind", "Language"] },
  { title: "Media & Creation", subtitle: "Δημιουργία ήχου, εικόνας και περιεχομένου", icon: "◈", href: "/ecosystem#media", status: "FOUNDATION", revenue: "DIRECT", items: ["Studio", "Audio", "Video", "Creator", "Publishing", "Streaming"] },
  { title: "Maps, Travel & World", subtitle: "Τόπος, μετακίνηση και παγκόσμια επίγνωση", icon: "⌖", href: "/ecosystem#world", status: "FOUNDATION", revenue: "INDIRECT", items: ["Maps", "Compass", "Travel", "Places", "City", "Infrastructure", "Local"] },
  { title: "Safety & SOS", subtitle: "Ασφάλεια, κρίσεις και ανθεκτική επικοινωνία", icon: "◉", href: "/ecosystem#safety", status: "FOUNDATION", revenue: "PUBLIC", items: ["SOS", "Crisis", "Trust", "Offline", "Resilience", "Missing", "Alerts"] },
  { title: "Finance & Payments", subtitle: "Πληρωμές, billing και οικονομικές υπηρεσίες", icon: "€", href: "/ecosystem#finance", status: "BUILDING", revenue: "DIRECT", items: ["Stripe", "Subscriptions", "Billing", "Wallet", "Merchant", "Institutional", "Future Finance"] },
  { title: "Professional & Institutional", subtitle: "Εξειδικευμένα εργαλεία και οργανισμοί", icon: "⌁", href: "/professional/infrastructure/water", status: "LIVE", revenue: "INSTITUTIONAL", items: ["Water", "Field Tools", "Access", "City Intelligence", "Institutional", "Workflows"] },
  { title: "Local Human Life", subtitle: "Υπηρεσίες προσαρμοσμένες σε χώρα, γλώσσα και τρόπο ζωής", icon: "🌐", href: "/ecosystem#local", status: "FOUNDATION", revenue: "FUTURE", items: ["Family", "Health", "Home", "Food", "Mobility", "Government", "Culture", "Local Services"] },
];

const statusClasses: Record<Status, string> = {
  LIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FOUNDATION: "border-slate-200 bg-slate-50 text-slate-600",
  BUILDING: "border-amber-200 bg-amber-50 text-amber-700",
  GATED: "border-violet-200 bg-violet-50 text-violet-700",
};

export default function PantavionHomeClient() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,#d9eaff_0,#edf5ff_32%,#f7fbff_67%,#ffffff_100%)] text-slate-950">
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-4 sm:px-8 sm:pt-6 lg:px-12">
        <nav className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl">
          <Link href="/" className="text-sm font-black tracking-[0.2em] text-[#153c6b] no-underline sm:text-base">PANTAVION</Link>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 sm:gap-2 sm:text-sm">
            <Link href="/ecosystem" className="rounded-full px-3 py-2 text-inherit no-underline transition hover:bg-blue-50 hover:text-blue-700">Ecosystem</Link>
            <Link href="/translate" className="rounded-full px-3 py-2 text-inherit no-underline transition hover:bg-cyan-50 hover:text-cyan-700">Translate</Link>
          </div>
        </nav>

        <header className="pb-8 pt-11 sm:pb-12 sm:pt-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#2865a8] shadow-sm sm:text-xs"><span className="h-2 w-2 rounded-full bg-cyan-500" /> PANTAVION ONE</div>
          <h1 className="mt-4 max-w-4xl text-[2.55rem] font-black leading-[0.98] tracking-[-0.045em] text-[#11345d] sm:text-6xl lg:text-7xl">Here We Are One.<span className="mt-1 block text-[#4e77a6]">For All Humanity.</span></h1>
          <p className="mt-5 max-w-3xl text-[15px] leading-6 text-slate-600 sm:text-lg sm:leading-8">Ένα παγκόσμιο ανθρώπινο οικοσύστημα με κοινή ταυτότητα, AI orchestration, επικοινωνία, εργασία, γνώση, ασφάλεια, υπηρεσίες και επαγγελματικά εργαλεία.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/ecosystem" className="rounded-full bg-[#1e5f9f] px-5 py-2.5 text-sm font-black text-white no-underline shadow-sm">Δες όλο το οικοσύστημα</Link>
            <Link href="/translate" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 no-underline">Άνοιγμα Μετάφρασης</Link>
          </div>
        </header>

        <section>
          <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#3474b8] sm:text-xs">GLOBAL ECOSYSTEM</p><h2 className="mt-1 text-xl font-black text-[#173f72] sm:text-2xl">Οι κόσμοι του Pantavion</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Το τελικό εύρος εμφανίζεται από τώρα, με αληθινή κατάσταση κάθε οικογένειας. LIVE σημαίνει λειτουργικό surface· BUILDING/FOUNDATION σημαίνει ότι δεν παρουσιάζεται ως ολοκληρωμένο.</p></div></div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ecosystem.map((section) => {
              const card = (
                <article className="h-full rounded-[1.4rem] border border-slate-200/80 bg-white/85 p-4 shadow-[0_12px_34px_rgba(34,71,112,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(34,71,112,0.12)] sm:p-5">
                  <div className="flex items-start justify-between gap-4"><div><div className="mb-2 flex flex-wrap items-center gap-1.5"><span className={`rounded-full border px-2 py-1 text-[9px] font-black tracking-[0.12em] ${statusClasses[section.status]}`}>{section.status}</span><span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[9px] font-black tracking-[0.08em] text-blue-700">{section.revenue}</span></div><h3 className="text-lg font-black text-slate-900 sm:text-xl">{section.title}</h3><p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">{section.subtitle}</p></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-lg text-[#1d5c9c] shadow-sm">{section.icon}</span></div>
                  <div className="mt-4 flex flex-wrap gap-1.5">{section.items.map((item) => <span key={item} className="rounded-full border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[10px] font-bold text-slate-600 sm:text-xs">{item}</span>)}</div>
                  <p className="mt-4 text-xs font-black text-[#2d6ca9] sm:text-sm">{section.status === "LIVE" ? "Άνοιγμα" : "Προβολή αρχιτεκτονικής"} →</p>
                </article>
              );
              return section.href ? <Link key={section.title} href={section.href} className="no-underline">{card}</Link> : <div key={section.title}>{card}</div>;
            })}
          </div>
        </section>

        <section className="mt-9 rounded-[1.5rem] border border-blue-100 bg-[#123b67] p-5 text-white shadow-xl shadow-blue-950/10 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">ONE CORE · MANY KERNELS</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Κεντρική διοίκηση. Εκατοντάδες εξειδικευμένοι πυρήνες.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Shared identity, permissions, trust, payments, notifications, search, AI routing και observability. Κάθε domain απομονωμένο, με τοπική ασφάλεια και κεντρικό Guardian control plane.</p></div><div className="grid grid-cols-2 gap-2 text-xs font-bold text-blue-50"><span className="rounded-xl bg-white/10 p-3">Identity / Trust</span><span className="rounded-xl bg-white/10 p-3">Guardian / Safety</span><span className="rounded-xl bg-white/10 p-3">Capability Registry</span><span className="rounded-xl bg-white/10 p-3">Provider Router</span><span className="rounded-xl bg-white/10 p-3">Memory / Continuity</span><span className="rounded-xl bg-white/10 p-3">Events / Monitoring</span></div></div>
        </section>

        <section className="mt-8 rounded-[1.35rem] border border-slate-200 bg-white/85 p-4 shadow-sm sm:p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#3474b8]">PROFESSIONAL QUICK ACCESS</p><h2 className="mt-1 text-lg font-black text-[#173f72]">Δίκτυο Ύδρευσης</h2><p className="mt-1 text-sm text-slate-500">Προστατευμένο επαγγελματικό περιβάλλον για εξουσιοδοτημένους χρήστες.</p></div><div className="flex flex-wrap gap-2"><Link href="/professional/infrastructure/water" className="rounded-full bg-[#2467aa] px-4 py-2 text-xs font-black text-white no-underline">Water Center</Link><Link href="/professional/infrastructure/water/access" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 no-underline">Access</Link><Link href="/professional/infrastructure/water/live" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 no-underline">Live Map</Link></div></div></section>

        <footer className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-400">Pantavion One · Here We Are One. For All Humanity.</footer>
      </section>
    </main>
  );
}
