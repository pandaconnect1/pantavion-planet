import Link from "next/link";

export const metadata = {
  title: "Pantavion Kernel Run | Pantavion One",
  description:
    "Pantavion sovereign kernel control room for orchestration, resilience, security, routing and execution.",
};

const kernelLayers = [
  {
    title: "Prime Kernel",
    label: "Sovereign Control",
    body:
      "Central command layer for identity, intent, routing, memory, safety, resilience and execution coordination.",
  },
  {
    title: "Streaming Execution",
    label: "Real Time",
    body:
      "Designed for low-latency action paths, partial outputs, interruption handling and continuous context updates.",
  },
  {
    title: "Continuity Mesh",
    label: "Self-Repair",
    body:
      "Redundancy, retry, health checks, degraded-mode continuity and recovery paths before failure reaches the user.",
  },
  {
    title: "Capability Registry",
    label: "Organized Power",
    body:
      "Every capability is registered by purpose, risk, provider requirement, cost profile and execution status.",
  },
  {
    title: "Security Spine",
    label: "Always On",
    body:
      "Policy, age-gates, reports, legal routes, consent checks, prompt-risk controls and future voice threat detection.",
  },
  {
    title: "Founder Signal Loop",
    label: "Reports",
    body:
      "The system records what changed, what was repaired, what needs connection and what requires founder approval.",
  },
];

const runtimeChecks = [
  "Route is live and does not depend on unstable browser-only imports.",
  "Visible controls route to real surfaces or clearly marked foundation states.",
  "Kernel language rejects fake completion: foundation, connected and regulated layers are separated.",
  "Market signals are converted into original Pantavion capability families, not copied assets.",
  "Speed doctrine stays first: lightweight pages, no unnecessary client logic, no decorative heavy runtime.",
];

const commandFlow = [
  "User intent",
  "Kernel classification",
  "Capability match",
  "Risk and policy check",
  "Execution route",
  "Result, memory and report",
];

export default function KernelRunPage() {
  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="rounded-[2rem] border border-cyan-400/20 bg-black/30 p-6 shadow-2xl shadow-cyan-950/30 md:p-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#e8b94f]">
                Pantavion Kernel Run
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl font-black leading-none md:text-7xl">
                The sovereign control room for the whole ecosystem.
              </h1>
            </div>

            <Link
              href="/"
              className="rounded-full border border-[#e8b94f]/60 px-5 py-3 text-sm font-bold text-[#f4d37a] transition hover:bg-[#e8b94f] hover:text-black"
            >
              Back to Planet
            </Link>
          </div>

          <p className="max-w-4xl text-lg leading-8 text-slate-200 md:text-xl">
            The Kernel is not a weak fallback layer. It is the internal command
            system that monitors, routes, repairs, upgrades and coordinates
            Pantavion across people, language, media, work, safety, identity,
            AI execution and future voice-native operation.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {commandFlow.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Step {index + 1}
                </p>
                <p className="mt-3 text-xl font-black">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {kernelLayers.map((layer) => (
            <article
              key={layer.title}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20"
            >
              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                {layer.label}
              </span>
              <h2 className="mt-5 text-2xl font-black">{layer.title}</h2>
              <p className="mt-4 leading-7 text-slate-300">{layer.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-[#e8b94f]/25 bg-[#0b1320] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#e8b94f]">
            Live Stability Doctrine
          </p>
          <h2 className="mt-4 text-3xl font-black md:text-5xl">
            No dead surfaces. No fake execution. No browser crash.
          </h2>

          <div className="mt-8 grid gap-3">
            {runtimeChecks.map((check) => (
              <div
                key={check}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-slate-200"
              >
                {check}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signals"
              className="rounded-full bg-[#e8b94f] px-5 py-3 font-black text-black"
            >
              Open Signal Map
            </Link>
            <Link
              href="/intelligence/routing"
              className="rounded-full border border-cyan-400/50 px-5 py-3 font-black text-cyan-200"
            >
              Open PantaAI Routing
            </Link>
            <Link
              href="/security"
              className="rounded-full border border-white/20 px-5 py-3 font-black text-white"
            >
              Open Security
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
