import { getPantavionMarketRadarReport } from "@/core/intelligence/pantavion-market-radar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PantavionRadarPage() {
  const report = getPantavionMarketRadarReport();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#192b55_0,#071020_48%,#02040b_100%)] px-4 py-6 text-[#fff8e7] sm:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-[#f6c85f]/25 bg-[#071020]/85 p-5 shadow-2xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#f6c85f]">PANTAVION MARKET RADAR KERNEL V1</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Ζωντανή επιφάνεια νοημοσύνης αγοράς.</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-200">
            Βλέπει παγκόσμια signals, ανταγωνιστές, τεχνολογίες, κινδύνους και τα μετατρέπει σε Pantavion implementation targets.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs font-black uppercase text-slate-400">Signals</p><p className="mt-1 text-3xl font-black text-[#f6c85f]">{report.summary.totalSignals}</p></div>
            <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs font-black uppercase text-slate-400">Critical</p><p className="mt-1 text-3xl font-black text-red-300">{report.summary.criticalSignals}</p></div>
            <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs font-black uppercase text-slate-400">Founder decisions</p><p className="mt-1 text-3xl font-black text-orange-300">{report.summary.founderDecisionRequired}</p></div>
          </div>
        </div>

        <section className="mt-8 grid gap-4">
          {report.signals.map((signal) => (
            <article key={signal.id} className="rounded-3xl border border-[#f6c85f]/20 bg-[#071020]/80 p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f6c85f]">{signal.domain}</p>
              <h2 className="mt-2 text-2xl font-black">{signal.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{signal.competitorOrSource}</p>
              <p className="mt-4 text-base leading-7 text-slate-200"><strong className="text-[#f6c85f]">Γιατί:</strong> {signal.whyItMatters}</p>
              <p className="mt-3 text-base leading-7 text-slate-200"><strong className="text-[#f6c85f]">Pantavion action:</strong> {signal.pantavionAction}</p>
              <p className="mt-3 text-sm font-black text-[#f6c85f]">Target: {signal.implementationTarget}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
