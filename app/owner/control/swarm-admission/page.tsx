import { redirect } from "next/navigation";

import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";
import { createClient } from "@/lib/supabase/server";
import FounderSwarmAdmissionClient from "./swarm-admission-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FounderSwarmAdmissionPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/login?next=/owner/control/swarm-admission");
  try { requireFounderIdentity(auth.user.id); } catch { redirect("/"); }
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") redirect("/owner/safety/verify?next=/owner/control/swarm-admission");

  return <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-8">
    <section className="mx-auto max-w-7xl">
      <a href="/owner/control" className="text-sm font-bold text-cyan-300">← Owner Control</a>
      <div className="my-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Founder Control · AAL2 Protected</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">Ephemeral Agent Swarm Admission</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">Αξιολόγηση αριθμού agents, ρόλων, scope, διάρκειας και budget. Δεν δημιουργεί, δεν ενεργοποιεί και δεν εκτελεί agents.</p>
      </div>
      <FounderSwarmAdmissionClient />
    </section>
  </main>;
}
