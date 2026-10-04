import ControlledWaterSegmentClient from "./controlled-water-segment-client";
import WaterUserRequestsPanel from "./water-user-requests-panel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Network",
  description:
    "Protected Pantavion water network map with controlled private pipe segments, mobile location marker, and authorized access.",
};

export default function WaterLivePage() {
  return (
    <>
      <ControlledWaterSegmentClient />
      <WaterUserRequestsPanel />
    </>
  );
}
