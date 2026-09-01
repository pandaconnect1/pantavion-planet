import { redirect } from "next/navigation";

import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";
import { createClient } from "@/lib/supabase/server";

import IntentWorkbenchClient from "./intent-workbench-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FounderIntentWorkbenchPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/login?next=/owner/control/intent-workbench");

  try {
    requireFounderIdentity(auth.user.id);
  } catch {
    redirect("/");
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") {
    redirect("/owner/safety/verify?next=/owner/control/intent-workbench");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Founder-only · AAL2 · Offline</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Pantavion Intent Workbench</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            Πραγματική καταγραφή, κρυπτογραφημένη αποθήκευση, εξαγωγή και επαλήθευση Founder intents μέσα στη συσκευή. Κάθε εγγραφή έχει canonical payload και SHA-256, ενώ το τοπικό vault προστατεύεται με PBKDF2 και AES-GCM-256. Λειτουργεί χωρίς δίκτυο και δεν αποκτά αυτόματα δικαίωμα merge, deployment ή production write.
          </p>
        </div>
        <IntentWorkbenchClient />
      </section>
    </main>
  );
}
