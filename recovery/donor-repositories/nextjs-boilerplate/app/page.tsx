"use client";

import Link from "next/link";

const modules = [
  { id: "pulse", label: "Pulse" },
  { id: "people", label: "People" },
  { id: "chat", label: "Chat" },
  { id: "voice", label: "Live Voice Interpreter" },
  { id: "compass", label: "Compass (Help Me)" },
  { id: "mind", label: "Mind" },
  { id: "create", label: "Create" },
  { id: "stories", label: "Stories" },
  { id: "music", label: "Music" },
  { id: "dating", label: "Dating" },
  { id: "health", label: "Health" },
  { id: "calendar", label: "Calendar & Reminders" },
  { id: "culture", label: "Culture" },
  { id: "environment", label: "Environment" },
  { id: "education", label: "Education" },
  { id: "sports", label: "Sports" },
  { id: "news", label: "News" },
  { id: "work", label: "Work & Business" },
  { id: "family", label: "Family & Friends" },
  { id: "finance", label: "Finance & Banks" },
  { id: "marine", label: "Marine" },
  { id: "flights", label: "Flights & Travel" },
  { id: "tourism", label: "Tourism" },
  { id: "politics", label: "Politics" },
  { id: "faiths", label: "Faiths & Religions" },
  { id: "vrar", label: "VR / AR" },
  { id: "media", label: "Multimedia" },
  { id: "contacts", label: "Contacts & Friends Import" }
];

export default function HomePage() {
  return (
    <div className="pv-landing">
      <section className="pv-hero">
        <h1>Pantavion One</h1>
        <p className="pv-hero-subtitle">
          One Platform. All Life. — Ένας ζωντανός, παγκόσμιος κόμβος για ανθρώπους,
          φωνή, γνώση και ευκαιρίες.
        </p>
        <div className="pv-hero-actions">
          <Link href="/voice" className="pv-button pv-button-primary">
            🎙 Start Live Voice Interpreter
          </Link>
          <Link href="/contacts" className="pv-button pv-button-secondary">
            👥 Bring My Contacts
          </Link>
        </div>
        <p className="pv-hero-footnote">
          Χωρίς εγγραφή για αρχή. Μπαίνεις, μιλάς, μεταφράζεις, φέρνεις τις επαφές σου
          — όλα σε ένα μέρος.
        </p>
      </section>

      <section className="pv-grid-section">
        <h2>Explore the Pantavion One map</h2>
        <p className="pv-section-subtitle">
          Οι βασικές ενότητες. 28 κουμπιά — για κάθε πλευρά της ζωής.
        </p>
        <div className="pv-grid">
          {modules.map((m) => (
            <Link
              key={m.id}
              href={m.id === "voice" ? "/voice" : m.id === "contacts" ? "/contacts" : `/${m.id}`}
              className={`pv-tile ${
                m.id === "voice" || m.id === "contacts" ? "pv-tile-highlight" : ""
              }`}
            >
              <span>{m.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
