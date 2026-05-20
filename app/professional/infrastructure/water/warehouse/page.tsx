import type { Metadata } from "next";
import { WaterRoleWorkspaceView } from "../_components/water-role-workspace-view";

export const metadata: Metadata = {
  title: "Οθόνη Αποθήκης | Pantavion Ύδρευση",
  description: "Οθόνη αποθήκης για υλικά, επιβεβαιώσεις και ελλείψεις.",
};

export default function Page() {
  return <WaterRoleWorkspaceView workspaceId="warehouse" />;
}