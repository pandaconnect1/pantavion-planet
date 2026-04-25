import Link from "next/link";

export const metadata = {
  title: "Pantavion Signal Map | Pantavion One",
  description:
    "Structured market signals transformed into original Pantavion capability families, modules and execution priorities.",
};

const signals = [
  {
    tag: "voice",
    title: "Voice-Native Execution",
    pattern: "Voice agents, real-time interaction, interruption handling and full-duplex communication.",
    userNeeds: ["speak naturally", "interrupt safely", "translate live", "execute by voice"],
    modules: ["Voice Kernel", "Streaming Execution", "Language Bridge", "Real-Time Security"],
    candidates: ["voice command surface", "live translation rooms", "call handling workspace"],
  },
  {
    tag: "kernel",
    title: "Sovereign Kernel Control",
    pattern: "Self-monitoring, self-repair, routing, resilience, reporting and continuous upgrade.",
    userNeeds: ["system stays live", "fast response", "no broken routes", "clear founder reports"],
    modules: ["Prime Kernel", "Continuity Mesh", "Capability Registry", "Health Monitor"],
    candidates: ["kernel run room", "system audit console", "repair queue", "release guardian"],
  },
  {
    tag: "work",
    title: "Work Acceleration",
    pattern: "Documents, charts, email, meetings, strategy, dashboards and business execution.",
    userNeeds: ["finish work faster", "write documents", "analyze data", "prepare presentations"],
    modules: ["Work Studio", "Data Intelligence", "Meeting Intelligence", "Document Engine"],
    candidates: ["brief generator", "spreadsheet insight route", "meeting recap route"],
  },
  {
    tag: "build",
    title: "AI App Building",
    pattern: "App generation, prototyping, deployment, code assistance and secure production ops.",
    userNeeds: ["build apps", "prototype fast", "ship safely", "manage deployments"],
    modules: ["Build Studio", "Dev Academy", "Secure Ops Agent", "Provider Router"],
    candidates: ["app blueprint builder", "route generator", "deployment checklist"],
  },
  {
    tag: "creator",
    title: "Media and Creator Systems",
    pattern: "Image, video, music, short-form, newsletters, podcasts and brand asset creation.",
    userNeeds: ["create content", "edit video", "generate assets", "grow audience"],
    modules: ["Media Universe", "Creator Studio", "Brand Voice", "Copyright Guardrails"],
    candidates: ["short video planner", "asset studio", "content calendar"],
  },
  {
    tag: "research",
    title: "Research and Source Atlas",
    pattern: "Academic, public-domain, policy, business, technical and open knowledge sources.",
    userNeeds: ["find reliable sources", "cite properly", "learn deeply", "avoid misinformation"],
    modules: ["PantaResearch Library", "Source Reliability", "Citation Layer", "Learning Academy"],
    candidates: ["source atlas", "research brief builder", "license-aware library"],
  },
  {
    tag: "income",
    title: "Learning-to-Income Paths",
    pattern: "Freelancing, services, digital products, marketplaces, business formation and monetization.",
    userNeeds: ["earn legally", "package services", "find clients", "avoid false income claims"],
    modules: ["Services Marketplace", "Income Safety Policy", "Proposal Studio", "Business Builder"],
    candidates: ["service offer builder", "client pipeline", "legal income disclaimers"],
  },
  {
    tag: "finance",
    title: "Finance and Trading Safety",
    pattern: "Trading signals, investing content, crypto data and financial education require strict guardrails.",
    userNeeds: ["understand risk", "track numbers", "avoid scams", "no fake guarantees"],
    modules: ["Finance Guardrails", "Risk Classification", "Anti-Scam Layer", "Education Routes"],
    candidates: ["risk notice layer", "finance education hub", "claim checker"],
  },
  {
    tag: "security",
    title: "Security, Identity and Trust",
    pattern: "Voice impersonation, prompt injection, minors protection, consent, privacy and legal escalation.",
    userNeeds: ["safe identity", "reports", "privacy", "trusted communication"],
    modules: ["Trust Center", "Identity Layer", "Report System", "Consent Engine"],
    candidates: ["safety center", "age gate", "report form", "consent checklist"],
  },
];

const filters = ["all", "voice", "kernel", "work", "build", "creator", "research", "income", "finance", "security"];

export default function SignalsPage() {
  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#e8b94f]">
              Pantavion Signal Map
            </p>
            <h1 className="mt-4 max-w-5xl text-5xl font-black leading-none md:text-7xl">
              Market noise becomes governed Pantavion capability intelligence.
            </h1>
          </div>

          <Link
            href="/kernel/run"
            className="rounded-full bg-[#e8b94f] px-5 py-3 font-black text-black"
          >
            Back to Kernel
          </Link>
        </div>

        <p className="max-w-5xl text-lg leading-8 text-slate-200 md:text-xl">
          These signals are not copied from social media posts. They are
          converted into original Pantavion architecture: capability families,
          legal guardrails, module targets, provider opportunities and execution
          priorities.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <a
              key={filter}
              href={filter === "all" ? "#signals" : `#${filter}`}
              className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
            >
              {filter}
            </a>
          ))}
        </div>

        <section id="signals" className="mt-10 grid gap-5">
          {signals.map((signal) => (
            <article
              id={signal.tag}
              key={signal.title}
              className="scroll-mt-28 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 md:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    {signal.tag}
                  </span>
                  <h2 className="mt-5 text-3xl font-black md:text-4xl">
                    {signal.title}
                  </h2>
                </div>
                <span className="rounded-full border border-[#e8b94f]/40 px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#f4d37a]">
                  Structured Signal
                </span>
              </div>

              <p className="mt-5 text-lg leading-8 text-slate-200">
                {signal.pattern}
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <SignalList title="User Needs" items={signal.userNeeds} />
                <SignalList title="Module Targets" items={signal.modules} />
                <SignalList title="Native Candidates" items={signal.candidates} />
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-[#e8b94f]/25 bg-black/30 p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#e8b94f]">
            Legal Adaptation Rule
          </p>
          <h2 className="mt-4 text-3xl font-black md:text-5xl">
            We absorb patterns. We do not copy brands, claims, logos or layouts.
          </h2>
          <p className="mt-5 max-w-5xl leading-8 text-slate-300">
            Pantavion uses outside material only as market intelligence. Every
            live feature must become a Pantavion-owned workflow with its own
            language, structure, governance, safety policy and implementation.
          </p>
        </section>
      </section>
    </main>
  );
}

function SignalList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#e8b94f]">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="rounded-xl bg-white/[0.04] px-4 py-3 text-slate-200">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
