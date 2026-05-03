import { guardianUseCases } from "@/core/emergency/extreme-sos-capability";

export default function EmergencyScenariosPage() {
  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-yellow-400/25 bg-gradient-to-br from-[#081229] via-[#07101f] to-black p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
          When and how to use Pantavion SOS
        </p>

        <h1 className="mt-4 text-4xl font-bold md:text-6xl">
          SOS Scenario Guide
        </h1>

        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-200">
          Pantavion SOS should be prepared before risk, not only after danger.
          Use Guardian Mode before travel, driving, hunting, remote work,
          disaster exposure, sea routes, or unsafe regions. The first official
          layer is your trusted emergency circle. Public authorities and
          institutions require verified agreements before official dispatch.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {guardianUseCases.map((scenario) => (
            <article key={scenario.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-bold text-yellow-200">
                {scenario.title}
              </h2>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                When to use
              </p>
              <p className="mt-2 leading-7 text-slate-200">{scenario.whenToUse}</p>

              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                What Pantavion does
              </p>
              <p className="mt-2 leading-7 text-slate-200">{scenario.whatHappens}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-yellow-50">
          <p className="font-bold">User consent rule</p>
          <p className="mt-2 text-sm leading-6">
            The user must understand before activation: what data is stored,
            which contacts may receive SOS information, what runs locally,
            what requires permissions, what requires signal, and that official
            authority dispatch is not active without institutional agreements.
          </p>
        </div>
      </section>
    </main>
  );
}
