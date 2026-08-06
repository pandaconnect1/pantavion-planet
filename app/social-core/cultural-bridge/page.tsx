"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const countryProfiles = {
  Cyprus: {
    partner: "China",
    colors: ["#0b5fff", "#12b886", "#ffb703"],
    highlights: {
      culture: ["Ancient Kourion", "Lefkara lace", "Cypriot hospitality"],
      travel: ["Limassol seafront", "Troodos villages", "Paphos archaeological park"],
      food: ["Halloumi", "Souvla", "Loukoumades"],
      business: ["Shipping", "Tourism", "Professional services"],
    },
  },
  China: {
    partner: "Cyprus",
    colors: ["#dc2626", "#f59e0b", "#7c3aed"],
    highlights: {
      culture: ["Forbidden City", "Silk traditions", "Chinese calligraphy"],
      travel: ["Great Wall", "Shanghai skyline", "Guilin landscapes"],
      food: ["Dim sum", "Hot pot", "Peking duck"],
      business: ["Technology", "Manufacturing", "Cross-border trade"],
    },
  },
} as const;

type CountryName = keyof typeof countryProfiles;
type TopicName = keyof (typeof countryProfiles)[CountryName]["highlights"];

const topics: TopicName[] = ["culture", "travel", "food", "business"];

export default function CulturalBridgePage() {
  const [viewerCountry, setViewerCountry] = useState<CountryName>("Cyprus");
  const [topic, setTopic] = useState<TopicName>("culture");
  const [mode, setMode] = useState<"automatic" | "manual" | "hybrid">("hybrid");
  const [query, setQuery] = useState("");

  const partnerCountry = countryProfiles[viewerCountry].partner as CountryName;
  const items = useMemo(() => {
    const source = countryProfiles[partnerCountry].highlights[topic];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return source;
    return source.filter((item) => item.toLowerCase().includes(normalized));
  }, [partnerCountry, topic, query]);

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f8fbff 0%,#eef5ff 48%,#ffffff 100%)", color: "#10233f" }}>
      <section style={{ padding: "28px 20px 16px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, letterSpacing: ".14em", color: "#0b5fff" }}>PANTAVION CULTURAL BRIDGE</p>
            <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(34px,6vw,68px)", lineHeight: 1.02 }}>See the other person’s world while you talk.</h1>
            <p style={{ maxWidth: 760, fontSize: 18, lineHeight: 1.6, color: "#52657d" }}>
              The interface adapts to country, conversation topic and user choice. The algorithm suggests; the user stays in control.
            </p>
          </div>
          <Link href="/social-core" style={{ textDecoration: "none", background: "#10233f", color: "white", padding: "12px 18px", borderRadius: 14, fontWeight: 800 }}>
            Back to Social World
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 20px 42px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: 18 }}>
          <label style={panelStyle}>
            <span style={labelStyle}>I am viewing from</span>
            <select value={viewerCountry} onChange={(e) => setViewerCountry(e.target.value as CountryName)} style={controlStyle}>
              {Object.keys(countryProfiles).map((country) => <option key={country}>{country}</option>)}
            </select>
          </label>

          <label style={panelStyle}>
            <span style={labelStyle}>Conversation topic</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value as TopicName)} style={controlStyle}>
              {topics.map((entry) => <option key={entry} value={entry}>{entry[0].toUpperCase() + entry.slice(1)}</option>)}
            </select>
          </label>

          <label style={panelStyle}>
            <span style={labelStyle}>Adaptation mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} style={controlStyle}>
              <option value="automatic">Automatic</option>
              <option value="hybrid">Hybrid</option>
              <option value="manual">Manual</option>
            </select>
          </label>
        </div>

        <div style={{ ...panelStyle, marginBottom: 18 }}>
          <span style={labelStyle}>Ask to see something specific</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${partnerCountry} ${topic}...`} style={controlStyle} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 }}>
          <article style={{ ...cardStyle, background: "linear-gradient(135deg,#0b5fff,#4f8cff)", color: "white" }}>
            <span style={{ fontWeight: 800, opacity: .82 }}>LIVE CONTEXT</span>
            <h2 style={{ margin: "10px 0" }}>{viewerCountry} ↔ {partnerCountry}</h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>Mode: {mode}. Showing {topic} because it matches the active conversation context and your selected preference.</p>
          </article>

          {items.length > 0 ? items.map((item, index) => (
            <article key={item} style={{ ...cardStyle, borderTop: `6px solid ${countryProfiles[partnerCountry].colors[index % countryProfiles[partnerCountry].colors.length]}` }}>
              <span style={{ fontWeight: 800, color: "#0b5fff", textTransform: "uppercase" }}>{topic}</span>
              <h3 style={{ fontSize: 24, margin: "10px 0" }}>{item}</h3>
              <p style={{ color: "#5a6d84", lineHeight: 1.6, marginBottom: 0 }}>
                Suggested for this cross-culture conversation. The user can replace, hide or refine this card.
              </p>
            </article>
          )) : (
            <article style={cardStyle}>
              <h3>No matching card yet</h3>
              <p style={{ color: "#5a6d84" }}>Change the topic or clear the search to reveal more suggestions.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}

const panelStyle = { background: "rgba(255,255,255,.94)", border: "1px solid #dce7f5", borderRadius: 18, padding: 16, boxShadow: "0 12px 28px rgba(16,35,63,.07)" } as const;
const cardStyle = { background: "white", border: "1px solid #dce7f5", borderRadius: 22, padding: 22, boxShadow: "0 16px 36px rgba(16,35,63,.08)" } as const;
const labelStyle = { display: "block", fontSize: 13, fontWeight: 900, letterSpacing: ".06em", marginBottom: 8, color: "#52657d" } as const;
const controlStyle = { width: "100%", border: "1px solid #cbd8ea", borderRadius: 12, padding: "12px 14px", background: "white", color: "#10233f", fontSize: 16 } as const;
