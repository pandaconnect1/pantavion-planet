"use client";

import Link from "next/link";

const productionModules = [
  {
    title: "Water Control Center",
    description:
      "Το κεντρικό προστατευμένο περιβάλλον του Δικτύου Ύδρευσης. Από εδώ ανοίγεις τις πραγματικές λειτουργίες που είναι διαθέσιμες σήμερα.",
    href: "/professional/infrastructure/water",
    action: "Άνοιγμα Water Center",
  },
  {
    title: "Users / Access",
    description:
      "Πραγματική ροή αιτήσεων πρόσβασης και ελέγχου εγκεκριμένων συσκευών. Η διαχείριση Administrator παραμένει προστατευμένη.",
    href: "/professional/infrastructure/water/access",
    action: "Άνοιγμα Users / Access",
  },
  {
    title: "A Live Water Map",
    description:
      "Ο προστατευμένος live χάρτης του δικτύου ύδρευσης για εγκεκριμένους χρήστες, με τμηματική φόρτωση των σωληνώσεων.",
    href: "/professional/infrastructure/water/live",
    action: "Άνοιγμα Live Map",
  },
] as const;

export default function PantavionHomeClient() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#192b55_0,#071020_48%,#02040b_100%)] px-4 py-8 text-[#fff8e7] sm:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl">
        <header className="rounded-[2rem] border border-[#f6c85f]/25 bg-[#0d1a2d]/80 p-6 shadow-2xl sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#f6c85f]">
            PANTAVION • PRODUCTION
          </p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight sm:text-6xl">
            Μόνο πραγματικά λειτουργικές ενότητες.
          </h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-200 sm:text-xl">
            Η δημόσια production σελίδα εμφανίζει μόνο λειτουργίες που έχουν πραγματική υλοποίηση. Modules που είναι ακόμη foundation, δοκιμαστικά ή υπό ανάπτυξη παραμένουν κρυμμένα μέχρι να είναι έτοιμα.
          </p>
        </header>

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f6c85f]">
              LIVE NOW
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-5xl">Δίκτυο Ύδρευσης</h2>
            <p className="mt-3 max-w-4xl text-base leading-7 text-slate-300 sm:text-lg">
              Χάρτης, πρόσβαση χρηστών και προστατευμένη διαχείριση. Δεν εμφανίζονται στατικά κουμπιά ή μελλοντικές υπηρεσίες ως έτοιμες.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {productionModules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="group rounded-3xl border border-[#f6c85f]/25 bg-[#071020]/85 p-6 text-[#fff8e7] no-underline shadow-xl transition hover:border-[#f6c85f]/60 hover:bg-[#0b1930]"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f6c85f]">
                  ACTIVE
                </p>
                <h3 className="mt-3 text-2xl font-black">{module.title}</h3>
                <p className="mt-3 min-h-[112px] text-sm leading-7 text-slate-300">
                  {module.description}
                </p>
                <p className="mt-5 text-sm font-black text-[#f6c85f]">
                  {module.action} →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-300">
          Pantavion συνεχίζει να αναπτύσσεται στο παρασκήνιο. Μια νέα ενότητα θα εμφανίζεται εδώ μόνο όταν έχει πραγματική λειτουργία και έχει περάσει τον απαιτούμενο έλεγχο πριν από production.
        </footer>
      </section>
    </main>
  );
}
