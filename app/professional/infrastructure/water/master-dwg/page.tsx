"use client";

import Link from "next/link";

export default function WaterMasterDwgPage() {
  return (
    <main className="min-h-screen bg-[#061120] px-5 py-8 text-white">
      <section className="mx-auto max-w-5xl rounded-3xl border border-[#f2c766]/40 bg-[#0b1728] p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f2c766]">
          PANTAVION WATER
        </p>

        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
          Χάρτες Ύδρευσης
        </h1>

        <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
          Άνοιγμα ενός χάρτη κάθε φορά για γρήγορη και ελαφριά λειτουργία στο κινητό.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/professional/infrastructure/water/live"
            className="rounded-2xl border border-slate-600 bg-black/25 p-5 transition hover:border-[#f2c766]"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f2c766]">
              A
            </p>
            <h2 className="mt-2 text-2xl font-black">Λειτουργικός χάρτης</h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              Υφιστάμενος χάρτης δικτύου.
            </p>
            <p className="mt-4 text-sm font-black text-[#f8e6ad]">
              OPEN MAP A
            </p>
          </Link>

          <Link
            href="/professional/infrastructure/water/master-viewer"
            className="rounded-2xl border border-[#f2c766] bg-[#f2c766]/15 p-5 transition hover:bg-[#f2c766]/25"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f2c766]">
              B
            </p>
            <h2 className="mt-2 text-2xl font-black">Master χάρτης</h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              Ζωντανή ελαφριά προβολή του Master B μέσα στο Pantavion.
            </p>
            <p className="mt-4 text-sm font-black text-[#f8e6ad]">
              OPEN MASTER B
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
