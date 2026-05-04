import Link from "next/link";

import { pantavionSosDispatchProviderTypes, pantavionSosDispatchProviderGates, pantavionSosDispatchNoFalseClaimRules } from "@/core/emergency/sos-provider-dispatch-contract";
import { pantavionSosProductCompletionPhases } from "@/core/emergency/sos-product-completion-roadmap";

export default function SosProvidersPage() {
  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-yellow-300/25 bg-[#091a31] p-8 shadow-2xl">
        <Link href="/sos/readiness" className="rounded-full border border-yellow-300/40 px-4 py-2 text-sm font-bold text-yellow-100">
          Back to SOS readiness
        </Link>

        <p className="mt-8 text-sm font-black uppercase tracking-[0.35em] text-yellow-200">
          SOS Provider Readiness
        </p>

        <h1 className="mt-4 text-4xl font-black md:text-6xl">
          Provider dispatch remains gated, auditable, and founder-approved.
        </h1>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-cyan-300/30 bg-cyan-950/30 p-5">
            <h2 className="text-2xl font-black text-cyan-100">Provider types</h2>
            <p className="mt-2 text-sm text-cyan-100/80">
              {pantavionSosDispatchProviderTypes.length} dispatch sources mapped.
            </p>
          </div>

          <div className="rounded-3xl border border-orange-300/30 bg-orange-950/30 p-5">
            <h2 className="text-2xl font-black text-orange-100">Activation gates</h2>
            <p className="mt-2 text-sm text-orange-100/80">
              {pantavionSosDispatchProviderGates.length} checks required before live providers.
            </p>
          </div>

          <div className="rounded-3xl border border-red-300/30 bg-red-950/40 p-5">
            <h2 className="text-2xl font-black text-red-100">No false claims</h2>
            <p className="mt-2 text-sm text-red-100/80">
              {pantavionSosDispatchNoFalseClaimRules.length} claim boundaries protected.
            </p>
          </div>

          <div className="rounded-3xl border border-green-300/30 bg-green-950/30 p-5">
            <h2 className="text-2xl font-black text-green-100">Roadmap phases</h2>
            <p className="mt-2 text-sm text-green-100/80">
              {pantavionSosProductCompletionPhases.length} product phases tracked.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
