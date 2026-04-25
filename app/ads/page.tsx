import { PantavionLaunchSurface } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Pantavion Ads Center | Pantavion One",
  description: "Pantavion Ads Center is designed for sponsored listings, business promotion, local visibility, media promotion and marketplace discovery — clearly labeled and separated from private messages, safety areas and protected youth experiences.",
};

export default function Page() {
  return (
    <PantavionLaunchSurface
      kicker="Pantavion Ads Center"
      title="Promotion belongs in dedicated commercial surfaces, not inside private life."
      lead="Pantavion Ads Center is designed for sponsored listings, business promotion, local visibility, media promotion and marketplace discovery — clearly labeled and separated from private messages, safety areas and protected youth experiences."
      primaryHref="/pricing"
      primaryLabel="View Commercial Access"
      secondaryHref="/"
      secondaryLabel="Back Home"
      cards={[
        { title: "No Intrusive Ads", body: "No ads inside private messages, protected youth areas, safety routes or personal communication.", status: "Foundation" },
        { title: "Sponsored Disclosure", body: "Paid placements must be clearly labeled as sponsored or promoted.", status: "Foundation" },
        { title: "Country and Category Rules", body: "Promotion rules adapt by country, age zone, category, risk and legal boundary.", status: "Foundation" }
      ]}
    />
  );
}
