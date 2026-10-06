import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Map E — View of Map C",
  description:
    "Protected second operational view over the canonical Map C DWG. No duplicate raw master.",
};

export default function WaterEMapPage() {
  redirect(
    "/professional/infrastructure/water/master-b-mobile?sourceKey=legacy-george-85m&viewId=E",
  );
}
