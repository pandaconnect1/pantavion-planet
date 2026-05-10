import type { Metadata } from "next";

import ControlledWaterSegmentClient from "./controlled-water-segment-client";

export const metadata: Metadata = {
  title: "Pantavion Water Network Live Map",
  description:
    "Real interactive address-first controlled water network map. The full master network remains protected.",
};

export default function WaterLiveSegmentPage() {
  return <ControlledWaterSegmentClient />;
}
