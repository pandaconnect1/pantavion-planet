import { PantavionLaunchSurface } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Import My World | Pantavion One",
  description: "Pantavion Import My World is designed for lawful user-controlled import: phone contacts, email contacts, CSV/vCard, exported chats, social handles, work accounts and media archives — only with permission and always under user control.",
};

export default function Page() {
  return (
    <PantavionLaunchSurface
      kicker="Import My World"
      title="Bring contacts, messages, emails, social handles and digital history into one living screen."
      lead="Pantavion Import My World is designed for lawful user-controlled import: phone contacts, email contacts, CSV/vCard, exported chats, social handles, work accounts and media archives — only with permission and always under user control."
      primaryHref="/pricing"
      primaryLabel="View Commercial Access"
      secondaryHref="/"
      secondaryLabel="Back Home"
      cards={[
        { title: "Consent First", body: "No hidden scraping. No secret imports. Every source requires user authorization or user-provided export.", status: "Foundation" },
        { title: "Global App Atlas", body: "The platform tracks apps by country, region, category, legal import path and integration priority.", status: "Foundation" },
        { title: "Universal Inbox Direction", body: "The long-term goal is one governed communication center for messages, email, social and work communication.", status: "Foundation" }
      ]}
    />
  );
}
