"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function registrationError(code: string): never {
  redirect(`/auth/register?error=${encodeURIComponent(code)}`);
}

export async function signUp(formData: FormData) {
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const username = getString(formData, "username").toLowerCase();
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const country = getString(formData, "country");
  const language = getString(formData, "language") || "el";
  const declaredAgeGroup = getString(formData, "declaredAgeGroup");
  const termsAccepted = checked(formData, "termsAccepted");
  const privacyAccepted = checked(formData, "privacyAccepted");

  if (!firstName || !lastName || !email || !country) registrationError("missing_required_fields");
  if (!/^[a-z0-9_]{3,30}$/.test(username)) registrationError("invalid_username");
  if (password.length < 12) registrationError("password_too_short");
  if (!['minor', 'adult'].includes(declaredAgeGroup)) registrationError("age_group_required");
  if (!termsAccepted || !privacyAccepted) registrationError("consent_required");

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: registrationStatus, error: registrationStatusError } = await supabase.rpc(
    "pantavion_public_registration_status",
  );

  if (registrationStatusError) registrationError("registration_status_unavailable");

  const registrationRow = Array.isArray(registrationStatus) ? registrationStatus[0] : registrationStatus;
  if (!registrationRow?.public_registration_enabled) registrationError("registration_not_live_yet");

  const displayName = `${firstName} ${lastName}`.trim();
  const consentVersion = "2026-08-13";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        username,
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        country,
        language,
        declared_age_group: declaredAgeGroup,
        terms_accepted: true,
        privacy_accepted: true,
        consent_version: consentVersion,
      },
    },
  });

  if (error) registrationError(error.message);
  redirect("/auth/check-email");
}

export async function signIn(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  redirect("/profile");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
