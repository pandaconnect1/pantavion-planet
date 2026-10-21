import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgentOperationsPage() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) redirect("/auth/login?next=/owner/control/agent-operations");
  try { requireFounderIdentity(user.id); } catch { redirect("/"); }
  const { data: assurance, error: mfaError } = await session.auth.mfa.getAuthenticatorAssuranceLevel();
  if (mfaError || assurance?.currentLevel !== "aal2") redirect("/owner/safety/verify?next=/owner/control/agent-operations");

  // Privileged queries execute only after authenticated founder + aal2 verification.
  // Admin credentials stay server-side; neither service-role keys nor arbitrary SQL reach the browser.
  const admin = createAdminClient();
  const [jobs, alerts] = await Promise.all([
    admin.from("pantavion_agent_jobs")
      .select("id,kernel_id,role,status,attempts,created_at,updated_at,last_error,artifact_refs,evidence_refs", { count: "exact" })
      .neq("kernel_id", "water")
      .order("created_at", { ascending: false }).limit(30),
    admin.from("pantavion_founder_alerts")
      .select("id,kernel_id,severity,status,title,created_at", { count: "exact" })
      .neq("kernel_id", "water")
      .order("created_at", { ascending: false }).limit(30),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-5xl space-y-6">
        <a href="/owner/control" className="text-cyan-300 underline">← Owner Control</a>
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Founder only · MFA verified</p>
          <h1 className="mt-2 text-3xl font-black">Pantavion AI Operations</h1>
          <p className="mt-2 text-sm text-slate-300">Πραγματικές εγγραφές από την παραγωγική βάση. Εμφανίζονται οι 30 πιο πρόσφατες ανά ενότητα. Δεν περιλαμβάνεται το Water.</p>
        </header>
        <section className="rounded-2xl border border-slate-700 p-5">
          <h2 className="text-xl font-bold">Ανεξάρτητες εργασίες AI</h2>
          {jobs.error ? <p role="alert" className="mt-3 text-amber-300">Αποτυχία ανάγνωσης εργασιών. Δεν εμφανίζεται πλασματικός αριθμός.</p> :
            <>
              <p className="mt-2 text-sm text-slate-300">Σύνολο εγγραφών: {jobs.count ?? "άγνωστο"}</p>
              <div className="mt-4 space-y-3">{(jobs.data ?? []).map(j =>
                <article key={j.id} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                  <p className="font-semibold">{j.kernel_id} · {j.role} · {j.status}</p>
                  <p className="mt-1 text-xs text-slate-400">Attempts: {j.attempts} · Updated: {j.updated_at}</p>
                  {j.last_error && <p className="mt-1 text-sm text-amber-300">Σφάλμα: {j.last_error}</p>}
                  {Array.isArray(j.artifact_refs) && j.artifact_refs.map((artifact, index) => {
                    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) return null;
                    const record = artifact as Record<string, unknown>;
                    return <div key={index} className="mt-3 rounded-lg border border-slate-600 bg-slate-950 p-3">
                      <p className="text-xs font-semibold text-cyan-300">Παραδοτέο AI #{index + 1}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm">{typeof record.text === "string" ? record.text.slice(0, 16000) : "Υπάρχει καταχώριση παραδοτέου χωρίς κείμενο."}</p>
                    </div>;
                  })}
                  {Array.isArray(j.evidence_refs) && <p className="mt-2 text-xs text-slate-400">Καταχωρίσεις τεκμηρίωσης: {j.evidence_refs.length}</p>}
                </article>)}</div>
              {(jobs.data ?? []).length === 0 && <p className="mt-3 text-sm text-amber-300">Δεν βρέθηκαν εργασίες εκτός Water στις τελευταίες 30 εγγραφές.</p>}
            </>}
        </section>
        <section className="rounded-2xl border border-slate-700 p-5">
          <h2 className="text-xl font-bold">Founder Alerts</h2>
          {alerts.error ? <p role="alert" className="mt-3 text-amber-300">Αποτυχία ανάγνωσης ειδοποιήσεων.</p> :
            <>
              <p className="mt-2 text-sm text-slate-300">Σύνολο εγγραφών: {alerts.count ?? "άγνωστο"}</p>
              <div className="mt-4 space-y-3">{(alerts.data ?? []).map(a =>
                <article key={a.id} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{a.kernel_id} · {a.severity} · {a.status}</p>
                  <p className="mt-1 text-xs text-slate-400">{a.created_at}</p>
                </article>)}</div>
              {(alerts.data ?? []).length === 0 && <p className="mt-3 text-sm text-amber-300">Δεν βρέθηκαν ειδοποιήσεις εκτός Water στις τελευταίες 30 εγγραφές.</p>}
            </>}
        </section>
        <p className="text-sm text-amber-300">Η παρουσία εγγραφών δεν αποδεικνύει ενεργούς AI workers. Απαιτείται επαληθευμένη εκτέλεση εργασίας και heartbeat.</p>
      </section>
    </main>
  );
}
