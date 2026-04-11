import { PantavionPage } from "../pantavion-clean-ui";

export default function CompassPage() {
  return (
    <PantavionPage
      current="compass"
      title="COMPASS • LIFE NAVIGATION"
      subtitle="Your personal digital compass for places, roles, priorities, services and decisions. This shell prepares the structured navigation layer for life, city and opportunity surfaces."
      cards={[
        {
          title: "Daily life",
          copy: "A placeholder area for routes, cards and practical life navigation decisions.",
        },
        {
          title: "Work and career",
          copy: "A placeholder area for paths, roles, opportunities and decision support for professional life.",
        },
        {
          title: "Health and safety",
          copy: "A placeholder area for safety context, service discovery and protective guidance.",
        },
        {
          title: "City and services",
          copy: "A placeholder area for maps, local infrastructure, alerts and public service navigation.",
        },
      ]}
    />
  );
}
