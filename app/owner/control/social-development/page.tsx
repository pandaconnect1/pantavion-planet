import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const capabilityTables = [
  { label: "Ταυτότητα χρηστών", table: "profiles" },
  { label: "Δημοσιεύσεις Social", table: "social_posts" },
  { label: "Σχόλια", table: "social_comments" },
  { label: "Αντιδράσεις", table: "social_reactions" },
  { label: "Συνομιλίες Chat FREE", table: "conversations" },
  { label: "Μέλη συνομιλιών", table: "conversation_members" },
  { label: "Μηνύματα", table: "messages" },
  { label: "Κοινότητες", table: "communities" },
  { label: "Ειδοποιήσεις", table: "social_notifications" },
] as const;

export default async function SocialDevelopmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/owner/control/social-development");
  try { requireFounderIdentity(user.id); } catch { redirect("/"); }
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") redirect("/owner/safety/verify?next=/owner/control/social-development");

  const checks = await Promise.all(capabilityTables.map(async (item) => {
    const { error } = await supabase.from(item.table).select("*", { head: true, count: "exact" }).limit(1);
    return { ...item, available: !error };
  }));
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl border border-cyan-500/30 bg-slate-900 p-6">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Founder only · Pantavion Social Development</p>
          <h1 className="mt-2 text-3xl font-black">Social + Chat FREE · Κέντρο ανάπτυξης</h1>
          <p className="mt-3 text-sm text-slate-300">Ξεχωριστό πεδίο Social/Chat. Ζωντανός έλεγχος προσβασιμότητας πινάκων μέσω του συνδεδεμένου Supabase. Δεν αποδεικνύει επιτυχημένη αποστολή, κρυπτογράφηση ή ενεργούς AI agents.</p>
          <Link href="/owner/control" className="mt-4 inline-block text-sm font-bold text-cyan-300">← Owner Control</Link>
        </header>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Supabase capabilities">
          {checks.map((item) => <article key={item.table} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="font-bold">{item.label}</h2>
            <p className={`mt-2 text-sm ${item.available ? "text-emerald-300" : "text-amber-300"}`}>{item.available ? "Ο πίνακας είναι προσβάσιμος" : "Μη διαθέσιμος ή χωρίς πρόσβαση"}</p>
            <code className="mt-2 block text-xs text-slate-400">{item.table}</code>
          </article>)}
        </section>
        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-xl font-bold">Τεκμηριωμένη εργασία GitHub</h2>
          <p className="mt-2 text-sm text-slate-300">Η ανάκτηση και οι αλλαγές κώδικα γίνονται σε ελεγχόμενο development branch. Υπάρχει ξεχωριστός read-only audit runner στο GitHub Actions. Οι AI workers δεν εκτελούν ακόμη αυτόνομα εργασίες από αυτή τη σελίδα και δεν γίνονται αλλαγές παραγωγής.</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
            <a className="text-cyan-300 underline" href="https://github.com/pandaconnect1/pantavion-planet/blob/feat/water-platform-quality-roadmap-20261018/docs/recovery/SOCIAL-CHAT-DONOR-AUDIT-20261020.md">Ανασκαφή Social / Chat</a>
            <a className="text-cyan-300 underline" href="https://github.com/pandaconnect1/pantavion-planet/pull/627">Development PR #627</a>
            <a className="text-cyan-300 underline" href="https://github.com/pandaconnect1/pantavion-planet/actions/workflows/pantavion-social-chat-autonomy-audit.yml">Social/Chat audit runs · GitHub Actions</a>
            <Link className="text-cyan-300 underline" href="/social">Social UI</Link>
            <Link className="text-cyan-300 underline" href="/messages">Chat UI</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
