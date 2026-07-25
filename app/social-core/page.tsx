import Link from "next/link";
import { SOCIAL_CORE_MODULES } from "@/lib/social-core";

const continents = [
  "Αφρική",
  "Ανταρκτική",
  "Ασία",
  "Ευρώπη",
  "Βόρεια Αμερική",
  "Νότια Αμερική",
  "Ωκεανία",
] as const;

const pillars = [
  {
    title: "Social & Relationships",
    description:
      "Ενιαίο κοινωνικό γράφημα για φίλους, οικογένεια, followers, συνεργάτες, ομάδες και κοινότητες.",
  },
  {
    title: "Γνωριμίες ενηλίκων",
    description:
      "Dating, κοινωνικές γνωριμίες και ασφαλές matching μόνο για επιλέξιμους και επαληθευμένους ενήλικες.",
  },
  {
    title: "Teen World",
    description:
      "Ξεχωριστή ασφαλής εμπειρία ανηλίκων μέσα στον ίδιο πυρήνα, χωρίς λειτουργίες ενηλίκων.",
  },
  {
    title: "Universal Search",
    description:
      "Αναζήτηση με λέξεις-κλειδιά, φυσική γλώσσα και φίλτρα για ανθρώπους, περιεχόμενο, ομάδες και ευκαιρίες.",
  },
  {
    title: "Unified Communication",
    description:
      "Ένα inbox για chat, ομάδες, voice, video, business, events, communities και Secure Circles.",
  },
  {
    title: "Global Translation",
    description:
      "Μετάφραση κειμένου, φωνής και ζωντανών συνομιλιών ώστε η γλώσσα να μην αποτελεί εμπόδιο.",
  },
  {
    title: "Contacts & Migration",
    description:
      "Εισαγωγή επαφών, δεδομένων και μηνυμάτων στο μέγιστο που επιτρέπεται τεχνικά και νομικά.",
  },
  {
    title: "Policy & Governance",
    description:
      "Δυναμικοί κανόνες ανά ηλικία, χώρα, δικαιοδοσία, λειτουργία και επίπεδο επαλήθευσης.",
  },
] as const;

export const metadata = {
  title: "Pantavion Social Core",
  description:
    "Η ενιαία παγκόσμια πλατφόρμα Social, Κοινωνικών Σχέσεων και Γνωριμιών.",
};

export default function SocialCorePage() {
  return (
    <main className="min-h-screen bg-[#050b14] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(246,200,95,0.18),_transparent_42%)] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 no-underline hover:border-[#f6c85f]/60 hover:text-[#f6c85f]"
          >
            ← Pantavion Planet
          </Link>

          <p className="mt-12 text-sm font-black uppercase tracking-[0.28em] text-[#f6c85f]">
            Pantavion Social Core
          </p>
          <h1 className="mt-5 max-w-5xl text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Social, κοινωνικές σχέσεις και γνωριμίες σε έναν παγκόσμιο πυρήνα.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-white/70 sm:text-xl">
            Η πλατφόρμα όπου βρίσκεις ανθρώπους, γνώση, πολιτισμό,
            συνεργασίες και ευκαιρίες, ανεξάρτητα από χώρα ή γλώσσα.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {continents.map((continent) => (
              <span
                key={continent}
                className="rounded-full border border-[#f6c85f]/30 bg-[#f6c85f]/10 px-4 py-2 text-sm font-bold text-[#ffe5a3]"
              >
                {continent}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20"
              >
                <h2 className="text-xl font-black text-[#f6c85f]">
                  {pillar.title}
                </h2>
                <p className="mt-3 leading-7 text-white/65">
                  {pillar.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#f6c85f]">
                Common Core Registry
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Ένας πυρήνας, κοινές υπηρεσίες, χωρίς διπλές υλοποιήσεις.
              </h2>
            </div>
            <span className="text-sm font-bold text-white/50">
              {SOCIAL_CORE_MODULES.length} ενεργά θεμελιώδη modules
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOCIAL_CORE_MODULES.map((module) => (
              <article
                key={module.id}
                className="rounded-2xl border border-white/10 bg-[#071321] p-5"
              >
                <h3 className="font-black text-white">{module.name}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  {module.capabilities.length} κοινές δυνατότητες πυρήνα
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {module.capabilities.slice(0, 4).map((capability) => (
                    <code
                      key={capability}
                      className="rounded-lg bg-white/5 px-2 py-1 text-xs text-[#c9d9ea]"
                    >
                      {capability}
                    </code>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-200">
              Ενιαία αρχιτεκτονική
            </p>
            <h2 className="mt-3 text-3xl font-black">Ένα identity, ένα graph, ένα inbox.</h2>
            <p className="mt-5 leading-8 text-white/70">
              Social, communities, dating, business, events και marketplace
              χρησιμοποιούν κοινές υπηρεσίες ταυτότητας, σχέσεων, αναζήτησης,
              επικοινωνίας, μετάφρασης, ασφάλειας και πολιτικών.
            </p>
          </article>

          <article className="rounded-3xl border border-sky-300/20 bg-sky-300/[0.06] p-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-200">
              Παγκόσμια λειτουργία
            </p>
            <h2 className="mt-3 text-3xl font-black">Τοπικοί κανόνες, παγκόσμια σύνδεση.</h2>
            <p className="mt-5 leading-8 text-white/70">
              Το Policy & Governance Engine προσαρμόζει λειτουργίες ανά ηλικία,
              χώρα, δικαιοδοσία και επαλήθευση, χωρίς να γράφονται οι κανόνες
              διάσπαρτα μέσα στις οθόνες.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
