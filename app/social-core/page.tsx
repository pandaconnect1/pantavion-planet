import Link from "next/link";
import { SOCIAL_CORE_MODULES } from "@/lib/social-core";

const continents = [
  ["Africa", "54 countries · community, culture and opportunity"],
  ["Antarctica", "science, research and global cooperation"],
  ["Asia", "people, business, learning and technology"],
  ["Europe", "multilingual communities and trusted mobility"],
  ["North America", "creators, innovation and professional networks"],
  ["South America", "culture, friendship, commerce and discovery"],
  ["Oceania", "islands, cities, communities and global access"],
] as const;

const ageWorlds = [
  {
    label: "CHILD WORLD",
    title: "Bright, simple and guardian-safe",
    description:
      "Large friendly controls, protected discovery, family connections and learning-first experiences.",
    background: "linear-gradient(135deg,#eaf9ff 0%,#f5efff 55%,#fff8dc 100%)",
    accent: "#2b6cb0",
  },
  {
    label: "TEEN WORLD",
    title: "Creative, social and strongly protected",
    description:
      "Stories, communities, learning, safe messaging and age-aware discovery without adult spaces.",
    background: "linear-gradient(135deg,#fff0f8 0%,#eef4ff 50%,#e9fff6 100%)",
    accent: "#8b3fb0",
  },
  {
    label: "ADULT WORLD",
    title: "Complete personal and professional life",
    description:
      "Friends, communities, dating, business, marketplace, events, travel and global communication.",
    background: "linear-gradient(135deg,#eef8ff 0%,#f7fbff 55%,#fff3e8 100%)",
    accent: "#1261a0",
  },
  {
    label: "ELITE SOCIETY",
    title: "Private circles with vault-grade access",
    description:
      "Invite-only identity, trusted rooms, private business networks, device controls and secure collaboration.",
    background: "linear-gradient(135deg,#fff8de 0%,#fffdf5 50%,#f0f4ff 100%)",
    accent: "#7a5a00",
  },
] as const;

const journeys = [
  ["Discover", "People, communities, knowledge, events, services and opportunities."],
  ["Connect", "Family, friends, followers, colleagues, teams and trusted circles."],
  ["Communicate", "Chat, voice, video, rooms and future live bidirectional translation."],
  ["Create", "Posts, stories, video, communities, events, business pages and learning."],
  ["Grow", "Professional identity, business, marketplace, collaboration and global reach."],
  ["Stay safe", "Age-aware policy, verification, reporting, device security and governance."],
] as const;

export const metadata = {
  title: "Pantavion Social World",
  description:
    "A bright, inclusive and globally unified social world across all seven continents.",
};

