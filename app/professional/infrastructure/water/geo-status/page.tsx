import { DeviceGeoStatusClient } from "@/components/geo/DeviceGeoStatusClient";

export const dynamic = "force-dynamic";

export default function PantavionWaterGeoStatusPage() {
  return (
    <main className="min-h-screen bg-[#02040b] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <DeviceGeoStatusClient />
      </div>
    </main>
  );
}
