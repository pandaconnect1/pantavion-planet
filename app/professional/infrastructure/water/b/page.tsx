import WaterMapNavigation from "../water-map-navigation";
import WaterDerivedMapClient from "../components/water-derived-map-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water B Derived Map",
  description:
    "Protected B derived water network map preview over road base, without raw DWG exposure.",
};

export default function WaterBDerivedMapPage() {
  return (
    <>
      <WaterMapNavigation title="B Derived Map" />
      <WaterDerivedMapClient mode="b" />
    </>
  );
}