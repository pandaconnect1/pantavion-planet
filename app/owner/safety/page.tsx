import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SafetyControlClient from "./safety-control-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SafetyCase = {
  id: string;
  subject_user_id: string;
  case_kind: string;
  severity: string;
  sensitivity: string;
  case_state: string;
  reason_summary: string;
  opened_at: string;
};

export default async function OwnerSafetyPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/login?next=/owner/safety");

  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") {
    redirect("/owner/safety/verify?next=/owner/safety");
  }

  const [{ data: founder }, { data: operator }, { data: cases, error: casesError }] = await Promise.all([
    supabase.rpc("pantavion_is_active_founder"),
    supabase.rpc("pantavion_is_active_trust_safety_operator"),
    supabase.rpc("pantavion_list_trust_safety_cases", { p_limit: 100 }),
  ]);

  const allowed = Boolean(founder || operator);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Pantavion Owner Control Plane</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Trust & Safety Command Center</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Privileged reviews are case-based, AAL2-protected and audited. Opening a dossier records the actor, case, scope, purpose and timestamp.
          </p>
        </div>

        {!allowed ? (
          <div className="mt-6 rounded-3xl border border-amber-700/50 bg-amber-950/30 p-6 text-sm text-amber-100">
            This account is authenticated but does not currently hold an active Founder or Trust & Safety operator role. No case data is exposed.
          </div>
        ) : (
          <SafetyControlClient
            initialCases={(cases ?? []) as SafetyCase[]}
            founder={Boolean(founder)}
            initialError={casesError?.message ?? null}
          />
        )}
      </section>
    </main>
  );
}
