import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BlocksClient from "./blocks-client";

export const dynamic = "force-dynamic";

export default async function PeopleBlocksPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return (
      <main className="min-h-screen bg-[#f5f9fd] px-4 py-8">
        <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-[#173f72]">Αποκλεισμένοι χρήστες</h1>
          <p className="mt-2 text-sm text-slate-600">Χρειάζεται σύνδεση για διαχείριση αποκλεισμών.</p>
          <Link href="/auth/login" className="mt-5 inline-block rounded-full bg-[#2467aa] px-4 py-2 text-sm font-black text-white no-underline">Σύνδεση</Link>
        </section>
      </main>
    );
  }

  const [profilesResult, blocksResult] = await Promise.all([
    supabase.from("profiles").select("id,display_name,username,country").neq("id", auth.user.id).limit(100),
    supabase.from("user_blocks").select("blocked_id").eq("blocker_id", auth.user.id),
  ]);

  const people = profilesResult.data ?? [];
  const blocked = (blocksResult.data ?? []).map((row) => row.blocked_id);

  return (
    <main className="min-h-screen bg-[#f5f9fd] px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3474b8]">PEOPLE SAFETY</p>
            <h1 className="mt-1 text-3xl font-black text-[#173f72]">Αποκλεισμός και άρση αποκλεισμού</h1>
            <p className="mt-2 text-sm text-slate-600">Διαχειρίσου ποιοι χρήστες δεν μπορούν να δημιουργήσουν νέα σχέση ή επικοινωνία μαζί σου.</p>
          </div>
          <Link href="/people" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 no-underline">Πίσω στο People</Link>
        </div>
        <BlocksClient people={people} initialBlocked={blocked} />
      </section>
    </main>
  );
}
