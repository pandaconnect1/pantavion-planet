import type { Metadata } from "next";
import { WaterRoleWorkspaceView } from "../_components/water-role-workspace-view";

export const metadata: Metadata = {
  title: "Οθόνη Αρχιεπιστάτη | Pantavion Ύδρευση",
  description: "Συνολική οθόνη αρχιεπιστάτη για περιοχές, συνεργεία και φόρτο.",
};

export default function Page() {
  return <WaterRoleWorkspaceView workspaceId="chief" />;
}