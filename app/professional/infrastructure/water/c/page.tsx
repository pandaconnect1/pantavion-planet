import WaterMapNavigation from "../water-map-navigation";
import WaterDerivedMapClient from "../components/water-derived-map-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Engineering Intelligence",
  description:
    "Protected engineering intelligence workspace built on verified source maps and approved overlays.",
};

export default function WaterCIntelligentMapPage() {
  return (
    <>
      <WaterMapNavigation title="Engineering Intelligence" />
      <WaterDerivedMapClient mode="c" />
    </>
  );
}