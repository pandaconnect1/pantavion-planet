import WaterMapBAuthenticClient from "../components/water-map-b-authentic-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Map B — Canonical DWG",
  description:
    "Protected founder/admin read-only viewer for the authentic canonical Map B DWG.",
};

export default function WaterBMapPage() {
  return (
    <WaterMapBAuthenticClient
      initialSourceKey="canonical-2026-andreaspap"
      allowSourceSwitch={false}
      mapLabel="Map B — ANDREASPAP 2026"
    />
  );
}
