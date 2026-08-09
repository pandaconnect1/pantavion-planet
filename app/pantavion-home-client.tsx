"use client";

import Link from "next/link";

const primaryModules = [
  { eyebrow: "DISCOVER", title: "Social & Discovery", description: "Άνθρωποι, επαγγελματίες, υπηρεσίες και δημόσιο περιεχόμενο.", href: "/discovery", action: "Ανακάλυψε", icon: "◎", tone: "from-blue-50 to-indigo-50 border-blue-100 text-blue-700" },
  { eyebrow: "MARKET", title: "Listings & Ads", description: "Αγγελίες και επαγγελματική προβολή μέσα στο Pantavion.", href: "/advertise", action: "Άνοιγμα", icon: "＋", tone: "from-violet-50 to-fuchsia-50 border-violet-100 text-violet-700" },
  { eyebrow: "COMMUNICATE", title: "Μετάφραση & Διερμηνέας", description: "Κείμενο και αμφίδρομη επικοινωνία σε ένα καθαρό περιβάλλον.", href: "/translate", action: "Άνοιγμα", icon: "↔", tone: "from-cyan-50 to-sky-50 border-cyan-100 text-cyan-700" },
] as const;

const comingNext = ["Business", "Chat", "Communities", "PantaStudio"] as const;
const professionalModules = [
  { title: "Water Control Center", description: "Κεντρική πρόσβαση στα διαθέσιμα εργαλεία διαχείρισης του δικτύου ύδρευσης.", href: "/professional/infrastructure/water", action: "Water Center" },
  { title: "Users / Access", description: "Αιτήσεις πρόσβασης, εγκεκριμένοι χρήστες και προστατευμένη διαχείριση.", href: "/professional/infrastructure/water/access", action: "Users / Access" },
  { title: "Live Water Map", description: "Προστατευμένος χάρτης δικτύου για εγκεκριμένους χρήστες.", href: "/professional/infrastructure/water/live", action: "Live Map" },
] as const;

export default function PantavionHomeClient() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,#dcecff_0,#edf5ff_32%,#f8fbff_68%,#ffffff_100%)] text-slate-950">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-8 sm:pt-6 lg:px-12">
        <nav className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl">
          <Link href="/" className="text-sm font-black tracking-[0.2em] text-[#173f72] no-underline sm:text-base">PANTAVION</Link>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 sm:text-sm">
            <Link href="/discovery" className="rounded-full px-3 py-2 text-inherit no-underline transition hover:bg-blue-50 hover:text-blue-700">Discover</Link>
            <Link href="/translate" className="rounded-full px-3 py-2 text-inherit no-underline transition hover:bg-cyan-50 hover:text-cyan-700">Translate</Link>
          </div>
        </nav>

        <header className="pb-8 pt-11 sm:pb-11 sm:pt-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#2865a8] shadow-sm sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-cyan-500" /> PANTAVION ONE
          </div>
          <h1 className="mt-4 max-w-3xl text-[2.5rem] font-black leading-[0.98] tracking-[-0.045em] text-[#12365f] sm:text-6xl">Here We Are One.<span className="mt-1 block text-[#4f78a6]">For All Humanity.</span></h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-6 text-slate-600 sm:text-lg sm:leading-8">Άνθρωποι, επικοινωνία, υπηρεσίες και ευκαιρίες σε ένα ενιαίο παγκόσμιο περιβάλλον.</p>
        </header>

        <section>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#3474b8] sm:text-xs">START HERE</p>
          <h2 className="mt-1 text-xl font-black text-[#173f72] sm:text-2xl">Βασικές υπηρεσίες</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {primaryModules.map((module) => (
              <Link key={module.href} href={module.href} className={`group rounded-[1.35rem] border bg-gradient-to-br ${module.tone} p-4 no-underline shadow-[0_12px_35px_rgba(40,76,120,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(40,76,120,0.13)] sm:p-5`}>
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black tracking-[0.2em] opacity-70">{module.eyebrow}</p><h3 className="mt-2 text-lg font-black text-slate-900 sm:text-xl">{module.title}</h3></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-lg shadow-sm">{module.icon}</span></div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{module.description}</p><p className="mt-4 text-sm font-black">{module.action} →</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">{comingNext.map((item) => <span key={item} className="rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">{item} · έρχεται</span>)}</div>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8 sm:mt-12 sm:pt-9">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#3474b8] sm:text-xs">PROFESSIONAL · INFRASTRUCTURE</p>
          <h2 className="mt-1 text-xl font-black text-[#173f72] sm:text-2xl">Δίκτυο Ύδρευσης</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Προστατευμένο επαγγελματικό περιβάλλον για εξουσιοδοτημένους χρήστες.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">{professionalModules.map((module) => <Link key={module.href} href={module.href} className="group rounded-[1.25rem] border border-slate-200 bg-white/75 p-4 text-slate-900 no-underline shadow-sm transition hover:border-blue-200 hover:bg-white sm:p-5"><h3 className="text-base font-black text-[#173f72] sm:text-lg">{module.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{module.description}</p><p className="mt-4 text-xs font-black text-[#3474b8] sm:text-sm">{module.action} →</p></Link>)}</div>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-400">Pantavion One · Here We Are One. For All Humanity.</footer>
      </section>
    </main>
  );
}
