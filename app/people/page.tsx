import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PeopleClient from "./people-client";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return (
      <main className="min-h-screen bg-[#f5f9fd] px-4 py-8 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#3474b8]">PEOPLE & SOCIAL</p>
          <h1 className="mt-2 text-3xl font-black text-[#173f72]">Σύνδεση ανθρώπων με πραγματική ταυτότητα.</h1>
          <p className="mt-3 text-slate-600">Για People, requests και messages χρειάζεται λογαριασμός Pantavion.</p>
          <div className="mt-6 flex gap-2"><Link href="/auth/login" className="rounded-full bg-[#2467aa] px-5 py-2.5 text-sm font-black text-white no-underline">Σύνδεση</Link><Link href="/auth/sign-up" className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 no-underline">Εγγραφή</Link></div>
        </section>
      </main>
    );
  }

  const [{ data: profiles, error: profilesError }, { data: relationships, error: relationshipsError }] = await Promise.all([
    supabase.from("profiles").select("id,username,display_name,avatar_url,bio,country,language").neq("id", auth.user.id).limit(60),
    supabase.from("relationships").select("id,requester_id,addressee_id,status,created_at,updated_at").or(`requester_id.eq.${auth.user.id},addressee_id.eq.${auth.user.id}`).order("updated_at", { ascending: false }),
  ]);

  return (
    <PeopleClient
      currentUserId={auth.user.id}
      profiles={profiles ?? []}
      relationships={relationships ?? []}
      backendReady={!relationshipsError}
      backendMessage={relationshipsError?.message ?? profilesError?.message ?? null}
    />
  );
}
