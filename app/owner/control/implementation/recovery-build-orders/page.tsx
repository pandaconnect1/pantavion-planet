import Link from "next/link";
import { redirect } from "next/navigation";

import buildOrderIndex from "@/data/recovery/sovereign-build-order-index-v1.json";
import buildReadinessIndex from "@/data/recovery/sovereign-build-readiness-index-v1.json";
import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function shortDigest(value: string) {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

export default async function OwnerRecoveryBuildOrdersPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    redirect("/auth/login?next=/owner/control/implementation/recovery-build-orders");
  }

  try {
    requireFounderIdentity(auth.user.id);
  } catch {
    redirect("/");
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") {
    redirect("/owner/safety/verify?next=/owner/control/implementation/recovery-build-orders");
  }

  const readinessByOrderId = new Map<
    string,
    (typeof buildReadinessIndex.packets)[number]
  >(buildReadinessIndex.packets.map((packet) => [packet.buildOrderId, packet]));

  const moduleGroups = buildOrderIndex.moduleSummary.map((summary) => ({
    ...summary,
    orders: buildOrderIndex.orders
      .filter((order) => order.route.module === summary.module)
      .map((order) => {
        const readiness = readinessByOrderId.get(order.buildOrderId);
        if (!readiness) throw new Error("missing_recovery_build_readiness_packet");
        return { ...order, readiness };
      }),
  }));

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl sm:p-7">
        <Link
          href="/owner/control/implementation"
          className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
        >
          ← Implementation Truth
        </Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
          Founder Control · Recovery Factory
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Sovereign Build Orders</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
          All {buildOrderIndex.corpus.sourceRecordCount.toLocaleString()} preserved recovery records are represented here through {buildOrderIndex.totals.canonicalBuildOrderCount} canonical build orders. Classified candidates remain IDEA and AWAITING_OWNER; HOLD and recursive/provenance material stays preserved outside execution authority.
        </p>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Records", buildOrderIndex.corpus.sourceRecordCount],
            ["Classified candidates", buildOrderIndex.corpus.classifiedCandidateCount],
            ["Build orders", buildOrderIndex.totals.canonicalBuildOrderCount],
            ["Awaiting owner", buildOrderIndex.totals.awaitingOwnerCount],
            ["Execution ready", buildOrderIndex.totals.executionReadyCount],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-100">
                {Number(value).toLocaleString()}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Critical risk orders", buildReadinessIndex.totals.riskCounts.critical ?? 0],
            ["High risk orders", buildReadinessIndex.totals.riskCounts.high ?? 0],
            ["Technology HOLD", buildReadinessIndex.totals.technologyHoldCount],
            ["Edge eligible", buildReadinessIndex.totals.edgeEligibleCount],
            ["Agent grants", buildReadinessIndex.totals.agentGrantIssuedCount],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
              <div className="mt-2 text-xl font-semibold text-slate-100">
                {Number(value).toLocaleString()}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">Governed HOLD</div>
            <div className="mt-2 text-xl font-semibold text-amber-300">
              {buildOrderIndex.corpus.governedHoldCount.toLocaleString()}
            </div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">Recursive / provenance</div>
            <div className="mt-2 text-xl font-semibold text-amber-300">
              {buildOrderIndex.corpus.recursiveProvenanceCount.toLocaleString()}
            </div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">Agent grants issued</div>
            <div className="mt-2 text-xl font-semibold text-emerald-300">
              {buildOrderIndex.totals.agentGrantIssuedCount.toLocaleString()}
            </div>
          </article>
        </section>

        <div className="mt-5 rounded-2xl border border-rose-900/70 bg-rose-950/20 p-4 text-sm leading-6 text-rose-200">
          Authority remains fail-closed: code mutation, execution, production writes, merge, deployment, public exposure and release are all false. This page is evidence and review only.
        </div>

        <section className="mt-6 space-y-3">
          {moduleGroups.map((group) => (
            <details key={group.module} className="rounded-2xl border border-slate-800 bg-slate-900/50">
              <summary className="cursor-pointer list-none p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-medium text-slate-100">{group.module}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {group.buildOrderCount} orders · {group.memberCount.toLocaleString()} classified members
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-800 px-3 py-1 text-xs font-semibold text-amber-300">
                    AWAITING OWNER
                  </span>
                </div>
              </summary>
              <div className="border-t border-slate-800 p-3 sm:p-4">
                <div className="grid gap-3">
                  {group.orders.map((order) => (
                    <article key={order.buildOrderId} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-500">Order #{order.buildOrderOrdinal}</div>
                          <h3 className="mt-1 font-medium text-slate-100">
                            {order.route.subsystem} · {order.route.capability}
                          </h3>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {order.route.feature ?? order.route.canonicalTarget}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-cyan-300">
                            {order.implementationState}
                          </span>
                          <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-amber-300">
                            {order.membership.memberCount.toLocaleString()} members
                          </span>
                        </div>
                      </div>
                      <dl className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                        <div>
                          <dt className="text-slate-600">Build order</dt>
                          <dd className="mt-1 font-mono">{shortDigest(order.buildOrderId.replace("recovery_build_order_", ""))}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-600">Receipt</dt>
                          <dd className="mt-1 font-mono">{shortDigest(order.buildOrderDigest)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-600">Ordinal boundary</dt>
                          <dd className="mt-1">
                            {order.membership.firstGlobalOrdinal.toLocaleString()} → {order.membership.lastGlobalOrdinal.toLocaleString()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-600">Technology readiness</dt>
                          <dd className="mt-1 uppercase">{order.readiness.technology.assessment.readiness}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-600">Risk / data class</dt>
                          <dd className="mt-1 uppercase">
                            {order.readiness.risk.level} · {order.readiness.data.classes.join(", ")}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-600">Ephemeral agent request</dt>
                          <dd className="mt-1 uppercase">
                            {order.readiness.agent.primaryRole} · budget {order.readiness.agent.requestedBudgetLimit}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-600">Disconnected / edge</dt>
                          <dd className="mt-1 uppercase">
                            {order.readiness.disconnectedEdge.disposition} · {order.readiness.disconnectedEdge.networkPolicy.replaceAll("_", " ")}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-3 rounded-lg border border-amber-950 bg-amber-950/20 p-3 text-xs leading-5 text-amber-200">
                        Technology blockers: {order.readiness.technology.assessment.blockers.join(" · ")}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs leading-6 text-slate-400">
          <div>Exact dispatch revision: {buildOrderIndex.source.headRevision}</div>
          <div>Artifact: {buildOrderIndex.source.artifactId} · SHA-256 {buildOrderIndex.source.artifactArchiveSha256}</div>
          <div>Build-order index digest: {buildOrderIndex.indexDigest}</div>
          <div>Readiness index digest: {buildReadinessIndex.indexDigest}</div>
          <div>Readiness terminal receipt: {buildReadinessIndex.terminalReadinessDigest}</div>
          <div className="mt-2">
            Founder identity and AAL2 MFA are checked server-side on every request. Review does not create an approval, grant or execution receipt.
          </div>
        </section>
      </div>
    </main>
  );
}
