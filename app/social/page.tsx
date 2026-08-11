import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SocialHomeClient from "./social-home-client";

export const dynamic = "force-dynamic";

function SocialUnavailable({ detail }: { detail?: string | null }) {
  return (
    <main className="min-h-screen bg-[#f4f8fc] px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-black text-[#173f72] no-underline">← Pantavion</Link>
        <h1 className="mt-5 text-3xl font-black text-[#173f72]">Social</h1>
        <p className="mt-3 text-slate-600">Το Social παραμένει διαθέσιμο ακόμη κι αν μία backend υπηρεσία ή migration δεν έχει συνδεθεί ακόμη.</p>
        {detail ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">Backend status: {detail}</p> : null}
      </section>
    </main>
  );
}

export default async function SocialPage() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError && !user) return <SocialUnavailable detail={authError.message} />;
    if (!user) {
      return (
        <main className="min-h-screen bg-[#f4f8fc] px-4 py-8 text-slate-950">
          <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-black text-[#173f72]">Το Social σου</h1>
            <p className="mt-3 text-slate-600">Συνδέσου για δημοσιεύσεις, φίλους, media και μηνύματα.</p>
            <Link href="/auth/login?next=/social" className="mt-5 inline-block rounded-full bg-[#2467aa] px-5 py-2.5 font-black text-white no-underline">Σύνδεση</Link>
          </section>
        </main>
      );
    }

    const [profileResult, postsResult, mediaResult] = await Promise.allSettled([
      supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).maybeSingle(),
      supabase.from("social_posts")
        .select("id,author_id,body,visibility,context,location_label,created_at,social_reactions(user_id,reaction),social_comments(id,author_id,body,created_at),social_post_media(id,personal_media_id,media_kind,mime_type)")
        .order("created_at", { ascending: false }).limit(50),
      supabase.from("personal_media").select("id,original_name,media_kind,mime_type,created_at").eq("owner_id", user.id).in("media_kind", ["photo","video","audio"]).order("created_at", { ascending: false }).limit(100),
    ]);

    const profile = profileResult.status === "fulfilled" ? profileResult.value.data : null;
    const posts = postsResult.status === "fulfilled" ? postsResult.value.data ?? [] : [];
    const postError = postsResult.status === "fulfilled" ? postsResult.value.error : postsResult.reason;
    const personalMedia = mediaResult.status === "fulfilled" ? mediaResult.value.data ?? [] : [];

    const authorIds = Array.from(new Set(posts.map((post) => post.author_id)));
    const { data: authors } = authorIds.length ? await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", authorIds) : { data: [] };

    return (
      <main className="min-h-screen bg-[#f4f8fc] px-3 py-4 text-slate-950 sm:px-6">
        <section className="mx-auto max-w-6xl">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div><Link href="/" className="text-sm font-black text-[#173f72] no-underline">Pantavion</Link><p className="text-xs text-slate-500">Ο κοινωνικός σου κόσμος σε μία οθόνη</p></div>
            <nav className="flex flex-wrap gap-2 text-xs font-black"><Link href="/people" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 no-underline">Άνθρωποι</Link><Link href="/messages" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 no-underline">Μηνύματα</Link><Link href="/contacts" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 no-underline">Επαφές</Link><Link href="/my-media" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 no-underline">Media</Link><Link href="/social/map" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 no-underline">Χάρτης</Link><Link href="/profile" className="rounded-full bg-[#2467aa] px-3 py-2 text-white no-underline">Προφίλ</Link></nav>
          </header>
          <SocialHomeClient userId={user.id} profile={profile ?? { id: user.id, username: null, display_name: null, avatar_url: null }} initialPosts={posts} authors={authors ?? []} personalMedia={personalMedia} backendReady={!postError} backendMessage={postError instanceof Error ? postError.message : postError?.message ?? null} />
        </section>
      </main>
    );
  } catch (error) {
    console.error("[social-kernel] isolated route failure", error);
    return <SocialUnavailable detail={error instanceof Error ? error.message : "Social kernel runtime unavailable"} />;
  }
}
