import Link from "next/link";
import { SOCIAL_CORE_MODULES } from "@/lib/social-core";

const continents = [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
] as const;

const relationshipLayers = [
  "Family",
  "Friends",
  "Communities",
  "Professional",
  "Business",
  "Learning",
  "Dating",
  "Elite Society",
] as const;

export const metadata = {
  title: "Pantavion Unified Global Social Core",
  description:
    "One global social identity, relationship graph, inbox and language bridge across all seven continents.",
};

export default function SocialCorePage() {
  return (
    <section className="pv-section">
      <div className="pv-container">
        <div className="pv-section-head">
          <div>
            <p className="pv-kicker">Pantavion Social World</p>
            <h1 className="pv-title" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
              One humanity. Seven continents. One living social core.
            </h1>
            <p className="pv-lead">
              A unified global social system for identity, relationships, communities,
              communication, business, discovery, safety and real-time language bridging.
            </p>
          </div>
          <Link className="pv-button gold" href="/dashboard">
            Back to Dashboard
          </Link>
        </div>

        <div className="pv-grid">
          <article className="pv-card">
            <span className="pv-status gold">GLOBAL IDENTITY</span>
            <h3>One profile across Pantavion</h3>
            <p>
              One durable identity and consent model for Social, Chat, Voice, Business,
              Dating, Learning, Safety and Elite Society.
            </p>
          </article>
          <article className="pv-card">
            <span className="pv-status gold">RELATIONSHIP GRAPH</span>
            <h3>Every human connection in one graph</h3>
            <p>
              Family, friends, followers, colleagues, communities, organizations and
              trusted private circles share one relationship foundation.
            </p>
          </article>
          <article className="pv-card">
            <span className="pv-status gold">LANGUAGE BRIDGE</span>
            <h3>Built for bidirectional live translation</h3>
            <p>
              Text, voice, video, captions, posts and rooms will use the same language
              contract instead of separate translation systems.
            </p>
          </article>
        </div>

        <section className="pv-section">
          <div className="pv-section-head">
            <div>
              <p className="pv-kicker">Seven Continents</p>
              <h2>Globally unified, locally governed.</h2>
            </div>
          </div>
          <div className="pv-grid">
            {continents.map((continent) => (
              <article className="pv-card" key={continent}>
                <span className="pv-status gold">CONTINENT</span>
                <h3>{continent}</h3>
                <p>
                  Shared global identity and discovery, with local language, culture,
                  safety and jurisdiction rules.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="pv-section">
          <div className="pv-section-head">
            <div>
              <p className="pv-kicker">Multilevel Social</p>
              <h2>Different relationships, one trusted social foundation.</h2>
            </div>
          </div>
          <div className="pv-grid">
            {relationshipLayers.map((layer) => (
              <article className="pv-card" key={layer}>
                <span className="pv-status gold">RELATIONSHIP LAYER</span>
                <h3>{layer}</h3>
                <p>
                  Uses common identity, policy, permissions, notifications, search and
                  communication services.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="pv-section">
          <div className="pv-section-head">
            <div>
              <p className="pv-kicker">Runtime Registry</p>
              <h2>{SOCIAL_CORE_MODULES.length} connected Social Core foundations.</h2>
            </div>
          </div>
          <div className="pv-grid">
            {SOCIAL_CORE_MODULES.map((module) => (
              <article className="pv-card" key={module.id}>
                <span className="pv-status gold">{module.id}</span>
                <h3>{module.name}</h3>
                <p>
                  {module.capabilities.length > 0
                    ? `${module.capabilities.length} governed capabilities registered.`
                    : "Shared foundation registered for progressive implementation."}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
