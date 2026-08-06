import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCommunity, joinCommunity } from "./actions";

export default async function CommunitiesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/communities");

  const { data: communities } = await supabase
    .from("communities")
    .select("id,name,slug,description,visibility,age_scope,created_at,community_members(user_id,status)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main style={{ minHeight: "100vh", background: "#f6f9fd", color: "#10233f", padding: 20 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, color: "#1769aa", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 }}>PANTAVION COMMUNITIES</p>
            <h1 style={{ margin: "8px 0 0", fontSize: "clamp(34px,5vw,58px)" }}>Find your people. Build your world.</h1>
          </div>
          <Link href="/social-core" style={{ textDecoration: "none", fontWeight: 800, color: "#1769aa" }}>← Social World</Link>
        </div>

        {params.error ? <div style={{ background: "#fff1f1", border: "1px solid #f5bcbc", padding: 14, borderRadius: 14, marginBottom: 18 }}>{params.error}</div> : null}

        <section style={{ background: "white", borderRadius: 24, padding: 20, border: "1px solid #dfe7f1", marginBottom: 22 }}>
          <h2 style={{ marginTop: 0 }}>Create a community</h2>
          <form action={createCommunity} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <input name="name" required minLength={2} maxLength={100} placeholder="Community name" style={{ padding: 13, borderRadius: 12, border: "1px solid #cfd9e6" }} />
            <input name="description" maxLength={500} placeholder="What is this community about?" style={{ padding: 13, borderRadius: 12, border: "1px solid #cfd9e6" }} />
            <select name="visibility" defaultValue="public" style={{ padding: 13, borderRadius: 12, border: "1px solid #cfd9e6", background: "white" }}>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="secret">Secret</option>
            </select>
            <button type="submit" style={{ border: 0, borderRadius: 12, padding: 13, background: "#1267d6", color: "white", fontWeight: 900 }}>Create community</button>
          </form>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          {(communities || []).map((community: any) => {
            const members = community.community_members || [];
            const joined = members.some((member: any) => member.user_id === user.id && member.status === "active");
            return (
              <article key={community.id} style={{ background: "white", borderRadius: 22, padding: 20, border: "1px solid #dfe7f1", boxShadow: "0 10px 26px rgba(52,82,119,.05)" }}>
                <span style={{ color: "#1769aa", fontWeight: 900, fontSize: 11, letterSpacing: ".1em" }}>{community.visibility.toUpperCase()} · {community.age_scope.toUpperCase()}</span>
                <h2 style={{ margin: "10px 0 8px", fontSize: 24 }}>{community.name}</h2>
                <p style={{ color: "#60758b", lineHeight: 1.55, minHeight: 48 }}>{community.description || "A new Pantavion community."}</p>
                <div style={{ color: "#60758b", fontSize: 13, marginBottom: 14 }}>{members.filter((m: any) => m.status === "active").length} members</div>
                {joined ? (
                  <span style={{ display: "inline-block", padding: "10px 14px", borderRadius: 999, background: "#eaf8ef", color: "#237a45", fontWeight: 900 }}>Joined</span>
                ) : community.visibility === "public" ? (
                  <form action={joinCommunity}>
                    <input type="hidden" name="communityId" value={community.id} />
                    <button type="submit" style={{ border: 0, borderRadius: 12, padding: "11px 16px", background: "#1267d6", color: "white", fontWeight: 900 }}>Join community</button>
                  </form>
                ) : (
                  <span style={{ color: "#7a6a45", fontWeight: 800 }}>Invitation or approval required</span>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
