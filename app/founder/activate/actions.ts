"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const FOUNDER_EMAIL = "info.pandaconnect@gmail.com";

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

export async function sendFounderActivationEmail(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();

  if (email !== FOUNDER_EMAIL) {
    redirect("/founder/activate?error=founder_email_mismatch");
  }

  const supabase = await createClient();
  const claimPath = "/api/pantavion/founder/claim-email";
  const redirectTo = `${siteUrl()}/auth/callback?next=${encodeURIComponent(claimPath)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo,
      data: {
        pantavion_founder_activation: true,
      },
    },
  });

  if (error) {
    redirect("/founder/activate?error=email_delivery_failed");
  }

  redirect("/founder/activate?sent=1");
}
