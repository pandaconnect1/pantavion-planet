import type { Metadata } from "next";

import ControlledWaterSegmentClient from "./controlled-water-segment-client";

export const metadata: Metadata = {
  title: "Pantavion Water Network Live Segment",
  description:
    "Controlled server-side water network segment viewer. The full master network remains protected.",
};

export default function WaterLiveSegmentPage() {
  return <ControlledWaterSegmentClient />;
}
