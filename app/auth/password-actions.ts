"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeNextPath(value: string, fallback = "/admin/pantavion/recovery"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production"
    ? "https://pantavion.com"
    : "http://localhost:3000";
}

export async function requestPasswordReset(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  const nextPath = safeNextPath(getString(formData, "next"));

  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const supabase = await createClient();
    const resetDestination = `/auth/reset-password?next=${encodeURIComponent(nextPath)}`;
    const redirectTo = `${siteUrl()}/auth/callback?next=${encodeURIComponent(resetDestination)}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      redirect(
        `/auth/forgot-password?error=reset_unavailable&next=${encodeURIComponent(nextPath)}`,
      );
    }
  }

  // Always return the same public result so this route does not disclose
  // whether a particular email exists in Pantavion.
  redirect(`/auth/forgot-password?sent=1&next=${encodeURIComponent(nextPath)}`);
}

export async function updateRecoveredPassword(formData: FormData) {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");
  const nextPath = safeNextPath(getString(formData, "next"));

  if (password.length < 12 || password !== confirmPassword) {
    redirect(
      `/auth/reset-password?error=invalid_password&next=${encodeURIComponent(nextPath)}`,
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect(
      `/auth/forgot-password?error=session_expired&next=${encodeURIComponent(nextPath)}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(
      `/auth/reset-password?error=update_failed&next=${encodeURIComponent(nextPath)}`,
    );
  }

  await supabase.auth.signOut();
  redirect(`/auth/login?reset=success&next=${encodeURIComponent(nextPath)}`);
}
