"use client";

import Link from "next/link";

const productionModules = [
  {
    title: "Water Control Center",
    description:
      "Το κεντρικό προστατευμένο περιβάλλον του Δικτύου Ύδρευσης για πρόσβαση στις διαθέσιμες λειτουργίες και εργαλεία διαχείρισης.",
    href: "/professional/infrastructure/water",
    action: "Άνοιγμα Water Center",
  },
  {
    title: "Users / Access",
    description:
      "Αιτήσεις πρόσβασης, έλεγχος εγκεκριμένων χρηστών και συσκευών, με προστατευμένη διαχείριση Administrator.",
    href: "/professional/infrastructure/water/access",
    action: "Άνοιγμα Users / Access",
  },
  {
    title: "A Live Water Map",
    description:
      "Ο προστατευμένος χάρτης του δικτύου ύδρευσης για εγκεκριμένους χρήστες, με τμηματική φόρτωση των σωληνώσεων.",
    href: "/professional/infrastructure/water/live",
    action: "Άνοιγμα Live Map",
  },
] as const;

export default function PantavionHomeClient() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#192b55_0,#071020_48%,#02040b_100%)] px-4 py-5 text-[#fff8e7] sm:px-8 sm:py-7 lg:px-12">
      <section className="mx-auto max-w-6xl">
        <header className="rounded-[1.6rem] border border-[#f6c85f]/25 bg-[#0d1a2d]/80 p-5 shadow-2xl sm:p-7">
          <div className="flex flex-col gap-2 sm:gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f6c85f] sm:text-xs">
              PANTAVION ONE
            </p>
            <h1 className="max-w-4xl text-3xl font-black leading-[1.08] sm:text-5xl">
              Here We Are One. For All Humanity.
            </h1>
            <p className="max-w-4xl text-base leading-7 text-slate-200 sm:text-lg">
              Ψηφιακές υπηρεσίες και προστατευμένες επαγγελματικές υποδομές σε ένα ενιαίο περιβάλλον Pantavion.
            </p>
          </div>
        </header>

        <section className="mt-6 sm:mt-8">
          <div className="mb-5">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#f6c85f] sm:text-xs">
              PANTAVION INFRASTRUCTURE
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Δίκτυο Ύδρευσης</h2>
            <p className="mt-3 max-w-4xl text-base leading-7 text-slate-300 sm:text-lg">
              Χάρτης δικτύου, πρόσβαση χρηστών και προστατευμένη διαχείριση σε ένα ενιαίο επαγγελματικό περιβάλλον.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {productionModules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="group rounded-3xl border border-[#f6c85f]/25 bg-[#071020]/85 p-5 text-[#fff8e7] no-underline shadow-xl transition hover:border-[#f6c85f]/60 hover:bg-[#0b1930] sm:p-6"
              >
                <h3 className="text-xl font-black sm:text-2xl">{module.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300 md:min-h-[112px]">
                  {module.description}
                </p>
                <p className="mt-5 text-sm font-black text-[#f6c85f]">
                  {module.action} →
                </p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
