import WaterMapNavigation from "../water-map-navigation";
import WaterDerivedMapClient from "../components/water-derived-map-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Map B — Authentic Master GIS",
  description:
    "Protected Map B workspace for the authentic water-network master, preserving original geometry and layers while adding field GIS tools.",
};

export default function WaterBMapPage() {
  return (
    <>
      <WaterMapNavigation title="Map B — Authentic Master GIS" />
      <WaterDerivedMapClient mode="b" />
    </>
  );
}
