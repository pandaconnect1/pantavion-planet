import Link from "next/link";

import FounderControlRuntime from "./founder-control-runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function configured(...values: Array<string | undefined>) {
  return values.every((value) => Boolean((value || "").trim()));
}

export default function FounderWaterControlPage() {
  const renderCommit = (process.env.RENDER_GIT_COMMIT || "").trim();
  const renderService = (process.env.RENDER_SERVICE_ID || "").trim();

  const objectStorageReady = configured(
    process.env.PANTAVION_OBJECT_STORAGE_ENDPOINT,
    process.env.PANTAVION_OBJECT_STORAGE_BUCKET,
    process.env.PANTAVION_OBJECT_STORAGE_ACCESS_KEY_ID,
    process.env.PANTAVION_OBJECT_STORAGE_SECRET_ACCESS_KEY,
  );

  const founderSessionReady = configured(
    process.env.PANTAVION_FOUNDER_SESSION_SECRET ||
      process.env.PANTAVION_ADMIN_SESSION_SECRET ||
      process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET,
  );

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f2c766]">
              PANTAVION FOUNDER ADMINISTRATION
            </p>
            <h1 className="mt-2 text-3xl font-black">Founder Control Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Κεντρικός έλεγχος Ύδρευσης: πρόσβαση χρηστών, trusted/blocked συσκευές,
              Map A/B/C, αλλαγές δικτύου και κατάσταση production runtime.
            </p>
          </div>

          <Link
            href="/professional/infrastructure/water/live"
            className="rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black"
          >
            Άνοιγμα Map A
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-200">
              Production provider
            </p>
            <p className="mt-2 text-xl font-black">{renderService ? "Render" : "Μη επιβεβαιωμένο"}</p>
            <p className="mt-2 break-all text-xs text-emerald-100/70">
              {renderCommit ? `Commit ${renderCommit.slice(0, 12)}…` : "Commit metadata unavailable"}
            </p>
          </article>

          <article className="rounded-2xl border border-cyan-500/40 bg-cyan-950/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
              Founder session
            </p>
            <p className="mt-2 text-xl font-black">{founderSessionReady ? "Configured" : "Needs configuration"}</p>
            <p className="mt-2 text-xs text-cyan-100/70">Server-side signed session only.</p>
          </article>

          <article className="rounded-2xl border border-violet-500/40 bg-violet-950/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-200">
              Object storage
            </p>
            <p className="mt-2 text-xl font-black">{objectStorageReady ? "Configured" : "Not configured"}</p>
            <p className="mt-2 text-xs text-violet-100/70">DWG / KMZ / evidence storage readiness.</p>
          </article>

          <article className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-200">
              Map verification
            </p>
            <p className="mt-2 text-xl font-black">A active · B/C pending verify</p>
            <p className="mt-2 text-xs text-amber-100/70">No source geometry mutation from this panel.</p>
          </article>
        </div>

        <FounderControlRuntime />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/founder/account-setup" className="rounded-2xl border border-cyan-400/40 bg-[#0d1a2d] p-5 font-black text-cyan-100">
            Founder email + password setup →
          </Link>
          <Link href="/professional/infrastructure/water/admin/approvals" className="rounded-2xl border border-[#f2c766]/40 bg-[#0d1a2d] p-5 font-black text-[#f2c766]">
            Users / Approvals →
          </Link>
          <Link href="/professional/infrastructure/water/admin/changes" className="rounded-2xl border border-emerald-500/40 bg-[#0d1a2d] p-5 font-black text-emerald-200">
            Αλλαγές δικτύου / τεκμήρια →
          </Link>
          <Link href="/professional/infrastructure/water/admin/faults" className="rounded-2xl border border-red-500/40 bg-[#0d1a2d] p-5 font-black text-red-200">
            Βλάβες προς έγκριση →
          </Link>
          <Link href="/professional/infrastructure/water/admin/alignment" className="rounded-2xl border border-cyan-500/40 bg-[#0d1a2d] p-5 font-black text-cyan-200">
            Map B alignment →
          </Link>
          <Link href="/professional/infrastructure/water/maps" className="rounded-2xl border border-white/20 bg-[#0d1a2d] p-5 font-black text-white">
            Map A / B / C →
          </Link>
          <Link href="/professional/infrastructure/water" className="rounded-2xl border border-white/20 bg-[#0d1a2d] p-5 font-black text-white">
            Water Control Center →
          </Link>
        </div>
      </section>
    </main>
  );
}
