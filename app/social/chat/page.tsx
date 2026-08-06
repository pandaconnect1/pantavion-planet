import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createConversation, sendMessage } from "./actions";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ conversation?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/chat");

  const { data: memberships } = await supabase
    .from("conversation_members")
    .select("conversation_id, conversations(id,title,kind,updated_at)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const activeId = params.conversation || memberships?.[0]?.conversation_id;
  const { data: messages } = activeId
    ? await supabase
        .from("messages")
        .select("id,body,sender_id,created_at,profiles:sender_id(display_name,username)")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true })
        .limit(200)
    : { data: [] as any[] };

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8fc", color: "#10233f", padding: 20 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, color: "#1769aa", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 }}>PANTAVION CHAT</p>
            <h1 style={{ margin: "8px 0 0", fontSize: "clamp(34px,5vw,58px)" }}>Unified conversations</h1>
          </div>
          <Link href="/social-core" style={{ textDecoration: "none", fontWeight: 800, color: "#1769aa" }}>← Social World</Link>
        </div>

        {params.error ? <div style={{ background: "#fff1f1", border: "1px solid #f5bcbc", padding: 14, borderRadius: 14, marginBottom: 16 }}>{params.error}</div> : null}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(240px,320px) 1fr", gap: 18 }}>
          <aside style={{ background: "white", borderRadius: 22, padding: 16, border: "1px solid #dfe7f1", minHeight: 620 }}>
            <form action={createConversation} style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              <input name="title" placeholder="Conversation title" maxLength={100} style={{ padding: 12, borderRadius: 12, border: "1px solid #cfd9e6" }} />
              <button type="submit" style={{ border: 0, borderRadius: 12, padding: 12, background: "#1267d6", color: "white", fontWeight: 900 }}>New conversation</button>
            </form>
            <div style={{ display: "grid", gap: 8 }}>
              {(memberships || []).map((item: any) => {
                const conversation = Array.isArray(item.conversations) ? item.conversations[0] : item.conversations;
                return (
                  <Link key={item.conversation_id} href={`/social/chat?conversation=${item.conversation_id}`} style={{ textDecoration: "none", color: "inherit", padding: 12, borderRadius: 14, background: activeId === item.conversation_id ? "#e9f3ff" : "#f7f9fc", border: "1px solid #e4ebf3" }}>
                    <strong>{conversation?.title || "Conversation"}</strong>
                    <div style={{ color: "#6a7d91", fontSize: 13, marginTop: 4 }}>{conversation?.kind || "chat"}</div>
                  </Link>
                );
              })}
            </div>
          </aside>

          <section style={{ background: "white", borderRadius: 22, border: "1px solid #dfe7f1", minHeight: 620, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 18, borderBottom: "1px solid #e7edf4", fontWeight: 900 }}>{activeId ? "Conversation" : "Create or select a conversation"}</div>
            <div style={{ flex: 1, padding: 18, display: "grid", alignContent: "start", gap: 12, overflowY: "auto" }}>
              {(messages || []).map((message: any) => {
                const own = message.sender_id === user.id;
                const profile = Array.isArray(message.profiles) ? message.profiles[0] : message.profiles;
                return (
                  <article key={message.id} style={{ justifySelf: own ? "end" : "start", maxWidth: "78%", background: own ? "#1267d6" : "#edf3f9", color: own ? "white" : "#10233f", borderRadius: 18, padding: "11px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, opacity: .75, marginBottom: 5 }}>{own ? "You" : profile?.display_name || profile?.username || "Member"}</div>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{message.body}</div>
                  </article>
                );
              })}
            </div>
            {activeId ? (
              <form action={sendMessage} style={{ display: "flex", gap: 10, padding: 16, borderTop: "1px solid #e7edf4" }}>
                <input type="hidden" name="conversationId" value={activeId} />
                <input name="body" required maxLength={10000} placeholder="Write a message…" style={{ flex: 1, padding: 13, borderRadius: 13, border: "1px solid #cfd9e6" }} />
                <button type="submit" style={{ border: 0, borderRadius: 13, padding: "0 20px", background: "#1267d6", color: "white", fontWeight: 900 }}>Send</button>
              </form>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
