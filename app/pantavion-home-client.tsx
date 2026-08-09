"use client";

import Link from "next/link";

const primaryModules = [
  {
    eyebrow: "DISCOVER",
    title: "Social & Discovery",
    description: "Ανακάλυψε ανθρώπους, επαγγελματίες, υπηρεσίες και δημόσιο περιεχόμενο.",
    href: "/discovery",
    action: "Ανακάλυψε",
    icon: "◎",
  },
  {
    eyebrow: "MARKET",
    title: "Listings & Ads",
    description: "Αγγελίες και επαγγελματική προβολή μέσα στο Pantavion, χωρίς παρεμβατικές διαφημίσεις.",
    href: "/advertise",
    action: "Άνοιγμα",
    icon: "＋",
  },
  {
    eyebrow: "COMMUNICATE",
    title: "Μετάφραση & Διερμηνέας",
    description: "Κείμενο και αμφίδρομη επικοινωνία σε ένα καθαρό περιβάλλον.",
    href: "/translate",
    action: "Άνοιγμα",
    icon: "↔",
  },
] as const;

const comingNext = ["Business", "Chat", "Communities", "PantaStudio"] as const;

const professionalModules = [
  {
    title: "Water Control Center",
    description: "Κεντρική πρόσβαση στα διαθέσιμα εργαλεία διαχείρισης του δικτύου ύδρευσης.",
    href: "/professional/infrastructure/water",
    action: "Water Center",
  },
  {
    title: "Users / Access",
    description: "Αιτήσεις πρόσβασης, εγκεκριμένοι χρήστες και προστατευμένη διαχείριση.",
    href: "/professional/infrastructure/water/access",
    action: "Users / Access",
  },
  {
    title: "Live Water Map",
    description: "Προστατευμένος χάρτης δικτύου για εγκεκριμένους χρήστες.",
    href: "/professional/infrastructure/water/live",
    action: "Live Map",
  },
] as const;

export default function PantavionHomeClient() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,#173a68_0,#0b1f3b_32%,#061326_70%,#040b16_100%)] text-white">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-8 sm:pt-6 lg:px-12">
        <nav className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="text-sm font-black tracking-[0.2em] text-white no-underline sm:text-base">PANTAVION</Link>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 sm:text-sm">
            <Link href="/discovery" className="rounded-full border border-white/15 px-3 py-2 text-inherit no-underline transition hover:bg-white/10">Discover</Link>
            <Link href="/translate" className="rounded-full border border-white/15 px-3 py-2 text-inherit no-underline transition hover:bg-white/10">Translate</Link>
          </div>
        </nav>

        <header className="pb-7 pt-10 sm:pb-10 sm:pt-14">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300 sm:text-xs">PANTAVION ONE</p>
          <h1 className="mt-3 max-w-3xl text-[2.45rem] font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl">
            Here We Are One.<span className="mt-1 block text-slate-300">For All Humanity.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-6 text-slate-300 sm:text-lg sm:leading-8">
            Άνθρωποι, επικοινωνία, υπηρεσίες και ευκαιρίες σε ένα ενιαίο παγκόσμιο περιβάλλον.
          </p>
        </header>

        <section>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-sky-300 sm:text-xs">START HERE</p>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">Βασικές υπηρεσίες</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {primaryModules.map((module) => (
              <Link key={module.href} href={module.href} className="group rounded-[1.4rem] border border-sky-300/20 bg-gradient-to-br from-sky-400/15 to-white/[0.04] p-4 text-white no-underline shadow-lg shadow-black/10 transition hover:border-sky-300/45 hover:bg-sky-400/20 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-[10px] font-black tracking-[0.2em] text-sky-300">{module.eyebrow}</p><h3 className="mt-2 text-lg font-black sm:text-xl">{module.title}</h3></div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-200/25 bg-sky-300/10 text-lg">{module.icon}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{module.description}</p>
                <p className="mt-4 text-sm font-black text-sky-200">{module.action} →</p>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {comingNext.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-400">{item} · έρχεται</span>)}
          </div>
        </section>

        <section className="mt-9 border-t border-white/10 pt-7 sm:mt-12 sm:pt-9">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-300 sm:text-xs">PROFESSIONAL · INFRASTRUCTURE</p>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">Δίκτυο Ύδρευσης</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Προστατευμένο επαγγελματικό περιβάλλον για εξουσιοδοτημένους χρήστες.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {professionalModules.map((module) => (
              <Link key={module.href} href={module.href} className="group rounded-[1.25rem] border border-white/10 bg-black/20 p-4 text-white no-underline transition hover:border-amber-300/35 hover:bg-white/[0.06] sm:p-5">
                <h3 className="text-base font-black sm:text-lg">{module.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{module.description}</p><p className="mt-4 text-xs font-black text-amber-300 sm:text-sm">{module.action} →</p>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-10 border-t border-white/10 pt-5 text-xs text-slate-500">Pantavion One · Here We Are One. For All Humanity.</footer>
      </section>
    </main>
  );
}
