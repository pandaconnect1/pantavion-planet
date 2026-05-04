import Link from "next/link";

import { pantavionSosAdminReadinessQueueItems, pantavionSosAdminReadinessQueueRules } from "@/core/admin/sos-admin-readiness-queue";
import { pantavionSosGuardianLoop, pantavionSosGuardianMustWatch } from "@/core/emergency/sos-guardian-execution-bridge";

export default function SosAdminReadinessPage() {
  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-yellow-300/25 bg-[#091a31] p-8 shadow-2xl">
        <Link href="/sos/readiness" className="rounded-full border border-yellow-300/40 px-4 py-2 text-sm font-bold text-yellow-100">
          Back to SOS readiness
        </Link>

        <p className="mt-8 text-sm font-black uppercase tracking-[0.35em] text-yellow-200">
          SOS Admin Readiness
        </p>

        <h1 className="mt-4 text-4xl font-black md:text-6xl">
          Admin operations are blocked until auth, database, roles, logs, and policy exist.
        </h1>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-red-300/30 bg-red-950/40 p-5">
            <h2 className="text-2xl font-black text-red-100">Queue items</h2>
            <p className="mt-2 text-sm text-red-100/80">
              {pantavionSosAdminReadinessQueueItems.length} admin infrastructure items tracked.
            </p>
          </div>

          <div className="rounded-3xl border border-yellow-300/30 bg-yellow-950/30 p-5">
            <h2 className="text-2xl font-black text-yellow-100">Safety rules</h2>
            <p className="mt-2 text-sm text-yellow-100/80">
              {pantavionSosAdminReadinessQueueRules.length} admin boundaries protected.
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-300/30 bg-cyan-950/30 p-5">
            <h2 className="text-2xl font-black text-cyan-100">Guardian loop</h2>
            <p className="mt-2 text-sm text-cyan-100/80">
              {pantavionSosGuardianLoop.length} internal Guardian steps mapped.
            </p>
          </div>

          <div className="rounded-3xl border border-green-300/30 bg-green-950/30 p-5">
            <h2 className="text-2xl font-black text-green-100">Must-watch risks</h2>
            <p className="mt-2 text-sm text-green-100/80">
              {pantavionSosGuardianMustWatch.length} SOS risk categories tracked.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
