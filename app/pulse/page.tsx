import { PantavionPage } from "../pantavion-clean-ui";

export default function PulsePage() {
  return (
    <PantavionPage
      current="pulse"
      title="PULSE • WORLD ACTIVITY"
      subtitle="Here the world pulse comes alive: news, civic movement, alerts, human activity and system signals. This is the first clean shell for the Pulse surface inside pantavion-planet."
      cards={[
        {
          eyebrow: "Pulse 1",
          title: "Global news signal",
          copy: "A live card area for international updates, trusted feeds, civic alerts and cross-border signals.",
        },
        {
          eyebrow: "Pulse 2",
          title: "Local city update",
          copy: "A local layer for city activity, infrastructure notices, municipality streams and neighborhood context.",
        },
        {
          eyebrow: "Pulse 3",
          title: "Emergency channel",
          copy: "A protected lane for urgent notices, verified safety alerts and escalation signals when continuity matters.",
        },
      ]}
    />
  );
}
