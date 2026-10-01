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

  if (isAdmin) {
    redirect("/professional/infrastructure/water/admin/approvals");
  }

  // Founder bootstrap must not depend on password-recovery email.
  // The dedicated access page establishes the signed, short-lived httpOnly
  // water admin session using the configured server-side Founder/Admin path.
  const next = encodeURIComponent("/professional/infrastructure/water/admin/approvals");
  redirect(`/professional/infrastructure/water/admin/access?next=${next}`);
}
