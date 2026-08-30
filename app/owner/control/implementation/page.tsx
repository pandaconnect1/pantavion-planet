import { redirect } from "next/navigation";

import {
  implementationSyncDoctrine,
  sovereignFactoryImplementationItems,
  synchronizeImplementationItems,
} from "@/core/pantavion/implementation-sync-registry";
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

        <div className="mt-6 text-xs text-slate-500">
          Founder identity and AAL2 MFA are checked server-side on every request. This surface applies the canonical release policy but does not itself authorize merge, deployment or public exposure.
        </div>
      </div>
    </main>
  );
}
