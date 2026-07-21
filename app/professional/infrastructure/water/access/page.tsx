import { cookies } from "next/headers";

import {
  isWaterAdminSessionValue,
  WATER_ADMIN_SESSION_COOKIE,
} from "@/core/security/water-admin-session";

import WaterMapNavigation from "../water-map-navigation";
import WaterAccessControlClient from "./water-access-control-client";

export const metadata = {
  title: "Pantavion Water Users Access",
  description:
    "Protected access requests and approved users flow for Pantavion Water.",
};

export default async function WaterUsersAccessPage() {
  const cookieStore = await cookies();
  const isAdmin = isWaterAdminSessionValue(
    cookieStore.get(WATER_ADMIN_SESSION_COOKIE)?.value || "",
  );

  return (
    <>
      <WaterMapNavigation title="Users / Access" />
      <WaterAccessControlClient isAdmin={isAdmin} />
    </>
  );
}
