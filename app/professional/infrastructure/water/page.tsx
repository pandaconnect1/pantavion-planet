import type { Metadata } from "next";

import WaterEntryClient from "./water-entry-client";

export const metadata: Metadata = {
  title: "Pantavion Water Access",
  description:
    "Protected Pantavion water infrastructure access entry for approved users and founder admin review.",
};

export default function WaterInfrastructurePage() {
  return <WaterEntryClient />;
}