import Link from "next/link";
import { redirect } from "next/navigation";
import { pantavionFamilies, pantavionRoutes } from "@/core/platform/pantavion-registry";
import { StatusBadge } from "@/components/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

const daily = pantavionRoutes.filter((route) => route.path.startsWith("/daily/"));
const global = pantavionRoutes.filter((route) => route.path.startsWith("/global/"));

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, country, language")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.first_name ||
    user.email?.split("@")[0] ||
    "Pantavion member";

  return (
    <section className="pv-section">
      <div className="pv-container">
        <div className="pv-panel" style={{ marginBottom: 28 }}>
          <span className="pv-status gold">Authenticated session</span>
          <h1 style={{ marginBottom: 8 }}>Καλώς ήρθες, {displayName}.</h1>
          <p className="pv-muted" style={{ marginBottom: 18 }}>
            {user.email} · {profile?.country || "Country not set"} · {profile?.language || "el"}
          </p>
          <div className="pv-actions">
            <Link className="pv-button gold" href="/profile">Edit real profile</Link>
            <Link className="pv-button blue" href="/daily/feed">Open Social Feed</Link>
            <form action={signOut}>
              <button className="pv-button" type="submit">Logout</button>
            </form>
          </div>
        </div>

        <div className="pv-section-head">
          <div>
            <p className="pv-kicker">Pantavion Dashboard</p>
            <h2 className="pv-title" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
              The living control screen.
            </h2>
            <p className="pv-lead">
              Your authenticated identity now controls access to the dashboard and profile surfaces.
            </p>
          </div>
          <Link className="pv-button gold" href="/intelligence/execute">Execute with PantaAI</Link>
        </div>

        <div className="pv-grid">
          <Link className="pv-card" href="/profile">
            <StatusBadge status="live-foundation" />
            <h3>Identity & Profile</h3>
            <p>Supabase-backed account, profile fields, protected access and real session logout.</p>
          </Link>
          <Link className="pv-card" href="/language">
            <StatusBadge status="live-foundation" />
            <h3>Translate Assist</h3>
            <p>Text bridge route and API shell. Next: voice, captions and rooms.</p>
          </Link>
          <Link className="pv-card" href="/safety">
            <StatusBadge status="live-foundation" />
            <h3>SOS / Safety</h3>
            <p>Safety Center, minors, reports and lawful escalation foundations.</p>
          </Link>
        </div>

        <section className="pv-section">
          <div className="pv-section-head">
            <div>
              <p className="pv-kicker">Daily Hub</p>
              <h2>Chat, stories, video, music, dating, market and sports.</h2>
            </div>
          </div>
          <div className="pv-grid">
            {daily.map((route) => (
              <Link className="pv-card" href={route.path} key={route.path}>
                <StatusBadge status={route.status} />
                <h3>{route.title.replace("Daily Hub — ", "")}</h3>
                <p>{route.summary}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="pv-section">
          <div className="pv-section-head">
            <div>
              <p className="pv-kicker">Global Hub</p>
              <h2>Countries, maritime, aviation, history, conflicts, technology and environment.</h2>
            </div>
          </div>
          <div className="pv-grid">
            {global.map((route) => (
              <Link className="pv-card" href={route.path} key={route.path}>
                <StatusBadge status={route.status} />
                <h3>{route.title.replace("Global Hub — ", "")}</h3>
                <p>{route.summary}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="pv-section">
          <div className="pv-section-head">
            <div>
              <p className="pv-kicker">Platform Families</p>
              <h2>All major Pantavion systems are visible and reachable.</h2>
            </div>
          </div>
          <div className="pv-grid">
            {pantavionFamilies.map((family) => (
              <Link className="pv-card" href={family.routes[0]} key={family.key}>
                <span className="pv-status gold">{family.key}</span>
                <h3>{family.title}</h3>
                <p>{family.promise}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
