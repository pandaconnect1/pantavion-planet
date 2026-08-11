"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; username: string | null; display_name: string | null; avatar_url: string | null };
type Reaction = { user_id: string; reaction: string };
type Comment = { id: string; author_id: string; body: string; created_at: string };
type Attachment = { id: string; personal_media_id: string | null; media_kind: string; mime_type: string | null };
type PersonalMedia = { id: string; original_name: string; media_kind: string; mime_type: string; created_at: string };
type Post = {
  id: string; author_id: string; body: string | null; visibility: string; context: string;
  location_label: string | null; created_at: string; social_reactions?: Reaction[]; social_comments?: Comment[]; social_post_media?: Attachment[];
};

export default function SocialHomeClient({ userId, profile, initialPosts, authors, personalMedia, backendReady }: {
  userId: string; profile: Profile; initialPosts: Post[]; authors: Profile[]; personalMedia: PersonalMedia[]; backendReady: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState(initialPosts);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("connections");
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [showMedia, setShowMedia] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const authorMap = useMemo(() => new Map(authors.map((a) => [a.id, a])), [authors]);

  function toggleMedia(id: string) {
    setSelectedMediaIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-10));
  }

  async function publish() {
    const text = body.trim();
    if ((!text && !selectedMediaIds.length) || busy) return;
    setBusy(true); setMessage("");

    const { data: post, error } = await supabase
      .from("social_posts")
      .insert({ author_id: userId, body: text || null, visibility, context: "social" })
      .select("id,author_id,body,visibility,context,location_label,created_at")
      .single();

    if (error || !post) {
      setBusy(false);
      setMessage("Δεν ήταν δυνατή η δημοσίευση. Δοκίμασε ξανά.");
      return;
    }

    let attachments: Attachment[] = [];
    if (selectedMediaIds.length) {
      const rows = selectedMediaIds.map((personalMediaId) => ({ post_id: post.id, owner_id: userId, personal_media_id: personalMediaId }));
      const { data, error: mediaError } = await supabase
        .from("social_post_media")
        .insert(rows)
        .select("id,personal_media_id,media_kind,mime_type");

      if (mediaError) {
        await supabase.from("social_posts").delete().eq("id", post.id);
        setBusy(false);
        setMessage("Η δημοσίευση δεν ανέβηκε γιατί δεν μπόρεσαν να συνδεθούν τα media. Τα αρχεία σου παραμένουν ασφαλή στη βιβλιοθήκη σου.");
        return;
      }
      attachments = (data ?? []) as Attachment[];
    }

    setPosts((current) => [{ ...post, social_reactions: [], social_comments: [], social_post_media: attachments }, ...current]);
    setBody("");
    setSelectedMediaIds([]);
    setShowMedia(false);
    setBusy(false);
  }

  async function like(post: Post) {
    const mine = post.social_reactions?.find((r) => r.user_id === userId && r.reaction === "like");
    if (mine) {
      const { error } = await supabase.from("social_reactions").delete().eq("post_id", post.id).eq("user_id", userId);
      if (!error) setPosts((items) => items.map((p) => p.id === post.id ? { ...p, social_reactions: (p.social_reactions ?? []).filter((r) => r.user_id !== userId) } : p));
    } else {
      const { error } = await supabase.from("social_reactions").upsert({ post_id: post.id, user_id: userId, reaction: "like" });
      if (!error) setPosts((items) => items.map((p) => p.id === post.id ? { ...p, social_reactions: [...(p.social_reactions ?? []).filter((r) => r.user_id !== userId), { user_id: userId, reaction: "like" }] } : p));
    }
  }

  async function addComment(postId: string, text: string) {
    const clean = text.trim(); if (!clean) return;
    const { data, error } = await supabase.from("social_comments").insert({ post_id: postId, author_id: userId, body: clean }).select("id,author_id,body,created_at").single();
    if (!error && data) setPosts((items) => items.map((p) => p.id === postId ? { ...p, social_comments: [...(p.social_comments ?? []), data] } : p));
  }

  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 font-black">{profile.display_name || profile.username || "Το Social σου"}</div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Τι θέλεις να μοιραστείς;" className="w-full resize-none rounded-xl border border-slate-200 p-3 outline-none focus:border-[#2467aa]" />

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowMedia((value) => !value)} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">Φωτογραφία / Βίντεο{selectedMediaIds.length ? ` · ${selectedMediaIds.length}` : ""}</button>
          <a href="/my-media" className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-500 no-underline">Η βιβλιοθήκη μου</a>
          <a href="/social/map" className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-500 no-underline">Χάρτης / Κοντά μου</a>
        </div>

        {showMedia && <div className="mt-3 rounded-xl bg-slate-50 p-3">
          {personalMedia.length ? <div className="grid gap-2 sm:grid-cols-2">{personalMedia.map((item) => {
            const selected = selectedMediaIds.includes(item.id);
            return <button key={item.id} type="button" onClick={() => toggleMedia(item.id)} className={`rounded-xl border p-3 text-left ${selected ? "border-[#2467aa] bg-white" : "border-slate-200 bg-white"}`}>
              <div className="text-sm font-black">{item.original_name}</div>
              <div className="mt-1 text-xs text-slate-500">{item.media_kind === "photo" ? "Φωτογραφία" : item.media_kind === "video" ? "Βίντεο" : "Ήχος"}{selected ? " · Επιλέχθηκε" : ""}</div>
            </button>;
          })}</div> : <p className="text-sm text-slate-500">Δεν έχεις ακόμη φωτογραφίες ή βίντεο. Πρόσθεσέ τα πρώτα στη βιβλιοθήκη σου.</p>}
        </div>}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="rounded-full border border-slate-200 px-3 py-2 text-sm"><option value="connections">Φίλοι</option><option value="public">Δημόσια</option><option value="private">Μόνο εγώ</option></select>
          <button onClick={publish} disabled={!backendReady || busy || (!body.trim() && !selectedMediaIds.length)} className="rounded-full bg-[#2467aa] px-5 py-2 text-sm font-black text-white disabled:opacity-40">{busy ? "Δημοσίευση…" : "Δημοσίευση"}</button>
        </div>{message && <p className="mt-2 text-sm text-red-700">{message}</p>}
      </section>

      {posts.length === 0 ? <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Το Social σου είναι έτοιμο. Κάνε την πρώτη δημοσίευση.</section> : posts.map((post) => {
        const author = authorMap.get(post.author_id); const liked = post.social_reactions?.some((r) => r.user_id === userId && r.reaction === "like");
        return <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3"><div className="font-black">{author?.display_name || author?.username || (post.author_id === userId ? profile.display_name || profile.username : "Pantavion member")}</div><div className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()} · {post.visibility === "public" ? "Δημόσια" : post.visibility === "private" ? "Μόνο εγώ" : "Φίλοι"}</div></div>
          {post.body && <p className="whitespace-pre-wrap text-[15px] leading-6">{post.body}</p>}
          {!!post.social_post_media?.length && <div className="mt-3 grid gap-2 sm:grid-cols-2">{post.social_post_media.map((attachment) => <PostMedia key={attachment.id} attachment={attachment} />)}</div>}
          <div className="mt-4 flex gap-3 border-t border-slate-100 pt-3 text-sm"><button onClick={() => like(post)} className={liked ? "font-black text-[#2467aa]" : "font-bold text-slate-600"}>Μου αρέσει · {post.social_reactions?.length ?? 0}</button><span className="text-slate-500">Σχόλια · {post.social_comments?.length ?? 0}</span></div>
          {(post.social_comments ?? []).map((c) => <div key={c.id} className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">{c.body}</div>)}
          <CommentBox onSend={(text) => addComment(post.id, text)} />
        </article>;
      })}
    </div>
    <aside className="space-y-3"><section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black">Ο κόσμος σου</h2><p className="mt-1 text-sm text-slate-500">Άνθρωποι, επαφές, media, μηνύματα και ο χάρτης σου ενώνονται εδώ. Τα προσωπικά σου αρχεία και η τοποθεσία σου παραμένουν ιδιωτικά εκτός αν επιλέξεις εσύ να τα μοιραστείς.</p><a href="/social/map" className="mt-3 inline-block rounded-full bg-[#123b67] px-4 py-2 text-xs font-black text-white no-underline">Άνοιγμα χάρτη</a></section></aside>
  </div>;
}

function PostMedia({ attachment }: { attachment: Attachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/social/media-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attachmentId: attachment.id }) })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (active) setUrl(data.url ?? null); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attachment.id]);

  if (failed) return <div className="rounded-xl bg-slate-100 p-6 text-center text-xs text-slate-500">Το media δεν είναι διαθέσιμο.</div>;
  if (!url) return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;
  if (attachment.media_kind === "photo") return <img src={url} alt="" className="max-h-[520px] w-full rounded-xl object-cover" />;
  if (attachment.media_kind === "video") return <video src={url} controls playsInline className="max-h-[520px] w-full rounded-xl bg-black" />;
  if (attachment.media_kind === "audio") return <audio src={url} controls className="w-full" />;
  return <a href={url} target="_blank" rel="noreferrer" className="block rounded-xl bg-slate-100 p-4 font-bold text-slate-700">Άνοιγμα αρχείου</a>;
}

function CommentBox({ onSend }: { onSend: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  return <div className="mt-3 flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { void onSend(text); setText(""); } }} placeholder="Γράψε σχόλιο…" className="min-w-0 flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm"/><button onClick={() => { if (text.trim()) { void onSend(text); setText(""); } }} className="rounded-full bg-slate-900 px-3 py-2 text-sm font-bold text-white">Αποστολή</button></div>;
}
