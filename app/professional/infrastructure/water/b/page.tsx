import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Map B — Canonical DWG",
  description:
    "Protected approved-user viewer for the authentic Map B derived from the canonical ANDREASPAP DWG.",
};

export default function WaterBMapPage() {
  redirect(
    "/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap",
  );
}
