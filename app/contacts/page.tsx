import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContactsClient from "./contacts-client";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/contacts");

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("id,display_name,email,phone,linked_user_id,source_external_id,created_at")
    .eq("owner_id", user.id)
    .order("display_name", { ascending: true });

  return (
    <main className="min-h-screen bg-[#f5f9fd] px-4 py-6 text-slate-950 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <nav className="mb-7 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Link href="/profile" className="font-black text-[#173f72] no-underline">← Το προφίλ μου</Link>
          <Link href="/people" className="rounded-full bg-[#2467aa] px-3 py-2 text-xs font-black text-white no-underline">Άνθρωποι</Link>
        </nav>
        <header className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3474b8]">ΟΙ ΕΠΑΦΕΣ ΜΟΥ</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#173f72]">Οι άνθρωποι που έχεις φέρει μαζί σου.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Οι εισαγμένες επαφές είναι δικές σου και ιδιωτικές. Όταν μια επαφή συνδεθεί με πραγματικό λογαριασμό Pantavion, εμφανίζεται καθαρά ως «Στο Pantavion».</p>
        </header>
        <ContactsClient initialContacts={contacts ?? []} backendReady={!error} />
      </section>
    </main>
  );
}