export default function SocialCorePage() {
  return (
    <main style={{ background: "#f6f9ff", color: "#10233f", minHeight: "100vh" }}>
      <section
        style={{
          background:
            "radial-gradient(circle at 12% 18%,rgba(77,190,255,.35),transparent 28%),radial-gradient(circle at 88% 14%,rgba(255,185,94,.30),transparent 30%),linear-gradient(135deg,#ffffff 0%,#edf6ff 46%,#fff8ef 100%)",
          borderBottom: "1px solid rgba(16,35,63,.08)",
          padding: "28px 20px 76px",
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <nav style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" style={{ textDecoration: "none", color: "#17375f", fontWeight: 800 }}>
              ← Pantavion Dashboard
            </Link>
            <span style={{ background: "#ffffffcc", border: "1px solid #dce8f7", borderRadius: 999, padding: "10px 16px", fontSize: 13, fontWeight: 900, letterSpacing: ".12em" }}>
              HERE WE ARE ONE
            </span>
          </nav>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 34, alignItems: "center", marginTop: 70 }}>
            <div>
              <p style={{ color: "#1769aa", fontWeight: 900, letterSpacing: ".16em", fontSize: 13 }}>PANTAVION SOCIAL WORLD</p>
              <h1 style={{ fontSize: "clamp(42px,7vw,86px)", lineHeight: .98, margin: "16px 0 24px", letterSpacing: "-.045em" }}>
                Every connection.<br />Every language.<br />One world.
              </h1>
              <p style={{ fontSize: "clamp(18px,2vw,24px)", lineHeight: 1.55, color: "#47617e", maxWidth: 720 }}>
                A multilevel global social universe for every age and every continent — bringing identity, relationships, communication, discovery, business, safety and live language bridging into one welcoming experience.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
                <Link href="/daily/feed" style={{ textDecoration: "none", background: "#1267d6", color: "white", padding: "15px 22px", borderRadius: 14, fontWeight: 900, boxShadow: "0 12px 28px rgba(18,103,214,.22)" }}>
                  Enter Social World
                </Link>
                <Link href="/language" style={{ textDecoration: "none", background: "white", color: "#15365d", padding: "15px 22px", borderRadius: 14, fontWeight: 900, border: "1px solid #d9e6f5" }}>
                  Language Bridge
                </Link>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,.78)", border: "1px solid rgba(136,166,201,.28)", borderRadius: 32, padding: 24, boxShadow: "0 30px 80px rgba(41,78,122,.16)", backdropFilter: "blur(12px)" }}>
              <p style={{ margin: 0, color: "#53708e", fontWeight: 800 }}>Your world at a glance</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12, marginTop: 18 }}>
                {journeys.slice(0, 4).map(([title, text], index) => (
                  <article key={title} style={{ borderRadius: 22, padding: 18, minHeight: 128, background: index % 2 === 0 ? "#edf7ff" : "#fff4e9", border: "1px solid rgba(19,70,118,.06)" }}>
                    <strong style={{ fontSize: 18 }}>{title}</strong>
                    <p style={{ margin: "8px 0 0", color: "#5a7188", lineHeight: 1.45, fontSize: 14 }}>{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "72px 20px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <p style={{ color: "#1671b8", fontWeight: 900, letterSpacing: ".14em", fontSize: 13 }}>PERSONALIZED BY AGE</p>
          <h2 style={{ fontSize: "clamp(34px,5vw,58px)", margin: "12px 0 12px", letterSpacing: "-.035em" }}>One platform. The right world for every person.</h2>
          <p style={{ color: "#5d738b", fontSize: 18, maxWidth: 820, lineHeight: 1.6 }}>
            Pantavion keeps one shared human network while adapting design, permissions, discovery and safety to the user’s age and trust level.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 18, marginTop: 34 }}>
            {ageWorlds.map((world) => (
              <article key={world.label} style={{ background: world.background, borderRadius: 28, padding: 26, border: "1px solid rgba(35,64,97,.08)", boxShadow: "0 16px 38px rgba(55,85,120,.08)" }}>
                <span style={{ color: world.accent, fontWeight: 900, fontSize: 12, letterSpacing: ".14em" }}>{world.label}</span>
                <h3 style={{ fontSize: 24, margin: "14px 0 10px", lineHeight: 1.15 }}>{world.title}</h3>
                <p style={{ color: "#596e85", lineHeight: 1.6, margin: 0 }}>{world.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "70px 20px", background: "white" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <p style={{ color: "#d46b17", fontWeight: 900, letterSpacing: ".14em", fontSize: 13 }}>SEVEN CONTINENTS</p>
          <h2 style={{ fontSize: "clamp(34px,5vw,58px)", margin: "12px 0 30px", letterSpacing: "-.035em" }}>Globally unified. Locally human.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
            {continents.map(([continent, summary], index) => (
              <article key={continent} style={{ borderRadius: 24, padding: 22, background: index % 3 === 0 ? "#eef7ff" : index % 3 === 1 ? "#fff6ec" : "#eefbf6", border: "1px solid rgba(29,71,112,.07)" }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: "#53708d", letterSpacing: ".12em" }}>CONTINENT {index + 1}</span>
                <h3 style={{ fontSize: 25, margin: "12px 0 8px" }}>{continent}</h3>
                <p style={{ color: "#60758b", lineHeight: 1.5, margin: 0 }}>{summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "72px 20px", background: "linear-gradient(180deg,#f6f9ff 0%,#eef5ff 100%)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <p style={{ color: "#1671b8", fontWeight: 900, letterSpacing: ".14em", fontSize: 13 }}>ONE CONNECTED RUNTIME</p>
          <h2 style={{ fontSize: "clamp(34px,5vw,58px)", margin: "12px 0 30px", letterSpacing: "-.035em" }}>{SOCIAL_CORE_MODULES.length} foundations, one social experience.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
            {SOCIAL_CORE_MODULES.map((module) => (
              <article key={module.id} style={{ background: "white", borderRadius: 20, padding: 20, border: "1px solid #dfe9f5", boxShadow: "0 10px 26px rgba(52,82,119,.06)" }}>
                <span style={{ color: "#1671b8", fontWeight: 900, fontSize: 11, letterSpacing: ".1em" }}>{module.id.toUpperCase()}</span>
                <h3 style={{ margin: "10px 0 8px", fontSize: 19 }}>{module.name}</h3>
                <p style={{ margin: 0, color: "#667b90", lineHeight: 1.45, fontSize: 14 }}>
                  {module.capabilities.length > 0
                    ? `${module.capabilities.length} governed capabilities connected.`
                    : "Shared foundation ready for progressive implementation."}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
