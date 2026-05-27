import WaterMapNavigation from "../water-map-navigation";
import WaterEntryClient from "../water-entry-client";

export const metadata = {
  title: "Pantavion Water Users Access",
  description:
    "Protected access requests and approved users flow for Pantavion Water.",
};

export default function WaterUsersAccessPage() {
  return (
    <>
      <WaterMapNavigation title="Users / Access" />
      <WaterEntryClient />
    </>
  );
}