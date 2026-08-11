"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; username: string | null; display_name: string | null; avatar_url: string | null };
type Reaction = { user_id: string; reaction: string };
type Comment = { id: string; author_id: string; body: string; created_at: string };
type Post = {
  id: string; author_id: string; body: string; visibility: string; context: string;
  location_label: string | null; created_at: string; social_reactions?: Reaction[]; social_comments?: Comment[];
};

export default function SocialHomeClient({ userId, profile, initialPosts, authors, backendReady }: {
  userId: string; profile: Profile; initialPosts: Post[]; authors: Profile[]; backendReady: boolean;
}) {
  const supabase = createClient();
  const [posts, setPosts] = useState(initialPosts);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("friends");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const authorMap = useMemo(() => new Map(authors.map((a) => [a.id, a])), [authors]);

  async function publish() {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true); setMessage("");
    const { data, error } = await supabase.from("social_posts").insert({ author_id: userId, body: text, visibility, context: "social" }).select("id,author_id,body,visibility,context,location_label,created_at").single();
    if (error) setMessage("Δεν ήταν δυνατή η δημοσίευση. Δοκίμασε ξανά.");
    else { setPosts((p) => [{ ...data, social_reactions: [], social_comments: [] }, ...p]); setBody(""); }
    setBusy(false);
  }

  async function like(post: Post) {
    const mine = post.social_reactions?.find((r) => r.user_id === userId && r.reaction === "like");
    if (mine) {
      const { error } = await supabase.from("social_reactions").delete().eq("post_id", post.id).eq("user_id", userId).eq("reaction", "like");
      if (!error) setPosts((items) => items.map((p) => p.id === post.id ? { ...p, social_reactions: (p.social_reactions ?? []).filter((r) => !(r.user_id === userId && r.reaction === "like")) } : p));
    } else {
      const { error } = await supabase.from("social_reactions").insert({ post_id: post.id, user_id: userId, reaction: "like" });
      if (!error) setPosts((items) => items.map((p) => p.id === post.id ? { ...p, social_reactions: [...(p.social_reactions ?? []), { user_id: userId, reaction: "like" }] } : p));
    }
  }

  async function addComment(postId: string, text: string) {
    const clean = text.trim(); if (!clean) return;
    const { data, error } = await supabase.from("social_comments").insert({ post_id: postId, author_id: userId, body: clean }).select("id,author_id,body,created_at").single();
    if (!error) setPosts((items) => items.map((p) => p.id === postId ? { ...p, social_comments: [...(p.social_comments ?? []), data] } : p));
  }

  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 font-black">{profile.display_name || profile.username || "Το Social σου"}</div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Τι θέλεις να μοιραστείς;" className="w-full resize-none rounded-xl border border-slate-200 p-3 outline-none focus:border-[#2467aa]" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="rounded-full border border-slate-200 px-3 py-2 text-sm"><option value="friends">Φίλοι</option><option value="public">Δημόσια</option><option value="private">Μόνο εγώ</option></select>
          <button onClick={publish} disabled={!backendReady || busy || !body.trim()} className="rounded-full bg-[#2467aa] px-5 py-2 text-sm font-black text-white disabled:opacity-40">{busy ? "Δημοσίευση…" : "Δημοσίευση"}</button>
        </div>{message && <p className="mt-2 text-sm text-red-700">{message}</p>}
      </section>

      {posts.length === 0 ? <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Το Social σου είναι έτοιμο. Κάνε την πρώτη δημοσίευση.</section> : posts.map((post) => {
        const author = authorMap.get(post.author_id); const liked = post.social_reactions?.some((r) => r.user_id === userId && r.reaction === "like");
        return <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3"><div className="font-black">{author?.display_name || author?.username || (post.author_id === userId ? profile.display_name || profile.username : "Pantavion member")}</div><div className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()} · {post.visibility === "public" ? "Δημόσια" : post.visibility === "private" ? "Μόνο εγώ" : "Φίλοι"}</div></div>
          <p className="whitespace-pre-wrap text-[15px] leading-6">{post.body}</p>
          <div className="mt-4 flex gap-3 border-t border-slate-100 pt-3 text-sm"><button onClick={() => like(post)} className={liked ? "font-black text-[#2467aa]" : "font-bold text-slate-600"}>Μου αρέσει · {post.social_reactions?.length ?? 0}</button><span className="text-slate-500">Σχόλια · {post.social_comments?.length ?? 0}</span></div>
          {(post.social_comments ?? []).map((c) => <div key={c.id} className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">{c.body}</div>)}
          <CommentBox onSend={(text) => addComment(post.id, text)} />
        </article>;
      })}
    </div>
    <aside className="space-y-3"><section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black">Ο κόσμος σου</h2><p className="mt-1 text-sm text-slate-500">Άνθρωποι, επαφές, media και μηνύματα ενώνονται εδώ. Nearby, χάρτης και περισσότερα εργαλεία εμφανίζονται μόνο όταν είναι πραγματικά συνδεδεμένα.</p></section></aside>
  </div>;
}

function CommentBox({ onSend }: { onSend: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  return <div className="mt-3 flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { void onSend(text); setText(""); } }} placeholder="Γράψε σχόλιο…" className="min-w-0 flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm"/><button onClick={() => { if (text.trim()) { void onSend(text); setText(""); } }} className="rounded-full bg-slate-900 px-3 py-2 text-sm font-bold text-white">Αποστολή</button></div>;
}
