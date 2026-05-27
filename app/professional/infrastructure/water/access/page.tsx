import WaterMapNavigation from "../water-map-navigation";
import WaterAccessControlClient from "./water-access-control-client";

export const metadata = {
  title: "Pantavion Water Users Access",
  description:
    "Protected access requests and approved users flow for Pantavion Water.",
};

export default function WaterUsersAccessPage() {
  return (
    <>
      <WaterMapNavigation title="Users / Access" />
      <WaterAccessControlClient />
    </>
  );
}