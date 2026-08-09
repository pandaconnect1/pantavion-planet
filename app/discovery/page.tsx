"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const discoveryItems = [
  {
    type: "Business",
    title: "Επαγγελματίες & επιχειρήσεις",
    description: "Βρες επαγγελματίες, υπηρεσίες και χώρους που υπάρχουν μέσα στο Pantavion.",
    href: "/work",
    tags: ["business", "services", "work", "professional", "επιχείρηση", "υπηρεσίες"],
  },
  {
    type: "Listings",
    title: "Αγγελίες & προσφορές",
    description: "Ανακάλυψε αγγελίες, υπηρεσίες και επαγγελματική προβολή χωρίς παρεμβατικές διαφημίσεις.",
    href: "/advertise",
    tags: ["listing", "market", "classifieds", "ads", "αγγελίες", "προσφορές"],
  },
  {
    type: "News",
    title: "Pantavion Newspaper",
    description: "Δημόσιο περιεχόμενο, ανακοινώσεις και επαγγελματική προβολή σε ξεχωριστό χώρο.",
    href: "/newspaper",
    tags: ["news", "newspaper", "content", "ειδήσεις", "περιεχόμενο"],
  },
  {
    type: "Communication",
    title: "Μετάφραση & Διερμηνέας",
    description: "Επικοινώνησε με ανθρώπους που μιλούν διαφορετική γλώσσα.",
    href: "/translate",
    tags: ["translate", "interpreter", "language", "μετάφραση", "διερμηνέας"],
  },
] as const;

const filters = ["Όλα", "Business", "Listings", "News", "Communication"] as const;

type Filter = (typeof filters)[number];

export default function DiscoveryPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Όλα");

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return discoveryItems.filter((item) => {
      const matchesFilter = filter === "Όλα" || item.type === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      const haystack = [item.title, item.description, item.type, ...item.tags]
        .join(" ")
        .toLocaleLowerCase();
      return haystack.includes(q);
    });
  }, [query, filter]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#173a68_0,#0b1f3b_35%,#061326_72%,#040b16_100%)] px-4 py-5 text-white sm:px-8 sm:py-8">
      <section className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm font-black tracking-[0.2em] text-white no-underline">PANTAVION</Link>
          <Link href="/advertise" className="rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-[#071020] no-underline sm:text-sm">
            + Δημιουργία αγγελίας
          </Link>
        </div>

        <header className="pb-6 pt-10 sm:pb-8 sm:pt-14">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-300 sm:text-xs">DISCOVER</p>
          <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Βρες ανθρώπους, υπηρεσίες και ευκαιρίες.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-lg sm:leading-8">
            Ένα απλό σημείο αναζήτησης για ό,τι υπάρχει μέσα στο Pantavion. Οι λειτουργίες που δεν είναι ακόμη πραγματικά διαθέσιμες δεν εμφανίζονται ως ενεργές.
          </p>
        </header>

        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-3 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-4">
          <label className="sr-only" htmlFor="pantavion-discovery-search">Αναζήτηση</label>
          <input
            id="pantavion-discovery-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Αναζήτηση: επιχείρηση, αγγελία, μετάφραση..."
            className="w-full rounded-2xl border border-white/10 bg-[#071426]/80 px-4 py-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-sky-300/50"
          />

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition sm:text-sm ${
                  filter === item ? "bg-sky-300 text-[#071020]" : "border border-white/10 bg-white/[0.04] text-slate-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {results.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-5 text-white no-underline transition hover:border-sky-300/40 hover:bg-white/[0.06]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">{item.type}</p>
                  <h2 className="mt-2 text-xl font-black">{item.title}</h2>
                </div>
                <span className="text-slate-500">→</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
            </Link>
          ))}
        </section>

        {results.length === 0 && (
          <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-black/20 p-6 text-center">
            <p className="font-black">Δεν βρέθηκε αποτέλεσμα ακόμη.</p>
            <p className="mt-2 text-sm text-slate-400">Δοκίμασε άλλη λέξη ή κατηγορία. Δεν εμφανίζουμε ψεύτικα αποτελέσματα.</p>
          </div>
        )}

        <section className="mt-8 rounded-[1.4rem] border border-amber-300/20 bg-amber-300/[0.07] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">NEXT REVENUE FLOW</p>
          <h2 className="mt-2 text-xl font-black">Business → Listing → Promote → Payment</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Αυτό είναι το ενεργό μονοπάτι που ολοκληρώνουμε τώρα. Τα υπόλοιπα μένουν στο backlog μέχρι να είναι πραγματικά έτοιμα.</p>
        </section>
      </section>
    </main>
  );
}
