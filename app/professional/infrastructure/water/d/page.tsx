import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Map D — View of Map B",
  description:
    "Protected second operational view over the canonical Map B DWG. No duplicate raw master.",
};

export default function WaterDMapPage() {
  redirect(
    "/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap&viewId=D",
  );
}
