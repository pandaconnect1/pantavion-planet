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
            <Link className="pv-button blue" href="/social-core">Open Social World</Link>
            <form action={signOut}>
              <button className="pv-button" type="submit">Logout</button>
            </form>
          </div>
        </div>

        <div
          style={{
            marginBottom: 34,
            borderRadius: 30,
            padding: "clamp(24px,4vw,46px)",
            background:
              "radial-gradient(circle at 15% 20%,rgba(63,181,255,.28),transparent 30%),radial-gradient(circle at 88% 15%,rgba(255,181,84,.24),transparent 32%),linear-gradient(135deg,#ffffff 0%,#edf6ff 52%,#fff8ef 100%)",
            border: "1px solid rgba(38,85,135,.12)",
            boxShadow: "0 22px 60px rgba(34,72,115,.12)",
          }}
        >
          <p style={{ color: "#1769aa", fontWeight: 900, letterSpacing: ".14em", fontSize: 12, margin: 0 }}>NEW · PANTAVION SOCIAL WORLD</p>
          <h2 style={{ fontSize: "clamp(34px,5vw,62px)", lineHeight: 1.02, letterSpacing: "-.04em", margin: "14px 0 16px", color: "#102f55" }}>
            Seven continents. Every age. One connected world.
          </h2>
          <p style={{ color: "#526d88", fontSize: 18, lineHeight: 1.55, maxWidth: 780 }}>
            Enter the new bright global Social Core with personalized Child, Teen, Adult and Elite experiences, unified identity, relationships, safety and language bridging.
          </p>
          <div className="pv-actions" style={{ marginTop: 22 }}>
            <Link className="pv-button blue" href="/social-core">View the new Social World</Link>
            <Link className="pv-button" href="/daily/feed">Open current Feed</Link>
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
          <Link className="pv-card" href="/social-core">
            <StatusBadge status="live-foundation" />
            <h3>Unified Global Social</h3>
            <p>Seven continents, age-personalized experiences, 18 shared modules and one relationship foundation.</p>
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
