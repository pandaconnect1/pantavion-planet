import { PantavionLaunchSurface } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Pantavion Radio | Pantavion One",
  description: "Pantavion Radio is a future media network for talk shows, sports commentary, journalism, culture, creator shows, licensed music, community messages, sponsor slots and AI-assisted multilingual voice participation.",
};

export default function Page() {
  return (
    <PantavionLaunchSurface
      kicker="Pantavion Radio"
      title="Multilingual internet radio, journalism, sports, music and community voice."
      lead="Pantavion Radio is a future media network for talk shows, sports commentary, journalism, culture, creator shows, licensed music, community messages, sponsor slots and AI-assisted multilingual voice participation."
      primaryHref="/pricing"
      primaryLabel="View Commercial Access"
      secondaryHref="/"
      secondaryLabel="Back Home"
      cards={[
        { title: "Listener Messages", body: "Text or voice messages can be moderated, translated and converted to approved human-style voice for broadcast.", status: "Foundation" },
        { title: "Sports and Journalism", body: "Analysis, commentary, community reports and sponsored segments with rights and source controls.", status: "Foundation" },
        { title: "Music Rights", body: "Commercial music requires licenses. Initial focus should be talk, original, licensed or royalty-cleared content.", status: "Foundation" }
      ]}
    />
  );
}
