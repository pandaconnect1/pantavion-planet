import { redirect } from "next/navigation";

import {
  implementationSyncDoctrine,
  sovereignFactoryImplementationItems,
  synchronizeImplementationItems,
} from "@/core/pantavion/implementation-sync-registry";
import {
  sovereignVerificationDoctrine,
  sovereignVerificationRecords,
  sovereignVerificationSnapshotAt,
  validateSovereignVerificationCatalog,
} from "@/core/pantavion/sovereign-verification-catalog";
import {
  defaultOwnerReleasePolicy,
  evaluateOwnerReleaseGate,
  ownerReleaseDoctrine,
} from "@/core/pantavion/owner-release-gate";
import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const stateStyles: Record<string, string> = {
  coded: "text-cyan-300",
  tested: "text-emerald-300",
  merged: "text-indigo-300",
  deployed: "text-amber-300",
  verified_live: "text-green-300",
  blocked: "text-rose-300",
};

export default async function OwnerImplementationPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/login?next=/owner/control/implementation");

  try {
    requireFounderIdentity(auth.user.id);
  } catch {
    redirect("/");
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") {
    redirect("/owner/safety/verify?next=/owner/control/implementation");
  }

  const catalogBlockers = validateSovereignVerificationCatalog();
  const verifiedPrRecords = catalogBlockers.length ? [] : sovereignVerificationRecords;

  const currentItems = synchronizeImplementationItems(sovereignFactoryImplementationItems).map((item) => ({
    ...item,
    release: evaluateOwnerReleaseGate(
      item,
      {
        audience: "founder_only",
        ownerApprovedForUsers: false,
      },
      defaultOwnerReleasePolicy,
    ),
  }));

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
          Founder Control · Private Truth Surface
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Pantavion Implementation Truth</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
          {implementationSyncDoctrine.rule}
        </p>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">Truth chain</div>
          <div className="mt-2 text-sm font-medium text-slate-100">
            IDEA → CODED → TESTED → MERGED → DEPLOYED → VERIFIED_LIVE → OWNER_OK_FOR_USERS
          </div>
          <div className="mt-2 text-xs leading-5 text-slate-400">
            {implementationSyncDoctrine.releaseRule}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-wider text-slate-400">Canonical release policy</div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-cyan-300">
              v{defaultOwnerReleasePolicy.version} · FOUNDER ONLY
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{ownerReleaseDoctrine.rule}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{ownerReleaseDoctrine.evolutionRule}</p>
        </div>

        <section className="mt-6 grid gap-3">
          {currentItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-medium text-slate-100">{item.title}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold ${stateStyles[item.state] ?? "text-slate-300"}`}>
                    {item.state.toUpperCase()}
                  </span>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-amber-300">
                    {item.release.audience.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-400">Canonical source: {item.source}</p>
              <p className="mt-1 text-xs text-slate-500">Release policy v{item.release.policyVersion} · users remain locked</p>
              {item.blocker ? <p className="mt-2 text-sm leading-6 text-rose-300">{item.blocker}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {(item.evidenceRecords ?? []).map((evidence) => (
                  <span key={`${evidence.kind}:${evidence.reference}`} className="rounded-lg bg-slate-950 px-2 py-1 text-xs text-slate-400">
                    {evidence.kind}: {evidence.reference}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-cyan-900/70 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Exact-head Sovereign verification catalog</p>
              <h2 className="mt-2 text-xl font-semibold">Open PR evidence — όχι production</h2>
            </div>
            <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-200">
              OPEN_PR ≠ MERGED ≠ DEPLOYED
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{sovereignVerificationDoctrine.rule}</p>
          <p className="mt-2 text-xs text-slate-500">Snapshot: {sovereignVerificationSnapshotAt}</p>

          {catalogBlockers.length ? (
            <div role="alert" className="mt-4 rounded-xl border border-rose-500/60 bg-rose-500/10 p-4 text-sm text-rose-100">
              Catalog hidden fail-closed: {catalogBlockers.join(", ")}
            </div>
          ) : (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {verifiedPrRecords.map((record) => (
                <article key={record.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-100">{record.title}</h3>
                    <div className="flex gap-2">
                      <span className="rounded-full border border-emerald-500/50 px-2 py-1 text-xs font-black text-emerald-300">{record.stage}</span>
                      <span className="rounded-full border border-amber-500/50 px-2 py-1 text-xs font-black text-amber-300">{record.truthLocation}</span>
                      {record.researchQuality ? <span className={`rounded-full border px-2 py-1 text-xs font-black ${record.researchQuality === "BLOCKED" ? "border-rose-500/50 text-rose-300" : "border-cyan-500/50 text-cyan-300"}`}>RESEARCH {record.researchQuality}</span> : null}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{record.domain} · {record.workflowCount}/{record.workflowCount} workflows successful</p>
                  <div className="mt-3 space-y-1 break-all font-mono text-[11px] text-slate-500">
                    <p>PR #{record.pr} · {record.exactHead}</p>
                    <p>receipt #{record.verificationReceipt}{record.evidenceArtifact ? ` · artifact ${record.evidenceArtifact}` : ""}</p>
                    {record.parentPr ? <p>parent PR #{record.parentPr} · {record.parentExactHead}</p> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <a className="font-bold text-cyan-300 underline-offset-4 hover:underline" href={`https://github.com/pandaconnect1/pantavion-planet/pull/${record.pr}`} rel="noreferrer" target="_blank">Open exact PR evidence</a>
                    <span className="text-slate-400">Next: {record.nextTransition}</span>
                  </div>
                  {record.qualityBlocker ? <p role="alert" className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-xs leading-5 text-rose-200">{record.qualityBlocker}</p> : null}
                  <p className="mt-2 text-xs font-semibold text-rose-300">Merged: false · Deployed: false · Verified live: false · Execution: false</p>
                </article>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-slate-500">{sovereignVerificationDoctrine.releaseRule}</p>
        </section>

        <div className="mt-6 text-xs text-slate-500">
          Founder identity and AAL2 MFA are checked server-side on every request. This surface applies the canonical release policy but does not itself authorize merge, deployment or public exposure.
        </div>
      </div>
    </main>
  );
}
