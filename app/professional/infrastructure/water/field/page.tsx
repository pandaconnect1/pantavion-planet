import type { Metadata } from "next";
import { WaterRoleWorkspaceView } from "../_components/water-role-workspace-view";

export const metadata: Metadata = {
  title: "Οθόνη Εργάτη και Τεχνίτη | Pantavion Ύδρευση",
  description: "Απλή οθόνη πεδίου για εργάτη και τεχνίτη στην ύδρευση.",
};

export default function Page() {
  return <WaterRoleWorkspaceView workspaceId="field" />;
}