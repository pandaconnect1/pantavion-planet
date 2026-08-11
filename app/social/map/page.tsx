import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SocialMapClient from "./social-map-client";

export const dynamic = "force-dynamic";

export default async function SocialMapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/map");

  const [{ data: ownShare }, { data: connections }] = await Promise.all([
    supabase
      .from("social_location_shares")
      .select("enabled,audience,precision_mode,latitude,longitude,accuracy_meters,expires_at,updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("relationships")
      .select("requester_id,addressee_id,status")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
  ]);

  const connectionIds = Array.from(new Set((connections ?? []).map((r) => r.requester_id === user.id ? r.addressee_id : r.requester_id)));
  const { data: profiles } = connectionIds.length
    ? await supabase.from("profiles").select("id,display_name,username,avatar_url").in("id", connectionIds)
    : { data: [] };

  return (
    <main className="min-h-screen bg-[#f4f8fc] px-3 py-4 text-slate-950 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <Link href="/social" className="text-sm font-black text-[#173f72] no-underline">← Social</Link>
            <p className="text-xs text-slate-500">Χάρτης φίλων και κοντινών επιλογών</p>
          </div>
          <Link href="/people" className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 no-underline">Φίλοι</Link>
        </header>

        <SocialMapClient
          userId={user.id}
          initialShare={ownShare ?? null}
          connections={profiles ?? []}
        />
      </section>
    </main>
  );
}
