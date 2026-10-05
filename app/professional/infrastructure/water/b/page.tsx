import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Map B — Canonical DWG",
  description:
    "Protected derived viewer for the authentic canonical Map B DWG. Raw master remains private.",
};

export default function WaterBMapPage() {
  redirect(
    "/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap",
  );
}
