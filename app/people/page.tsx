import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PeopleClient from "./people-client";

export const dynamic = "force-dynamic";

function PeopleUnavailable({ detail }: { detail?: string | null }) {
  return (
    <main className="min-h-screen bg-[#f5f9fd] px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#3474b8]">PEOPLE & SOCIAL</p>
        <h1 className="mt-2 text-3xl font-black text-[#173f72]">Το People παραμένει διαθέσιμο.</h1>
        <p className="mt-3 text-slate-600">
          Ο ανθρώπινος πυρήνας δεν θα ρίχνει πλέον ολόκληρη τη σελίδα όταν μία υπηρεσία ή migration δεν απαντά. Η λειτουργία βρίσκεται προσωρινά σε ασφαλή περιορισμένη κατάσταση.
        </p>
        {detail ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">Backend status: {detail}</p> : null}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/" className="rounded-full bg-[#2467aa] px-5 py-2.5 text-sm font-black text-white no-underline">Αρχική</Link>
          <Link href="/social" className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 no-underline">Social</Link>
        </div>
      </section>
    </main>
  );
}

function PeopleLogin() {
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

export default async function PeoplePage() {
  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();

    if (authError && !auth.user) {
      return <PeopleUnavailable detail={authError.message} />;
    }

    if (!auth.user) return <PeopleLogin />;

    const profileQuery = supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,bio,country,language")
      .neq("id", auth.user.id)
      .limit(60);

    const relationshipQuery = supabase
      .from("relationships")
      .select("id,requester_id,addressee_id,status,created_at,updated_at")
      .or(`requester_id.eq.${auth.user.id},addressee_id.eq.${auth.user.id}`)
      .order("updated_at", { ascending: false });

    const [profilesResult, relationshipsResult] = await Promise.allSettled([
      profileQuery,
      relationshipQuery,
    ]);

    const profiles = profilesResult.status === "fulfilled" ? profilesResult.value.data ?? [] : [];
    const profilesError = profilesResult.status === "fulfilled" ? profilesResult.value.error : profilesResult.reason;
    const relationships = relationshipsResult.status === "fulfilled" ? relationshipsResult.value.data ?? [] : [];
    const relationshipsError = relationshipsResult.status === "fulfilled" ? relationshipsResult.value.error : relationshipsResult.reason;

    const backendMessage =
      relationshipsError instanceof Error
        ? relationshipsError.message
        : relationshipsError?.message ??
          (profilesError instanceof Error ? profilesError.message : profilesError?.message ?? null);

    return (
      <PeopleClient
        currentUserId={auth.user.id}
        profiles={profiles}
        relationships={relationships}
        backendReady={!relationshipsError}
        backendMessage={backendMessage}
      />
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "People kernel runtime unavailable";
    console.error("[people-kernel] isolated route failure", error);
    return <PeopleUnavailable detail={detail} />;
  }
}
