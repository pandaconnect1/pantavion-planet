"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  PANTAVION_FOUNDER_SESSION_COOKIE,
  validatePantavionFounderSessionValue,
} from "@/core/security/pantavion-founder-session";
import {
  isWaterAdminSessionValue,
  WATER_ADMIN_SESSION_COOKIE,
} from "@/core/security/water-admin-session";
import {
  createAdminClient,
  hasSupabaseAdminCredential,
} from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production"
    ? "https://pantavion.com"
    : "http://localhost:3000";
}

async function hasPrivilegedFounderBootstrapSession() {
  const cookieStore = await cookies();
  const founderSession = cookieStore.get(PANTAVION_FOUNDER_SESSION_COOKIE)?.value || "";
  const waterAdminSession = cookieStore.get(WATER_ADMIN_SESSION_COOKIE)?.value || "";

  return (
    validatePantavionFounderSessionValue(founderSession) ||
    isWaterAdminSessionValue(waterAdminSession)
  );
}

async function findExistingUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) throw error;

    const match = data.users.find(
      (user) => (user.email || "").trim().toLowerCase() === email,
    );
    if (match) return match;

    if (data.users.length < 100) break;
  }

  return null;
}

export async function inviteFounderIdentity(formData: FormData) {
  if (!(await hasPrivilegedFounderBootstrapSession())) {
    const next = encodeURIComponent("/founder/account-setup");
    redirect(`/professional/infrastructure/water/admin/access?next=${next}`);
  }

  if (!hasSupabaseAdminCredential()) {
    redirect("/founder/account-setup?error=admin_credential_missing");
  }

  const email = getString(formData, "email").toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/founder/account-setup?error=invalid_email");
  }

  const admin = createAdminClient();
  const resetDestination = `/auth/reset-password?next=${encodeURIComponent(
    "/professional/infrastructure/water/live",
  )}`;
  const redirectTo = `${siteUrl()}/auth/callback?next=${encodeURIComponent(
    resetDestination,
  )}`;

  let userId = "";

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        pantavion_founder_bootstrap: true,
      },
    });

  if (!inviteError && inviteData.user?.id) {
    userId = inviteData.user.id;
  } else {
    try {
      const existing = await findExistingUserByEmail(admin, email);
      if (!existing?.id) {
        redirect("/founder/account-setup?error=invite_failed");
      }

      userId = existing.id;

      const { error: resetError } = await admin.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        redirect("/founder/account-setup?error=email_delivery_failed");
      }
    } catch {
      redirect("/founder/account-setup?error=invite_failed");
    }
  }

  const { error: roleError } = await admin
    .from("pantavion_operator_roles")
    .upsert(
      {
        user_id: userId,
        role: "founder",
        active: true,
        granted_at: new Date().toISOString(),
        granted_by: null,
        note: "Founder email identity bootstrap from privileged Pantavion session",
      },
      { onConflict: "user_id" },
    );

  if (roleError) {
    redirect("/founder/account-setup?error=role_assignment_failed");
  }

  redirect("/founder/account-setup?sent=1");
}
