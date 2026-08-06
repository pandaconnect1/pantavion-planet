import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addComment, createPost, toggleLike } from "./actions";

export const dynamic = "force-dynamic";

export default async function GlobalFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/daily/feed");

  const { data: posts, error } = await supabase
    .from("social_posts")
    .select("id,author_id,body,visibility,language_code,country_code,created_at,social_reactions(user_id,reaction),social_comments(id,author_id,body,created_at)")
    .order("created_at", { ascending: false })
    .limit(50);

  const authorIds = [...new Set((posts || []).map((post) => post.author_id))];
  const { data: profiles } = authorIds.length
    ? await supabase.from("profiles").select("id,username,display_name,avatar_url,country,language").in("id", authorIds)
    : { data: [] };
  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));

  return (
    <main style={{ minHeight: "100vh", background: "#f4f7fb", color: "#12233f" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,.94)", borderBottom: "1px solid #dce5f1", backdropFilter: "blur(14px)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", minHeight: 68, padding: "10px 18px", display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <Link href="/social-core" style={{ color: "#163a68", fontWeight: 900, textDecoration: "none", fontSize: 19 }}>Pantavion Social</Link>
          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/social-core" style={navLink}>Home</Link>
            <Link href="/daily/feed" style={{ ...navLink, background: "#1468d4", color: "white" }}>Feed</Link>
            <Link href="/social-core/cultural-bridge" style={navLink}>Cultural Bridge</Link>
            <Link href="/dashboard" style={navLink}>Dashboard</Link>
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px 72px" }}>
        <section style={{ background: "linear-gradient(135deg,#ffffff,#edf6ff)", border: "1px solid #dce8f5", borderRadius: 26, padding: 24, boxShadow: "0 18px 50px rgba(35,70,110,.08)" }}>
          <p style={{ margin: 0, color: "#1468d4", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 }}>GLOBAL FEED</p>
          <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(30px,6vw,48px)", letterSpacing: "-.04em" }}>Share with your world.</h1>
          <p style={{ color: "#61758c", marginTop: 0 }}>Real posts stored in Supabase, protected by row-level security.</p>
          {(params.error || error) && <p style={{ background: "#fff1f1", color: "#9b1c1c", padding: 12, borderRadius: 12 }}>{params.error || error?.message}</p>}
          <form action={createPost}>
            <textarea name="body" required maxLength={5000} placeholder="What would you like to share?" style={{ width: "100%", minHeight: 118, resize: "vertical", border: "1px solid #cfdceb", borderRadius: 16, padding: 15, font: "inherit", boxSizing: "border-box", background: "white" }} />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <select name="visibility" defaultValue="public" style={{ border: "1px solid #cfdceb", borderRadius: 12, padding: "10px 12px", background: "white" }}>
                <option value="public">Public</option>
                <option value="followers">Followers</option>
                <option value="friends">Friends</option>
                <option value="private">Only me</option>
              </select>
              <button type="submit" style={{ border: 0, borderRadius: 13, padding: "12px 22px", background: "#1468d4", color: "white", fontWeight: 900, cursor: "pointer" }}>Publish post</button>
            </div>
          </form>
        </section>

        <section style={{ display: "grid", gap: 16, marginTop: 22 }}>
          {(posts || []).length === 0 && (
            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>The global feed is ready.</h2>
              <p style={{ color: "#61758c" }}>Publish the first real Pantavion post after the Supabase migration is applied.</p>
            </article>
          )}

          {(posts || []).map((post) => {
            const profile = profileById.get(post.author_id);
            const reactions = Array.isArray(post.social_reactions) ? post.social_reactions : [];
            const comments = Array.isArray(post.social_comments) ? post.social_comments : [];
            const liked = reactions.some((reaction: { user_id: string }) => reaction.user_id === user.id);
            return (
              <article key={post.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <div>
                    <strong style={{ fontSize: 17 }}>{profile?.display_name || profile?.username || "Pantavion member"}</strong>
                    <p style={{ margin: "4px 0 0", color: "#708399", fontSize: 13 }}>
                      {profile?.country || post.country_code || "Global"} · {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span style={{ background: "#edf4ff", color: "#245d9a", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 800 }}>{post.visibility}</span>
                </div>
                <p style={{ fontSize: 17, lineHeight: 1.65, whiteSpace: "pre-wrap", margin: "20px 0" }}>{post.body}</p>
                <div style={{ display: "flex", gap: 10, alignItems: "center", borderTop: "1px solid #e5ecf4", paddingTop: 13 }}>
                  <form action={toggleLike}>
                    <input type="hidden" name="postId" value={post.id} />
                    <button style={{ ...actionButton, background: liked ? "#e9f2ff" : "white", color: liked ? "#1468d4" : "#425a73" }} type="submit">♥ {reactions.length}</button>
                  </form>
                  <span style={{ color: "#61758c", fontSize: 14 }}>{comments.length} comments</span>
                </div>
                {comments.length > 0 && (
                  <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                    {comments.slice(-4).map((comment: { id: string; body: string }) => (
                      <p key={comment.id} style={{ margin: 0, background: "#f4f7fb", borderRadius: 12, padding: "10px 12px", color: "#334b65" }}>{comment.body}</p>
                    ))}
                  </div>
                )}
                <form action={addComment} style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <input type="hidden" name="postId" value={post.id} />
                  <input name="body" required maxLength={2000} placeholder="Write a comment…" style={{ flex: 1, minWidth: 0, border: "1px solid #d2deeb", borderRadius: 12, padding: "10px 12px" }} />
                  <button type="submit" style={actionButton}>Send</button>
                </form>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

const navLink = { textDecoration: "none", color: "#344e6b", background: "#f2f6fb", borderRadius: 12, padding: "9px 12px", fontWeight: 800, fontSize: 14 };
const cardStyle = { background: "white", border: "1px solid #dde6f1", borderRadius: 22, padding: 20, boxShadow: "0 12px 34px rgba(38,68,104,.06)" };
const actionButton = { border: "1px solid #d4dfeb", borderRadius: 11, background: "white", padding: "9px 12px", fontWeight: 800, cursor: "pointer", color: "#425a73" };
