import { SimpleLegalPage } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Contact Pantavion | Pantavion One",
  description: "Contact and support foundation for users, businesses, founders, creators, partners and legal/safety requests.",
};

export default function Page() {
  return (
    <SimpleLegalPage
      title="Contact Pantavion"
      lead="Contact and support foundation for users, businesses, founders, creators, partners and legal/safety requests."
      sections={[
        { title: "General Contact", body: "Use this route as the public support direction for Pantavion questions, partnerships, business listings, build services and founding access." },
        { title: "Safety Requests", body: "Reports involving minors, abuse, illegal content, impersonation or urgent safety concerns require priority review and escalation workflows." },
        { title: "Business and Stripe", body: "Stripe/payment support, invoices, cancellation questions and business listings should be handled through clear support processes as payment systems go live." }
      ]}
    />
  );
}
