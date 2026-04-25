import { PantavionLaunchSurface } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Pantavion Build Services | Pantavion One",
  description: "Pantavion Build Services helps people and businesses turn ideas into websites, apps, automations, dashboards, AI assistants and business systems through structured AI-assisted professional delivery.",
};

export default function Page() {
  return (
    <PantavionLaunchSurface
      kicker="Pantavion Build Services"
      title="Websites, apps, automations, AI assistants and digital systems built through Pantavion."
      lead="Pantavion Build Services helps people and businesses turn ideas into websites, apps, automations, dashboards, AI assistants and business systems through structured AI-assisted professional delivery."
      primaryHref="/pricing"
      primaryLabel="View Commercial Access"
      secondaryHref="/"
      secondaryLabel="Back Home"
      cards={[
        { title: "Build Brief", body: "Idea analysis, project scope, timeline, budget and technical roadmap.", status: "Foundation" },
        { title: "Websites and Apps", body: "Landing pages, business sites, MVPs, dashboards, marketplaces and custom systems.", status: "Foundation" },
        { title: "Support Plans", body: "Monthly maintenance, improvements, automation updates and professional service packages.", status: "Foundation" }
      ]}
    />
  );
}
