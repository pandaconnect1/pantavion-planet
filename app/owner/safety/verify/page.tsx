import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OwnerSafetyVerifyClient from "./verify-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OwnerSafetyVerifyPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/login?next=/owner/safety");

  const [{ data: founder }, { data: operator }, { data: assurance }] = await Promise.all([
    supabase.rpc("pantavion_is_active_founder"),
    supabase.rpc("pantavion_is_active_trust_safety_operator"),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  if (!founder && !operator) redirect("/owner/safety");
  if (assurance?.currentLevel === "aal2") redirect("/owner/safety");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-8">
      <section className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/90 p-6 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Pantavion Owner Security</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Step-up verification required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Sensitive Trust & Safety case data is unavailable until this session reaches Authenticator Assurance Level 2.
          </p>
          <OwnerSafetyVerifyClient />
        </div>
      </section>
    </main>
  );
}
