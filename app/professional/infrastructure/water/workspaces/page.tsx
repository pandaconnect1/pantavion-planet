import type { Metadata } from "next";
import { WaterRoleWorkspaceOverview } from "../_components/water-role-workspace-view";

export const metadata: Metadata = {
  title: "Ρόλοι Ύδρευσης | Pantavion",
  description:
    "Ξεχωριστές οθόνες Pantavion Water για εργάτη, επιστάτη, αρχιεπιστάτη, αποθήκη, λογιστήριο και HR.",
};

export default function Page() {
  return <WaterRoleWorkspaceOverview />;
}