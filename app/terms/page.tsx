import { SimpleLegalPage } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Terms of Service | Pantavion One",
  description: "Pantavion terms foundation for launch. Final production terms require formal legal review before regulated or high-risk services go live.",
};

export default function Page() {
  return (
    <SimpleLegalPage
      title="Terms of Service"
      lead="Pantavion terms foundation for launch. Final production terms require formal legal review before regulated or high-risk services go live."
      sections={[
        { title: "Service Stage", body: "Pantavion is a founding-stage global platform. Some routes are live foundations, while advanced providers, payments, databases, voice systems and regulated services release progressively." },
        { title: "Acceptable Use", body: "Users may not use Pantavion for illegal activity, abuse, harassment, exploitation, scams, non-consensual intimate content, spam, rights infringement or unsafe conduct." },
        { title: "No Guarantees", body: "Pantavion provides tools, access and digital capabilities. It does not guarantee income, personal outcomes, legal results, financial returns, medical outcomes or social/romantic success." }
      ]}
    />
  );
}
