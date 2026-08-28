import {
  analyzePantavionTechnologySignal,
  pantavionEvolutionEngineV2,
} from "@/core/kernel/pantavion-evolution-engine";
import { pantavionCurrentTechnologySignals } from "@/core/kernel/pantavion-evolution-current-signals";

function badgeClass(value: string) {
  if (value === "NOW" || value === "SPEC_UPDATE") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  if (value === "NEXT" || value === "CODE_CANDIDATE") return "border-cyan-500/40 bg-cyan-500/10 text-cyan-200";
  if (value === "AHEAD") return "border-violet-500/40 bg-violet-500/10 text-violet-200";
  return "border-slate-700 bg-slate-900 text-slate-300";
}

export default function EvolutionRadarPage() {
  const analyzed = pantavionCurrentTechnologySignals.map((signal) => ({
    signal,
    decision: analyzePantavionTechnologySignal(signal),
  }));

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="text-sm uppercase tracking-[0.35em] text-cyan-300">Evolution Intelligence V2</div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Technology Signal & Horizon Radar</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            Verified external developments are converted into Pantavion-native decisions across NOW, NEXT and AHEAD.
            Forecasts remain labelled hypotheses until evidence promotes them. No signal can directly mutate production.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Engine</div>
            <div className="mt-2 font-semibold">{pantavionEvolutionEngineV2.id}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Current Signals</div>
            <div className="mt-2 text-2xl font-semibold">{analyzed.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Foresight Depth</div>
            <div className="mt-2 text-2xl font-semibold">{pantavionEvolutionEngineV2.maxForesightSteps}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300">Blind Prod Mutation</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-200">DISABLED</div>
          </div>
        </section>

        <section className="mt-8 space-y-6">
          {analyzed.map(({ signal, decision }) => (
            <article key={signal.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(decision.horizon)}`}>
                      {decision.horizon}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(decision.decision)}`}>
                      {decision.decision}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                      Lead {decision.strategicLeadScore}/100
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                      Evidence {decision.evidenceScore}/100
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold">{signal.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{signal.summary}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm lg:min-w-64">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Governed lane</div>
                  <div className="mt-2 font-semibold text-cyan-200">{decision.experimentLane}</div>
                  <div className="mt-3 text-xs text-slate-400">Founder approval</div>
                  <div className="mt-1 font-medium">{decision.requiresFounderApproval ? "Required" : "Not required"}</div>
                  <div className="mt-3 text-xs text-slate-400">Production mutation</div>
                  <div className="mt-1 font-medium text-emerald-200">Not allowed from signal alone</div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Evidence</h3>
                  <div className="mt-3 space-y-3">
                    {signal.evidence.map((item) => (
                      <a
                        key={`${signal.id}-${item.url}`}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-slate-800 bg-slate-950/50 p-4 hover:border-cyan-500/40"
                      >
                        <div className="font-medium text-white">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.publisher} · {item.tier}</div>
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">10-step foresight</h3>
                    <span className="text-xs text-slate-400">Coverage {decision.foresightCoverage}</span>
                  </div>
                  <ol className="mt-3 space-y-3">
                    {decision.foresight.map((step) => (
                      <li key={`${signal.id}-${step.step}`} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/10 text-xs text-violet-200">
                            {step.step}
                          </span>
                          <span className="text-xs uppercase tracking-[0.16em] text-violet-300">Hypothesis · {step.confidence}%</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-200">{step.hypothesis}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
