import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Map C — Authentic DWG",
  description:
    "Protected approved-user viewer for the authentic Map C derived from the verified GEORGE DWG.",
};

export default function WaterCMapPage() {
  redirect(
    "/professional/infrastructure/water/master-b-mobile?sourceKey=legacy-george-85m",
  );
}
