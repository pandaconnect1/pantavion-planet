import type { Metadata } from "next";
import { WaterRoleWorkspaceView } from "../_components/water-role-workspace-view";

export const metadata: Metadata = {
  title: "Οθόνη Λογιστηρίου | Pantavion Ύδρευση",
  description: "Οθόνη λογιστηρίου για επιβεβαιωμένα κόστη, υλικά και εργατοώρες.",
};

export default function Page() {
  return <WaterRoleWorkspaceView workspaceId="accounting" />;
}