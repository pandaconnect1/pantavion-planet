import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  isPantavionKernelAccessAllowed,
  isPantavionKernelFounderIdentityAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
  PANTAVION_KERNEL_FOUNDER_QUERY,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";
import { loadRecoveryClassificationPage } from "@/core/recovery/pantavion-recovery-classification-reader";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function count(value: number): string {
  return new Intl.NumberFormat("el-GR").format(value);
}

function pageHref(page: number, module?: string | null, status?: string | null, query?: string): string {
  const params = new URLSearchParams({ page: String(page) });
  if (module) params.set("module", module);
  if (status) params.set("status", status);
  if (query) params.set("q", query);
  return `/kernel/recovery-classification?${params.toString()}`;
}

export default async function RecoveryClassificationPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const queryToken =
    first(resolved[PANTAVION_KERNEL_ACCESS_QUERY]) ??
    first(resolved[PANTAVION_KERNEL_FOUNDER_QUERY]);
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PANTAVION_KERNEL_SESSION_COOKIE)?.value ?? null;
  const allowed =
    isPantavionKernelAccessAllowed(queryToken) ||
    isPantavionKernelAccessAllowed(sessionToken);

  if (!allowed || !(await isPantavionKernelFounderIdentityAllowed())) notFound();

  const data = await loadRecoveryClassificationPage(
    first(resolved.page), first(resolved.module), first(resolved.status), first(resolved.q),
  );

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <a className="text-sm font-bold text-cyan-300" href="/kernel">← Kernel</a>
        <div className="mt-5 rounded-[2rem] border border-cyan-300/25 bg-cyan-950/20 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">Founder-only recovery intelligence</p>
          <h1 className="mt-3 text-3xl font-black">Ταξινόμηση 82.413 στοιχείων</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-200">
            Πραγματική ανάγνωση του canonical corpus. Κάθε γραμμή παρακάτω προέρχεται από τα αποθηκευμένα recovery batches και εμφανίζει κατηγορία, κατάσταση, πηγή και canonical προορισμό.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Σύνολο" value={count(data.totalRecords)} tone="text-cyan-200" />
            <Metric label="Ταξινομημένα" value={count(data.reviewCounts.CLASSIFIED ?? 0)} tone="text-emerald-300" />
            <Metric label="Χρειάζονται έλεγχο" value={count(data.reviewCounts.REVIEW_REQUIRED ?? 0)} tone="text-amber-200" />
            <Metric label="Live επαληθευμένα" value="0" tone="text-rose-200" />
          </div>
          <p className="mt-4 break-all text-xs text-slate-400">Corpus fingerprint: {data.corpusFingerprint}</p>
        </div>

        <form method="get" className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-3">
          <input name="q" defaultValue={data.query} maxLength={120} placeholder="Αναζήτηση ID, θέματος, πηγής…" className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm" />
          <select name="status" defaultValue={data.selectedStatus ?? ""} className="rounded-xl border border-white/15 bg-[#0a0d14] px-4 py-3 text-sm">
            <option value="">Όλες οι καταστάσεις</option>
            {Object.entries(data.reviewCounts).map(([status, statusCount]) => <option key={status} value={status}>{status} ({count(statusCount)})</option>)}
          </select>
          {data.selectedModule ? <input type="hidden" name="module" value={data.selectedModule} /> : null}
          <button className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950" type="submit">Εφαρμογή φίλτρων</button>
        </form>

        <section className="mt-6">
          <h2 className="text-xl font-black">Ενότητες</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.moduleCounts).map(([module, moduleCount]) => (
              <a key={module} href={pageHref(1, module, data.selectedStatus, data.query)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:border-cyan-300/40">
                <p className="text-sm font-bold text-slate-100">{module}</p>
                <p className="mt-2 text-2xl font-black text-cyan-200">{count(moduleCount)}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
            <div>
              <h2 className="text-xl font-black">{data.selectedModule ?? "Όλες οι ενότητες"}: {count(data.startOrdinal)}–{count(data.endOrdinal)} από {count(data.filteredRecords)}</h2>
              <p className="mt-1 text-xs text-slate-400">Σελίδα {count(data.page)} από {count(data.totalPages)} · 50 ανά σελίδα</p>
            </div>
            <div className="flex gap-2">
              {data.selectedModule || data.selectedStatus || data.query ? <PageLink href={pageHref(1)} label="Καθαρισμός" /> : null}
              {data.page > 1 ? <PageLink href={pageHref(data.page - 1, data.selectedModule, data.selectedStatus, data.query)} label="Προηγούμενα" /> : null}
              {data.page < data.totalPages ? <PageLink href={pageHref(data.page + 1, data.selectedModule, data.selectedStatus, data.query)} label="Επόμενα" /> : null}
            </div>
          </div>
          <div className="divide-y divide-white/10">
            {data.rows.map((row) => (
              <article key={row.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-cyan-300">#{count(row.ordinal)} · {row.id}</p>
                    <h3 className="mt-1 font-black">{row.module}</h3>
                    <p className="mt-1 text-sm text-slate-300">{row.subsystem} · {row.capability}</p>
                  </div>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-amber-100">{row.reviewStatus}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-200">{row.preview || "Χωρίς διαθέσιμη προεπισκόπηση"}</p>
                <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <Fact label="Απόφαση" value={row.decision} />
                  <Fact label="Live state" value={row.liveState} />
                  <Fact label="Source family" value={row.sourceFamily} />
                  <Fact label="Canonical target" value={row.canonicalTarget} />
                </dl>
                <p className="mt-3 break-all text-xs text-slate-500">{row.sourceLocation}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="rounded-2xl bg-black/30 p-4"><p className="text-xs text-slate-400">{label}</p><p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p></div>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-black/25 p-3"><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words font-bold text-slate-200">{value}</dd></div>;
}

function PageLink({ href, label }: { href: string; label: string }) {
  return <a href={href} className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100">{label}</a>;
}
