import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

function notificationLabel(type: string) {
  const labels: Record<string, string> = {
    follow: "New follower",
    friend_request: "Friend request",
    friend_accepted: "Friend request accepted",
    reaction: "New reaction",
    comment: "New comment",
    message: "New message",
    community: "Community update",
    system: "Pantavion update",
  };
  return labels[type] || type.replaceAll("_", " ");
}

function notificationText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "You have a new notification.";
  const data = payload as Record<string, unknown>;
  const candidate = data.message ?? data.text ?? data.body ?? data.title;
  return typeof candidate === "string" && candidate.trim() ? candidate : "You have a new notification.";
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/notifications");

  const { data: notifications } = await supabase
    .from("social_notifications")
    .select("id,type,payload,read_at,created_at,actor_id")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const items = notifications || [];
  const unread = items.filter((item: any) => !item.read_at).length;

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8fc", color: "#10233f", padding: 20 }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
          <div>
            <p style={{ margin: 0, color: "#1769aa", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 }}>PANTAVION SOCIAL</p>
            <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(34px,5vw,56px)" }}>Notifications</h1>
            <p style={{ margin: 0, color: "#60758c" }}>{unread} unread · {items.length} recent</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {unread > 0 ? (
              <form action={markAllNotificationsRead}>
                <button type="submit" style={{ border: "1px solid #cbdced", borderRadius: 12, padding: "10px 14px", background: "white", color: "#125caa", fontWeight: 900 }}>
                  Mark all read
                </button>
              </form>
            ) : null}
            <Link href="/social-core" style={{ textDecoration: "none", fontWeight: 900, color: "#1769aa" }}>← Social World</Link>
          </div>
        </header>

        <section style={{ display: "grid", gap: 10 }}>
          {items.length === 0 ? (
            <div style={{ background: "white", border: "1px solid #dde7f1", borderRadius: 20, padding: 28, color: "#60758c" }}>
              No notifications yet. New social activity will appear here.
            </div>
          ) : items.map((item: any) => (
            <article key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "center", background: item.read_at ? "white" : "#eef6ff", border: item.read_at ? "1px solid #dde7f1" : "1px solid #bfdcff", borderRadius: 18, padding: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ textTransform: "capitalize" }}>{notificationLabel(item.type)}</strong>
                  {!item.read_at ? <span style={{ fontSize: 11, fontWeight: 900, color: "#0b68cc", background: "#dceeff", padding: "3px 7px", borderRadius: 999 }}>NEW</span> : null}
                </div>
                <p style={{ margin: "6px 0 5px", color: "#40566e", lineHeight: 1.45 }}>{notificationText(item.payload)}</p>
                <time style={{ color: "#7a8da1", fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</time>
              </div>
              {!item.read_at ? (
                <form action={markNotificationRead}>
                  <input type="hidden" name="notificationId" value={item.id} />
                  <button type="submit" style={{ border: 0, borderRadius: 11, padding: "9px 12px", background: "#1267d6", color: "white", fontWeight: 900 }}>
                    Read
                  </button>
                </form>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
