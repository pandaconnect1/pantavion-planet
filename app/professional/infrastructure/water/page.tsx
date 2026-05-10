import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Pantavion Water Module",
  description:
    "Protected Pantavion Water Module. Legacy renderer disabled until production serving contracts are complete.",
};

export default function WaterInfrastructurePage() {
  redirect("/professional/infrastructure/water/readiness");
}
