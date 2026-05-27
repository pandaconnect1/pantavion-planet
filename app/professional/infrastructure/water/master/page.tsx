import BMasterStatusClient from "./b-master-status-client";

export const metadata = {
  title: "Pantavion Water B Master Status",
  description: "Founder-only status panel for the protected B Master DWG registry.",
};

export default function WaterBMasterStatusPage() {
  return <BMasterStatusClient />;
}
