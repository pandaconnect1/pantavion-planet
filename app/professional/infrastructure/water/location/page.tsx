import WaterMapNavigation from "../water-map-navigation";
import WaterLocationNavigationClient from "./water-location-navigation-client";

export const metadata = {
  title: "Pantavion Location & Navigation",
  description:
    "Cyprus address, building and field-location search with embedded routing for Pantavion Water GIS.",
};

export default function WaterLocationNavigationPage() {
  return (
    <>
      <WaterMapNavigation title="Pantavion Location & Navigation" />
      <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
        <section className="mx-auto max-w-6xl">
          <WaterLocationNavigationClient />
        </section>
      </main>
    </>
  );
}
