import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MoveToPantavionClient from "./move-client";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const metadata={title:"Move to Pantavion | Ο ψηφιακός κόσμος μου"};

export default async function MoveToPantavionPage() {
  const supabase=await createClient();
  const {data:auth}=await supabase.auth.getUser();
  if(!auth.user) redirect("/auth/login?next=/move-to-pantavion");

  const {data, error}=await supabase.from("imported_communication_records")
    .select("id,source_provider,record_kind,original_sender,original_subject,original_text,sent_at,imported_at")
    .eq("owner_id",auth.user.id)
    .order("imported_at",{ascending:false})
    .limit(300);

  return (
    <main className="min-h-screen bg-[#f5f9fd] px-4 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6 flex flex-wrap items-center gap-4 text-sm font-semibold">
          <Link href="/people" className="text-[#2467aa] underline">People</Link>
          <Link href="/contacts" className="text-[#2467aa] underline">Οι επαφές μου</Link>
          <Link href="/messages" className="text-[#2467aa] underline">Pantavion Chat</Link>
        </nav>
        <h1 className="text-3xl font-black text-[#173f72] sm:text-5xl">Μεταφορά στον κόσμο του Pantavion</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-700">
          Εσύ διαλέγεις ποια προσωπικά δεδομένα θα μεταφέρεις, βλέπεις πρώτα την προεπισκόπηση,
          δίνεις ξεχωριστή συγκατάθεση και μπορείς να διακόψεις νέες εισαγωγές
          ή να διαγράψεις το ιδιωτικό αρχείο σου. Κανένα αρχείο δεν ανοίγει
          χωρίς δική σου επιλογή.
        </p>
        <MoveToPantavionClient
          ready={!error}
          initialRecords={data??[]}
        />
      </div>
    </main>
  );
}
