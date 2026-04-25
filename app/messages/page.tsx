import { PantavionLaunchSurface } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Pantavion Messages | Pantavion One",
  description: "Pantavion Messages is designed for one-to-one chat, groups, channels, communities, secure communication, voice/video routes, live translation and lawful contact import — all under user control.",
};

export default function Page() {
  return (
    <PantavionLaunchSurface
      kicker="Pantavion Messages"
      title="The native communication layer of Pantavion."
      lead="Pantavion Messages is designed for one-to-one chat, groups, channels, communities, secure communication, voice/video routes, live translation and lawful contact import — all under user control."
      primaryHref="/pricing"
      primaryLabel="View Commercial Access"
      secondaryHref="/"
      secondaryLabel="Back Home"
      cards={[
        { title: "Pantavion Connect", body: "Our own communication channel, not a dependency on WhatsApp, Viber, Messenger, LINE or Telegram.", status: "Foundation" },
        { title: "Secure Channels", body: "Private higher-security rooms for verified users, leaders, professionals, creators and protected communities.", status: "Foundation" },
        { title: "Translation by Design", body: "Built for multilingual communication, captions, voice routes and global language access.", status: "Foundation" }
      ]}
    />
  );
}
