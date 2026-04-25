import { PantavionLaunchSurface } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Pantavion Creator Studio | Pantavion One",
  description: "Pantavion Creator Studio helps people, creators and businesses create, edit, animate, translate, publish and promote videos, cartoon content, voice media, songs, messages and multilingual digital stories.",
};

export default function Page() {
  return (
    <PantavionLaunchSurface
      kicker="Pantavion Creator Studio"
      title="Create video, cartoon, voice, music, dubbing and multilingual media."
      lead="Pantavion Creator Studio helps people, creators and businesses create, edit, animate, translate, publish and promote videos, cartoon content, voice media, songs, messages and multilingual digital stories."
      primaryHref="/pricing"
      primaryLabel="View Commercial Access"
      secondaryHref="/"
      secondaryLabel="Back Home"
      cards={[
        { title: "Video Studio", body: "Upload, edit, caption, translate, cut clips, improve audio and prepare creator or business videos.", status: "Foundation" },
        { title: "Cartoon Studio", body: "Create original cartoon-style videos and animations without copying protected characters or brands.", status: "Foundation" },
        { title: "Voice Studio", body: "Polish user-owned voices, licensed synthetic voices, dubbing, radio messages and business audio spots.", status: "Foundation" }
      ]}
    />
  );
}
