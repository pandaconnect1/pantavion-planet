import type { Metadata } from "next";
import { WaterRoleWorkspaceView } from "../_components/water-role-workspace-view";

export const metadata: Metadata = {
  title: "Οθόνη HR και Προσωπικού | Pantavion Ύδρευση",
  description: "Οθόνη HR για εργατοώρες, βάρδιες, επιφυλακές και ασφάλεια.",
};

export default function Page() {
  return <WaterRoleWorkspaceView workspaceId="hr" />;
}