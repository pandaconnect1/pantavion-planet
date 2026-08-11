import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SocialMapClient from "./social-map-client";

export const dynamic = "force-dynamic";

function MapUnavailable({ detail }: { detail?: string | null }) {
  return (
    <main className="min-h-screen bg-[#f4f8fc] px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/social" className="text-sm font-black text-[#173f72] no-underline">← Social</Link>
        <h1 className="mt-5 text-3xl font-black text-[#173f72]">Social Map</h1>
        <p className="mt-3 text-slate-600">Ο χάρτης παραμένει διαθέσιμος ακόμη κι αν η location υπηρεσία ή migration δεν έχει συνδεθεί ακόμη.</p>
        {detail ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">Backend status: {detail}</p> : null}
      </section>
    </main>
  );
}

export default async function SocialMapPage() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError && !user) return <MapUnavailable detail={authError.message} />;
    if (!user) redirect("/auth/login?next=/social/map");

    const [shareResult, relationshipResult] = await Promise.allSettled([
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

    const ownShare = shareResult.status === "fulfilled" ? shareResult.value.data : null;
    const connections = relationshipResult.status === "fulfilled" ? relationshipResult.value.data ?? [] : [];
    const backendError = shareResult.status === "fulfilled" ? shareResult.value.error : shareResult.reason;

    const connectionIds = Array.from(new Set(connections.map((r) => r.requester_id === user.id ? r.addressee_id : r.requester_id)));
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
            backendReady={!backendError}
            backendMessage={backendError instanceof Error ? backendError.message : backendError?.message ?? null}
          />
        </section>
      </main>
    );
  } catch (error) {
    console.error("[social-map-kernel] isolated route failure", error);
    return <MapUnavailable detail={error instanceof Error ? error.message : "map runtime unavailable"} />;
  }
}
