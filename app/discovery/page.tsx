"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const discoveryItems = [
  { type: "Business", title: "Επαγγελματίες & επιχειρήσεις", description: "Βρες επαγγελματίες, υπηρεσίες και χώρους μέσα στο Pantavion.", href: "/work", tags: ["business", "services", "work", "professional", "επιχείρηση", "υπηρεσίες"], tone: "from-blue-50 to-indigo-50 border-blue-100 text-blue-700" },
  { type: "Listings", title: "Αγγελίες & προσφορές", description: "Ανακάλυψε αγγελίες, υπηρεσίες και επαγγελματική προβολή.", href: "/advertise", tags: ["listing", "market", "classifieds", "ads", "αγγελίες", "προσφορές"], tone: "from-violet-50 to-fuchsia-50 border-violet-100 text-violet-700" },
  { type: "News", title: "Pantavion Newspaper", description: "Δημόσιο περιεχόμενο, ανακοινώσεις και επαγγελματική προβολή.", href: "/newspaper", tags: ["news", "newspaper", "content", "ειδήσεις", "περιεχόμενο"], tone: "from-amber-50 to-orange-50 border-amber-100 text-amber-700" },
  { type: "Communication", title: "Μετάφραση & Διερμηνέας", description: "Επικοινώνησε με ανθρώπους που μιλούν διαφορετική γλώσσα.", href: "/translate", tags: ["translate", "interpreter", "language", "μετάφραση", "διερμηνέας"], tone: "from-cyan-50 to-sky-50 border-cyan-100 text-cyan-700" },
] as const;

const filters = ["Όλα", "Business", "Listings", "News", "Communication"] as const;
type Filter = (typeof filters)[number];

export default function DiscoveryPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Όλα");
  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return discoveryItems.filter((item) => {
      if (filter !== "Όλα" && item.type !== filter) return false;
      if (!q) return true;
      return [item.title, item.description, item.type, ...item.tags].join(" ").toLocaleLowerCase().includes(q);
    });
  }, [query, filter]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#dcecff_0,#eef6ff_30%,#f8fbff_68%,#ffffff_100%)] px-4 py-5 text-slate-950 sm:px-8 sm:py-8">
      <section className="mx-auto max-w-6xl">
        <nav className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl">
          <Link href="/" className="text-sm font-black tracking-[0.2em] text-[#173f72] no-underline">PANTAVION</Link>
          <Link href="/advertise" className="rounded-full bg-[#2467aa] px-4 py-2 text-xs font-black text-white no-underline shadow-sm transition hover:bg-[#1b568f] sm:text-sm">+ Αγγελία</Link>
        </nav>

        <header className="pb-7 pt-11 sm:pb-9 sm:pt-14">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#3474b8] sm:text-xs">DISCOVER</p>
          <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-[-0.035em] text-[#12365f] sm:text-6xl">Βρες ανθρώπους, υπηρεσίες και ευκαιρίες.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-lg sm:leading-8">Ένα καθαρό σημείο αναζήτησης για τις διαθέσιμες υπηρεσίες και το περιεχόμενο του Pantavion.</p>
        </header>

        <section className="rounded-[1.45rem] border border-blue-100 bg-white/85 p-3 shadow-[0_16px_45px_rgba(40,76,120,0.09)] backdrop-blur-xl sm:p-4">
          <label className="sr-only" htmlFor="pantavion-discovery-search">Αναζήτηση</label>
          <input id="pantavion-discovery-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Αναζήτηση: επιχείρηση, αγγελία, μετάφραση..." className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white" />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition sm:text-sm ${filter === item ? "bg-[#2467aa] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-700"}`}>{item}</button>)}</div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">{results.map((item) => <Link key={item.href} href={item.href} className={`rounded-[1.35rem] border bg-gradient-to-br ${item.tone} p-5 no-underline shadow-[0_10px_30px_rgba(40,76,120,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(40,76,120,0.11)]`}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{item.type}</p><h2 className="mt-2 text-xl font-black text-slate-900">{item.title}</h2></div><span className="rounded-full bg-white/80 px-3 py-1.5 text-sm shadow-sm">→</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p></Link>)}</section>

        {results.length === 0 && <div className="mt-5 rounded-[1.35rem] border border-slate-200 bg-white/80 p-6 text-center shadow-sm"><p className="font-black text-[#173f72]">Δεν βρέθηκε αποτέλεσμα.</p><p className="mt-2 text-sm text-slate-500">Δοκίμασε άλλη λέξη ή κατηγορία.</p></div>}

        <section className="mt-8 rounded-[1.4rem] border border-blue-100 bg-white/75 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#3474b8]">PANTAVION MARKET</p>
          <h2 className="mt-2 text-xl font-black text-[#173f72]">Business → Listing → Promote → Payment</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Ανακάλυψη, δημοσίευση και επαγγελματική προβολή σε μία ενιαία διαδρομή.</p>
        </section>
      </section>
    </main>
  );
}
