import PantavionOwnedMapPilotClient from "./pantavion-owned-map-pilot-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water · Owned Map Engine Pilot",
  description:
    "Provider-independent Pantavion map-engine pilot using open vector-map data with the protected authentic Water network overlaid.",
};

export default function PantavionOwnedMapPilotPage() {
  const styleUrl =
    process.env.PANTAVION_BASEMAP_STYLE_URL?.trim() ||
    "https://vector.openstreetmap.org/styles/shortbread/colorful.json";

  return <PantavionOwnedMapPilotClient styleUrl={styleUrl} />;
}
