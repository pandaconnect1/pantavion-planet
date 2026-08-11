"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; username: string | null; display_name: string | null; avatar_url: string | null };
type Reaction = { user_id: string; reaction: string };
type Comment = { id: string; author_id: string; body: string; created_at: string };
type PersonalMedia = { id: string; original_name: string; media_kind: string; mime_type: string; created_at: string };
type Post = { id: string; author_id: string; body: string | null; visibility: string; context: string; location_label: string | null; created_at: string; social_reactions?: Reaction[]; social_comments?: Comment[] };

export default function SocialHomeClient({ userId, profile, initialPosts, authors, personalMedia, backendReady, backendMessage }: { userId: string; profile: Profile; initialPosts: Post[]; authors: Profile[]; personalMedia: PersonalMedia[]; backendReady: boolean; backendMessage: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState(initialPosts);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("connections");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const authorMap = useMemo(() => new Map(authors.map((a) => [a.id, a])), [authors]);

  async function publish() {
    const text = body.trim();
    if (!text || busy || !backendReady) return;
    setBusy(true); setNotice("");
    const { data, error } = await supabase.from("social_posts").insert({ author_id: userId, body: text, visibility, context: "social" }).select("id,author_id,body,visibility,context,location_label,created_at").single();
    setBusy(false);
    if (error || !data) return setNotice(error?.message || "Η δημοσίευση απέτυχε.");
    setPosts((current) => [{ ...data, social_reactions: [], social_comments: [] }, ...current]);
    setBody("");
  }

  async function toggleLike(post: Post) {
    if (!backendReady) return;
    const mine = (post.social_reactions ?? []).some((r) => r.user_id === userId);
    if (mine) {
      const { error } = await supabase.from("social_reactions").delete().eq("post_id", post.id).eq("user_id", userId);
      if (!error) setPosts((items) => items.map((p) => p.id === post.id ? { ...p, social_reactions: (p.social_reactions ?? []).filter((r) => r.user_id !== userId) } : p));
    } else {
      const { error } = await supabase.from("social_reactions").upsert({ post_id: post.id, user_id: userId, reaction: "like" });
      if (!error) setPosts((items) => items.map((p) => p.id === post.id ? { ...p, social_reactions: [...(p.social_reactions ?? []), { user_id: userId, reaction: "like" }] } : p));
    }
  }

  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
    <div className="space-y-4">
      {!backendReady && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Το Social backend δεν είναι ακόμη συνδεδεμένο στο production.</strong><p className="mt-1 text-xs">Η σελίδα μένει όρθια, αλλά δεν παρουσιάζουμε ανενεργά κουμπιά ως λειτουργικά.{backendMessage ? ` ${backendMessage}` : ""}</p></section>}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 font-black">{profile.display_name || profile.username || "Το Social σου"}</div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Τι θέλεις να μοιραστείς;" className="w-full resize-none rounded-xl border border-slate-200 p-3" />
        <div className="mt-3 flex flex-wrap gap-2"><Link href="/my-media" className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 no-underline">Φωτογραφίες / Βίντεο ({personalMedia.length})</Link><Link href="/people" className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 no-underline">Άνθρωποι</Link><Link href="/messages" className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 no-underline">Μηνύματα</Link></div>
        <div className="mt-3 flex items-center justify-between gap-2"><select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="rounded-full border border-slate-200 px-3 py-2 text-sm"><option value="connections">Φίλοι</option><option value="public">Δημόσια</option><option value="private">Μόνο εγώ</option></select><button onClick={publish} disabled={!backendReady || busy || !body.trim()} className="rounded-full bg-[#2467aa] px-5 py-2 text-sm font-black text-white disabled:opacity-40">{busy ? "Δημοσίευση…" : "Δημοσίευση"}</button></div>
        {notice && <p className="mt-2 text-sm text-red-700">{notice}</p>}
      </section>

      {posts.map((post) => { const author = authorMap.get(post.author_id); const liked = (post.social_reactions ?? []).some((r) => r.user_id === userId); return <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="font-black">{author?.display_name || author?.username || (post.author_id === userId ? profile.display_name || profile.username || "Εσύ" : "Pantavion member")}</div><div className="mt-1 text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</div>{post.body && <p className="mt-3 whitespace-pre-wrap text-[15px] leading-6">{post.body}</p>}<button onClick={() => toggleLike(post)} disabled={!backendReady} className={`mt-4 text-sm font-black ${liked ? "text-[#2467aa]" : "text-slate-600"}`}>Μου αρέσει · {post.social_reactions?.length ?? 0}</button></article>; })}
      {backendReady && !posts.length && <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Δεν υπάρχουν ακόμη δημοσιεύσεις. Κάνε την πρώτη.</section>}
    </div>
    <aside className="space-y-3"><section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black">Ο κόσμος σου</h2><p className="mt-1 text-sm text-slate-500">Social, People, Messages, Contacts και προσωπικά media από τον ίδιο λογαριασμό.</p><div className="mt-3 grid gap-2"><Link href="/contacts" className="rounded-full bg-slate-100 px-3 py-2 text-center text-xs font-black text-slate-700 no-underline">Επαφές</Link><Link href="/profile" className="rounded-full bg-slate-100 px-3 py-2 text-center text-xs font-black text-slate-700 no-underline">Προφίλ</Link></div></section></aside>
  </div>;
}
