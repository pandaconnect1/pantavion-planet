import Link from "next/link";
import { pantavionFamilies, pantavionRoutes } from "@/core/platform/pantavion-registry";
import { StatusBadge } from "@/components/StatusBadge";

const daily = pantavionRoutes.filter((route) => route.path.startsWith("/daily/"));
const global = pantavionRoutes.filter((route) => route.path.startsWith("/global/"));

export default function DashboardPage() {
  return (
    <section className="pv-section">
      <div className="pv-container">
        <div className="pv-section-head">
          <div>
            <p className="pv-kicker">Pantavion Dashboard</p>
            <h1 className="pv-title" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
              The living control screen.
            </h1>
            <p className="pv-lead">
              Daily Hub, Global Hub, Language Bridge, PantaAI, Work, Safety and Identity
              are now real navigable surfaces, not static buttons.
            </p>
          </div>
          <Link className="pv-button gold" href="/intelligence/execute">Execute with PantaAI</Link>
        </div>

        <div className="pv-grid">
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

          <Link className="pv-card" href="/import">
            <StatusBadge status="active-preview" />
            <h3>Import Contacts</h3>
            <p>Contact import route ready for consent-first integrations.</p>
          </Link>
        </div>

        <section className="pv-section">
          <div className="pv-section-head">
            <div>
              <p className="pv-kicker">Daily Hub</p>
              <h2>Chat, stories, video, music, dating, market, sports.</h2>
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
              <h2>Countries, maritime, aviation, history, conflicts, technology, politics, environment.</h2>
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
              <h2>All major Pantavion systems are now visible and reachable.</h2>
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
