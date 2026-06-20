import Link from "next/link";

const pdfConfigured = Boolean(process.env.PANTAVION_WATER_B_MAP_PDF_URL);

export default function WaterBMapPage() {
  return (
    <main className="min-h-screen bg-[#050816] px-5 py-8 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-[#f6c85f]/25 bg-[#071425] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/professional/infrastructure/water"
            className="rounded-full border border-[#f6c85f]/35 px-4 py-2 text-sm font-bold text-[#f6c85f]"
          >
            Back to Water Control
          </Link>

          <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-100">
            Protected foundation
          </span>
        </div>

        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f6c85f]">
          Pantavion Water / B Map
        </p>

        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
          B Map protected PDF view from authentic DWG vault.
        </h1>

        <p className="mt-5 max-w-4xl text-base font-semibold leading-8 text-slate-200">
          This page is the protected B Map viewer foundation. The authentic DWG remains a private,
          read-only source vault item. The PDF view is a visual derivative only and must not be
          presented as the editable master DWG.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-emerald-300/25 bg-emerald-950/20 p-5">
            <h2 className="text-xl font-black text-emerald-100">Source rule</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-200">
              Original DWG stays private, unchanged, unfiltered, and read-only.
            </p>
          </article>

          <article className="rounded-3xl border border-cyan-300/25 bg-cyan-950/20 p-5">
            <h2 className="text-xl font-black text-cyan-100">Viewer rule</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-200">
              B Map may display only a protected PDF derivative after access checks.
            </p>
          </article>

          <article className="rounded-3xl border border-amber-300/25 bg-amber-950/20 p-5">
            <h2 className="text-xl font-black text-amber-100">Current state</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-200">
              {pdfConfigured
                ? "Private PDF environment marker exists. Protected delivery route is still required."
                : "No private B Map PDF environment marker is configured yet."}
            </p>
          </article>
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-black/30 p-5">
          <h2 className="text-2xl font-black">PDF delivery gate</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
            The PDF is not loaded from a public URL on this page. Next step is a protected server
            delivery route with water access/session checks, audit logging, and no exposure of the
            private Blob source URL.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/professional/infrastructure/water/sources"
            className="rounded-full border border-[#f6c85f]/35 px-5 py-3 text-sm font-black text-[#f6c85f]"
          >
            Source Vault
          </Link>

          <Link
            href="/professional/infrastructure/water/master-b-mobile"
            className="rounded-full border border-cyan-300/35 px-5 py-3 text-sm font-black text-cyan-100"
          >
            B Mobile Status
          </Link>
        </div>
      </section>
    </main>
  );
}
