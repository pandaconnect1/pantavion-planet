import Link from "next/link";
import type { Metadata } from "next";
import {
  PANTAVION_CAPABILITY_DOMAIN_ORDER,
  PANTAVION_UNIVERSAL_LIFE_CAPABILITIES,
  type PantavionCapabilityStatus
} from "@/core/product/pantavion-universal-life-capabilities";

export const metadata: Metadata = {
  title: "Universal Life Hub",
  description:
    "Pantavion Universal Life Hub brings Pantavion One DNA into Pantavion Planet as a real canonical capability system.",
  alternates: {
    canonical: "/universal-life"
  }
};

const statusLabel: Record<PantavionCapabilityStatus, string> = {
  live: "Live",
  beta: "Beta",
  foundation: "Foundation",
  planned: "Planned",
  legal_provider_required: "Legal / Provider Required"
};

const groups = PANTAVION_CAPABILITY_DOMAIN_ORDER.map((domain) => ({
  domain,
  capabilities: PANTAVION_UNIVERSAL_LIFE_CAPABILITIES.filter(
    (capability) => capability.domain === domain
  )
})).filter((group) => group.capabilities.length > 0);

export default function UniversalLifePage() {
  return (
    <main className="min-h-screen bg-[#06111f] text-slate-50">
      <section className="border-b border-amber-400/20 bg-[radial-gradient(circle_at_top,_rgba(245,190,82,0.16),_transparent_40%),linear-gradient(180deg,#071a2d,#06111f)]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
          <p className="mb-4 inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-amber-200">
            Pantavion Planet Canonical Product Layer
          </p>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
            Universal Life Hub
          </h1>

          <p className="mt-5 max-w-4xl text-base leading-8 text-slate-300 sm:text-lg">
            All useful Pantavion One concepts are now retained inside Pantavion Planet as real
            canonical capabilities. Nothing is abandoned. Static ideas become implementation
            requirements, routes, providers, safety gates and real product work.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300"
            >
              Back to Pantavion
            </Link>
            <Link
              href="/product-status"
              className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 hover:border-amber-300 hover:text-amber-200"
            >
              Product Status
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="rounded-3xl border border-amber-400/20 bg-slate-950/70 p-5 sm:p-7">
          <h2 className="text-2xl font-black text-white">No fake feature law</h2>
          <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-300">
            A capability may be visible only when it has a real route, real state/data flow,
            real execution logic, or a clear limited status. Planned and legal-gated capabilities
            remain part of the product constitution but are not pretended to be complete.
          </p>
        </div>

        <div className="mt-10 space-y-10">
          {groups.map((group) => (
            <section key={group.domain}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
                    Domain
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-white">{group.domain}</h2>
                </div>
                <p className="text-sm text-slate-400">
                  {group.capabilities.length} capabilities
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {group.capabilities.map((capability) => (
                  <article
                    key={capability.id}
                    className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl shadow-black/20"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{capability.title}</h3>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          Source: {capability.source}
                        </p>
                      </div>

                      <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">
                        {statusLabel[capability.status]}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {capability.principle}
                    </p>

                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">
                        Required real implementation
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {capability.realImplementationRequired}
                      </p>
                    </div>

                    {capability.safetyNote ? (
                      <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">
                          Safety boundary
                        </p>
                        <p className="mt-2 text-sm leading-6 text-rose-100">
                          {capability.safetyNote}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-5">
                      {capability.route ? (
                        <Link
                          href={capability.route}
                          className="inline-flex rounded-full border border-amber-400/50 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-400 hover:text-slate-950"
                        >
                          Open real route
                        </Link>
                      ) : (
                        <span className="inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400">
                          Retained for real implementation
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
