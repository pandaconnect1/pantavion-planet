import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Map C — Authentic DWG",
  description:
    "Protected derived viewer for the authentic canonical Map C DWG. Raw master remains private.",
};

export default function WaterCMapPage() {
  redirect(
    "/professional/infrastructure/water/master-b-mobile?sourceKey=legacy-george-85m",
  );
}
