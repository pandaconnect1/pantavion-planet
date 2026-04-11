import { PantavionPage } from "../pantavion-clean-ui";

export default function PeoplePage() {
  return (
    <PantavionPage
      current="people"
      title="PEOPLE • GLOBAL PROFILES"
      subtitle="The human heart of Pantavion One: profiles, identities, circles, trust and relationships. This page becomes the base surface for people, contact layers and future social continuity."
      cards={[
        {
          eyebrow: "Core profile template",
          title: "Primary user profile",
          copy: "This area will host the essential user profile with name, photo, role, location, Pantavion level and continuity identity.",
          bullets: [
            "Full name and profile picture",
            "Country, city and timezone",
            "Role, profession or organization",
            "Pantavion level and trust layers",
            "Short bio and structured identity",
          ],
          highlight: true,
        },
        {
          eyebrow: "Coming next",
          title: "People expansion plan",
          copy: "The next layer will connect contacts sync, relationship types, trust cards and safe identity bridges across the ecosystem.",
          bullets: [
            "Contacts Sync with GDPR-safe logic",
            "Family, friends and professional graph",
            "Multiple real-world identity modes",
            "Trust card for verified continuity",
          ],
        },
      ]}
    />
  );
}
