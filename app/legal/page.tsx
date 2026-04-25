import { SimpleLegalPage } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Legal Center | Pantavion One",
  description: "The Pantavion legal center organizes terms, privacy, refunds, acceptable use, safety, age rules and future country-specific compliance.",
};

export default function Page() {
  return (
    <SimpleLegalPage
      title="Legal Center"
      lead="The Pantavion legal center organizes terms, privacy, refunds, acceptable use, safety, age rules and future country-specific compliance."
      sections={[
        { title: "Country Compliance", body: "Pantavion will need country-specific rules for payments, marketplace, media rights, adult zones, minors, data protection and regulated services." },
        { title: "Commercial Integrity", body: "Sponsored content, business listings and paid promotion must be clearly labeled and separated from private communication." },
        { title: "Protected Experiences", body: "Minors, private messages, safety routes and sensitive categories must never be exposed to inappropriate ads, adult content or unsafe discovery." }
      ]}
    />
  );
}
