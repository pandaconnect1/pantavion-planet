import { redirect } from "next/navigation";

export const metadata = {
  title: "Pantavion Water Maps",
  description:
    "Clean protected entry for Pantavion Water A Map, B Master and C Intelligent Map.",
};

export default function WaterRootPage() {
  redirect("/professional/infrastructure/water/maps");
}
