import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  isWaterAdminSessionValue,
  WATER_ADMIN_SESSION_COOKIE,
} from "@/core/security/water-admin-session";

export default async function WaterAdminPage() {
  const cookieStore = await cookies();
  const isAdmin = isWaterAdminSessionValue(
    cookieStore.get(WATER_ADMIN_SESSION_COOKIE)?.value || "",
  );

  redirect(
    isAdmin
      ? "/professional/infrastructure/water/admin/approvals"
      : "/professional/infrastructure/water/admin/login",
  );
}
