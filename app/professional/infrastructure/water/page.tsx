import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Pantavion Water Network",
  description:
    "Protected Pantavion water network live map with authorized access and controlled private pipe segments.",
};

export default function WaterInfrastructurePage() {
  redirect("/professional/infrastructure/water/live");
}
