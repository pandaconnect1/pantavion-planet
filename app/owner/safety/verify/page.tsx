import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OwnerSafetyVerifyClient from "./verify-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{ next?: string | string[] }>;

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/owner/safety";
  return value;
}

export default async function OwnerSafetyVerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const nextPath = safeNextPath(firstParam(params.next));
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    const verifyReturn = `/owner/safety/verify?next=${encodeURIComponent(nextPath)}`;
    redirect(`/auth/login?next=${encodeURIComponent(verifyReturn)}`);
  }

  const [{ data: founder }, { data: operator }, { data: assurance }] = await Promise.all([
    supabase.rpc("pantavion_is_active_founder"),
    supabase.rpc("pantavion_is_active_trust_safety_operator"),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  if (!founder && !operator) redirect("/owner/safety");
  if (assurance?.currentLevel === "aal2") redirect(nextPath);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-8">
      <section className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/90 p-6 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Pantavion Owner Security</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Step-up verification required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Sensitive founder controls stay locked until this session reaches Authenticator Assurance Level 2.
          </p>
          <OwnerSafetyVerifyClient nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}
