// components/SectionOverview.js
import Link from "next/link";

const sections = [
  { name: "Pulse", path: "/pulse" },
  { name: "People", path: "/people" },
  { name: "Chat", path: "/chat" },
  { name: "Voice", path: "/voice" },
  { name: "Elite", path: "/elite" },
  { name: "Compass", path: "/compass" },
  { name: "Mind", path: "/mind" },
  { name: "Create", path: "/create" },
];

export default function SectionOverview() {
  return (
    <section className="pv-container pb-16">
      <h2 className="text-lg md:text-xl font-semibold mb-4">Pantavion Sections</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sections.map((section) => (
          <Link key={section.name} href={section.path} className="pv-section-button">
            {section.name}
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        More sections for all humanity will come here in the future — health, media, education,
        planet, research, and more — all under Pantavion One.
      </p>
    </section>
  );
}
