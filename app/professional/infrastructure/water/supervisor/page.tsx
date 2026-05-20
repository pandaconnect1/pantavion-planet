import type { Metadata } from "next";
import { WaterRoleWorkspaceView } from "../_components/water-role-workspace-view";

export const metadata: Metadata = {
  title: "Οθόνη Επιστάτη | Pantavion Ύδρευση",
  description: "Οθόνη επιστάτη για βλάβες, συνεργεία και προτεραιότητες.",
};

export default function Page() {
  return <WaterRoleWorkspaceView workspaceId="supervisor" />;
}