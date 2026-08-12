import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SocialHomeClient from "./social-home-client";

export const dynamic = "force-dynamic";

type CapabilityState = {
  posts: boolean;
  reactions: boolean;
  comments: boolean;
  media: boolean;
  map: boolean;
  contactDiscovery: boolean;
};

type Reaction = { user_id: string; reaction: string };
type Comment = { id: string; post_id?: string; author_id: string; body: string; created_at: string };
type Attachment = { id: string; post_id?: string; personal_media_id: string | null; media_kind: string; mime_type: string | null };

type BasePost = {
  id: string;
  author_id: string;
  body: string | null;
  visibility: string;
  context: string;
  location_label: string | null;
  created_at: string;
};

async function tableReady(supabase: Awaited<ReturnType<typeof createClient>>, table: string) {
  const { error } = await supabase.from(table).select("*", { head: true, count: "exact" }).limit(1);
  return !error;
}

function LoginScreen() {
  return (
    <main className="min-h-screen bg-[#f4f8fc] px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-[#173f72]">Το Social σου</h1>
        <p className="mt-3 text-slate-600">Συνδέσου για δημοσιεύσεις, φίλους, φωτογραφίες, βίντεο και μηνύματα.</p>
        <Link href="/auth/login?next=/social" className="mt-5 inline-block rounded-full bg-[#2467aa] px-5 py-2.5 font-black text-white no-underline">Σύνδεση</Link>
      </section>
    </main>
  );
}

export default async function SocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <LoginScreen />;

  const [postsReady, reactionsReady, commentsReady, mediaReady, mapReady, contactDiscoveryReady] = await Promise.all([
    tableReady(supabase, "social_posts"),
    tableReady(supabase, "social_reactions"),
    tableReady(supabase, "social_comments"),
    tableReady(supabase, "social_post_media"),
    tableReady(supabase, "social_location_shares"),
    tableReady(supabase, "contact_discovery_tokens"),
  ]);

  const capabilities: CapabilityState = {
    posts: postsReady,
    reactions: reactionsReady,
    comments: commentsReady,
    media: mediaReady,
    map: mapReady,
    contactDiscovery: contactDiscoveryReady,
  };

  const profilePromise = supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const mediaLibraryPromise = mediaReady
    ? supabase
        .from("personal_media")
        .select("id,original_name,media_kind,mime_type,created_at")
        .eq("owner_id", user.id)
        .in("media_kind", ["photo", "video", "audio"])
        .order("created_at", { ascending: false })
        .limit(100)
    : Promise.resolve({ data: [] });

  const postsPromise = postsReady
    ? supabase
        .from("social_posts")
        .select("id,author_id,body,visibility,context,location_label,created_at")
        .order("created_at", { ascending: false })
        .limit(50)
    : Promise.resolve({ data: [] });

  const [{ data: profile }, { data: personalMedia }, { data: basePosts }] = await Promise.all([
    profilePromise,
    mediaLibraryPromise,
    postsPromise,
  ]);

  const posts = (basePosts ?? []) as BasePost[];
  const postIds = posts.map((post) => post.id);

  const [reactionsResult, commentsResult, attachmentsResult] = await Promise.all([
    reactionsReady && postIds.length
      ? supabase.from("social_reactions").select("post_id,user_id,reaction").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    commentsReady && postIds.length
      ? supabase.from("social_comments").select("id,post_id,author_id,body,created_at").in("post_id", postIds).is("deleted_at", null).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    mediaReady && postIds.length
      ? supabase.from("social_post_media").select("id,post_id,personal_media_id,media_kind,mime_type").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
  ]);

  const reactions = (reactionsResult.data ?? []) as (Reaction & { post_id: string })[];
  const comments = (commentsResult.data ?? []) as Comment[];
  const attachments = (attachmentsResult.data ?? []) as Attachment[];

  const hydratedPosts = posts.map((post) => ({
    ...post,
    social_reactions: reactions.filter((reaction) => reaction.post_id === post.id).map(({ post_id: _postId, ...reaction }) => reaction),
    social_comments: comments.filter((comment) => comment.post_id === post.id),
    social_post_media: attachments.filter((attachment) => attachment.post_id === post.id),
  }));

  const authorIds = Array.from(new Set(posts.map((post) => post.author_id)));
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
            {mapReady ? <Link href="/social/map" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 no-underline">Χάρτης</Link> : null}
            <Link href="/profile" className="rounded-full bg-[#2467aa] px-3 py-2 text-white no-underline">Προφίλ</Link>
          </nav>
        </header>

        <SocialHomeClient
          userId={user.id}
          profile={profile ?? { id: user.id, username: null, display_name: null, avatar_url: null }}
          initialPosts={hydratedPosts}
          authors={authors ?? []}
          personalMedia={personalMedia ?? []}
          capabilities={capabilities}
        />
      </section>
    </main>
  );
}
