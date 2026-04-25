import { PantavionLaunchSurface } from "@/components/PantavionLaunchSurface";

export const metadata = {
  title: "Pantavion Market | Pantavion One",
  description: "Pantavion Market organizes sales, rentals, requests, services, businesses, events and opportunities by country, region, city, community, parish, neighborhood and category — without intrusive ads inside private communication.",
};

export default function Page() {
  return (
    <PantavionLaunchSurface
      kicker="Pantavion Market"
      title="Professional listings, services, business discovery and local-to-global opportunities."
      lead="Pantavion Market organizes sales, rentals, requests, services, businesses, events and opportunities by country, region, city, community, parish, neighborhood and category — without intrusive ads inside private communication."
      primaryHref="/pricing"
      primaryLabel="View Commercial Access"
      secondaryHref="/"
      secondaryLabel="Back Home"
      cards={[
        { title: "Local Listings", body: "Sell, rent, request or offer by country, region, city, community and category.", status: "Foundation" },
        { title: "Business Listings", body: "Professional business pages, verified sellers and service visibility.", status: "Foundation" },
        { title: "Closed Easily", body: "Listings can become Active, Sold, Rented, Paused, Closed or Expired with simple controls.", status: "Foundation" }
      ]}
    />
  );
}
