import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listOwnerDecisionItems, requireFounderIdentity } from "@/lib/owner-control/decision-queue";
import OwnerControlClient from "./owner-control-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OwnerControlPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/login?next=/owner/control");

  try {
    requireFounderIdentity(auth.user.id);
  } catch {
    redirect("/");
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") {
    redirect("/owner/safety/verify?next=/owner/control");
  }

  const items = await listOwnerDecisionItems(auth.user.id);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Pantavion Owner Control Center</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Μία οθόνη για όλες τις αποφάσεις</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            Όλα τα ζητήματα που απαιτούν δική σου απόφαση συγκεντρώνονται εδώ. Το Pantavion συνεχίζει αυτόματα όπου επιτρέπεται και σταματά μόνο σε πραγματικό owner decision point.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/owner/control/intent-workbench"
              className="rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-100"
            >
              Intent Workbench · Offline
            </Link>
            <Link
              href="/owner/control/implementation"
              className="rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-100"
            >
              Implementation Truth · Founder only
            </Link>
          </div>
        </div>
        <OwnerControlClient initialItems={items} />
      </section>
    </main>
  );
}
