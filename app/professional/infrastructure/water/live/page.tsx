import WaterLiveGisClient from "../maps/live-gis/water-live-gis-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Network — Live GIS",
  description:
    "Protected provider-neutral MapLibre water network runtime with live viewport loading, GPS and controlled access.",
};

export default function WaterLivePage() {
  return <WaterLiveGisClient initialMap="A" />;
}
