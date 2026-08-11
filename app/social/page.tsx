import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SocialHomeClient from "./social-home-client";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social");

  const [{ data: profile }, { data: posts, error }] = await Promise.all([
    supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).maybeSingle(),
    supabase
      .from("social_posts")
      .select("id,author_id,body,visibility,context,location_label,created_at,social_reactions(user_id,reaction),social_comments(id,author_id,body,created_at)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const authorIds = Array.from(new Set((posts ?? []).map((post) => post.author_id)));
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", authorIds)
    : { data: [] };

  return (
    <main className="min-h-screen bg-[#f4f8fc] px-3 py-4 text-slate-950 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <Link href="/" className="text-sm font-black text-[#173f72] no-underline">Pantavion</Link>
            <p className="text-xs text-slate-500">Ο κοινωνικός σου κόσμος σε μία οθόνη</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs font-black">
            <Link href="/people" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 no-underline">Άνθρωποι</Link>
            <Link href="/messages" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 no-underline">Μηνύματα</Link>
            <Link href="/contacts" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 no-underline">Επαφές</Link>
            <Link href="/my-media" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 no-underline">Media</Link>
            <Link href="/profile" className="rounded-full bg-[#2467aa] px-3 py-2 text-white no-underline">Προφίλ</Link>
          </nav>
        </header>

        <SocialHomeClient
          userId={user.id}
          profile={profile ?? { id: user.id, username: null, display_name: null, avatar_url: null }}
          initialPosts={posts ?? []}
          authors={authors ?? []}
          backendReady={!error}
        />
      </section>
    </main>
  );
}
