import WaterLiveGisClient from "./water-live-gis-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water — Live GIS",
  description:
    "Provider-neutral MapLibre GIS runtime for protected Pantavion Water Maps A, B and C.",
};

export default async function WaterLiveGisPage({
  searchParams,
}: {
  searchParams: Promise<{ map?: string }>;
}) {
  const params = await searchParams;
  const requested = String(params.map || "A").toUpperCase();
  const initialMap = requested === "B" || requested === "C" ? requested : "A";

  return <WaterLiveGisClient initialMap={initialMap} />;
}
