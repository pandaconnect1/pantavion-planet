import { PantavionLaunchSurface } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Pantavion Connect | Pantavion One",
  description: "Pantavion Connect is the future native chat, call, group, community and channel system of Pantavion, designed to operate alongside lawful bridges and import tools from the wider digital world.",
};

export default function Page() {
  return (
    <PantavionLaunchSurface
      kicker="Pantavion Connect"
      title="Bring people into one governed communication ecosystem."
      lead="Pantavion Connect is the future native chat, call, group, community and channel system of Pantavion, designed to operate alongside lawful bridges and import tools from the wider digital world."
      primaryHref="/pricing"
      primaryLabel="View Commercial Access"
      secondaryHref="/"
      secondaryLabel="Back Home"
      cards={[
        { title: "Native Chat", body: "Messaging, groups, channels and communities under Pantavion identity and safety rules.", status: "Foundation" },
        { title: "Lawful Bridges", body: "External contacts and exports only through official APIs, OAuth, uploads or user consent.", status: "Foundation" },
        { title: "Privacy Controls", body: "Users decide what is public, private, imported, deleted, hidden or connected.", status: "Foundation" }
      ]}
    />
  );
}
