import WaterMapNavigation from "../water-map-navigation";
import InfrastructureOperationsClient from "./infrastructure-operations-client";

export const metadata = {
  title: "Pantavion Infrastructure Operations",
  description:
    "Fast mobile-first utility overlays, GPS field checks and temporary infrastructure layers for Pantavion Water.",
};

export default function InfrastructureOperationsPage() {
  return (
    <>
      <WaterMapNavigation title="Infrastructure Operations" />
      <main className="min-h-screen bg-[#06101f] px-2 py-3 text-white sm:px-4 sm:py-5">
        <section className="mx-auto max-w-[1800px]">
          <InfrastructureOperationsClient />
        </section>
      </main>
    </>
  );
}
