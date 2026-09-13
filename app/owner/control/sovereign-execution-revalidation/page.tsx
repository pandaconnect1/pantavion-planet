import { redirect } from "next/navigation";

import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";
import { createClient } from "@/lib/supabase/server";
import SovereignExecutionRevalidationClient from "./revalidation-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SovereignExecutionRevalidationPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/login?next=/owner/control/sovereign-execution-revalidation");

  try {
    requireFounderIdentity(auth.user.id);
  } catch {
    redirect("/");
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") {
    redirect("/owner/safety/verify?next=/owner/control/sovereign-execution-revalidation");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <a href="/owner/control" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">
          ← Owner Control
        </a>
        <div className="my-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Founder Control · AAL2 Protected
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
            Sovereign Execution Revalidation
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            Επαναληπτικός fail-closed έλεγχος owner admission, receipt chain, capability scope,
            budget, expiry, revocation και offline replay ακριβώς πριν από εκτέλεση.
            Η οθόνη δεν ξεκινά execution, agent ή edge handoff.
          </p>
        </div>
        <SovereignExecutionRevalidationClient />
      </section>
    </main>
  );
}
