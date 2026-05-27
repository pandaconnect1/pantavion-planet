import WaterMapNavigation from "../water-map-navigation";
import WaterDerivedMapClient from "../components/water-derived-map-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water C Intelligent Map",
  description:
    "Protected C intelligent water map preview with controlled engineering layers.",
};

export default function WaterCIntelligentMapPage() {
  return (
    <>
      <WaterMapNavigation title="C Intelligent Map" />
      <WaterDerivedMapClient mode="c" />
    </>
  );
}