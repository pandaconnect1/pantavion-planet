import Link from "next/link";

import { pantavionSosCompletionPillars } from "@/core/emergency/sos-completion-master-ledger";
import { pantavionSosProviderFamilies } from "@/core/emergency/sos-provider-readiness";
import { pantavionSosProtectedUserGroups } from "@/core/emergency/sos-protected-users-policy";
import { pantavionOffgridLocalTools } from "@/core/emergency/sos-offgrid-identity-pack";

export default function SosReadinessPage() {
  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-yellow-300/25 bg-[#091a31] p-8 shadow-2xl">
        <Link
          href="/sos"
          className="rounded-full border border-yellow-300/40 px-4 py-2 text-sm font-bold text-yellow-100"
        >
          Back to SOS
        </Link>

        <p className="mt-8 text-sm font-black uppercase tracking-[0.35em] text-yellow-200">
          Pantavion SOS Readiness
        </p>

        <h1 className="mt-4 text-4xl font-black md:text-6xl">
          SOS completion, provider readiness, and protected-user doctrine
        </h1>

        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-200">
          This page exposes the internal readiness contract for Red SOS, Orange
          translation/help, Green companion/journal, emergency circle, protected
          users, off-grid identity, providers, and admin safety operations.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-red-300/30 bg-red-950/40 p-5">
            <h2 className="text-2xl font-black text-red-100">SOS pillars</h2>
            <p className="mt-2 text-sm text-red-100/80">
              {pantavionSosCompletionPillars.length} completion pillars tracked.
            </p>
          </div>

          <div className="rounded-3xl border border-orange-300/30 bg-orange-950/30 p-5">
            <h2 className="text-2xl font-black text-orange-100">Providers</h2>
            <p className="mt-2 text-sm text-orange-100/80">
              {pantavionSosProviderFamilies.length} provider families remain gated.
            </p>
          </div>

          <div className="rounded-3xl border border-green-300/30 bg-green-950/30 p-5">
            <h2 className="text-2xl font-black text-green-100">Protected users</h2>
            <p className="mt-2 text-sm text-green-100/80">
              {pantavionSosProtectedUserGroups.length} protected-user contexts tracked.
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-300/30 bg-cyan-950/30 p-5">
            <h2 className="text-2xl font-black text-cyan-100">Off-grid tools</h2>
            <p className="mt-2 text-sm text-cyan-100/80">
              {pantavionOffgridLocalTools.length} offline/local tools mapped.
            </p>
          </div>
        </div>

        <p className="mt-8 rounded-3xl border border-yellow-300/30 bg-black/30 p-5 text-sm leading-7 text-yellow-100">
          Boundary: Pantavion SOS is provider-ready and locally useful, but official
          authority integrations, satellite-supported services, paid delivery
          providers, and medical/legal/financial escalation require approved providers,
          contracts, policies, and Founder OK.
        </p>
      </section>
    </main>
  );
}
