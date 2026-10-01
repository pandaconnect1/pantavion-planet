import WaterMapBAuthenticClient from "../components/water-map-b-authentic-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Map C — Authentic DWG",
  description:
    "Protected founder/admin read-only viewer for the authentic canonical Map C DWG.",
};

export default function WaterCMapPage() {
  return (
    <WaterMapBAuthenticClient
      initialSourceKey="legacy-george-85m"
      allowSourceSwitch={false}
      mapLabel="Map C — GEORGE 85 MB"
    />
  );
}
