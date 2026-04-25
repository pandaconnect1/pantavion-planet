import { PantavionLaunchSurface } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Founding Access | Pantavion One",
  description: "Founding access to Pantavion One.",
};

export default function FoundingAccessPage() {
  return (
    <PantavionLaunchSurface
      kicker="Pantavion Founding Access"
      title="Support the foundation of a global AI, communication, media, work and language ecosystem."
      lead="Founding Access supports the development of Pantavion One: a living platform for AI execution, social connection, communication, creation, work, services, marketplace, media, safety and global language access."
      primaryHref="/pricing"
      primaryLabel="View Pricing"
      secondaryHref="/contact"
      secondaryLabel="Contact Pantavion"
      cards={[
        { title: "30-Day Trial", body: "A launch trial with fair-use limits so the world can discover Pantavion without exposing the platform to abuse.", status: "Trial" },
        { title: "Development Support", body: "Subscriptions support infrastructure, AI systems, media surfaces, security, language tools and legal rollout.", status: "Commercial" },
        { title: "No False Guarantees", body: "Pantavion provides tools and access. It does not guarantee user income, personal outcomes or regulated results.", status: "Trust" },
      ]}
    />
  );
}
