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

function redirectRegistrationError(code: string) {
  redirect(`/auth/register?error=${encodeURIComponent(code)}`);
}

export async function signUp(formData: FormData) {
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const username = getString(formData, "username").toLowerCase();
  const email = getString(formData, "email").toLowerCase();
  const phone = getString(formData, "phone").replace(/[\s()-]/g, "");
  const password = getString(formData, "password");
  const birthDate = getString(formData, "birthDate");
  const country = getString(formData, "country");
  const countryCode = getString(formData, "countryCode").toUpperCase();
  const continentCode = getString(formData, "continentCode").toUpperCase();
  const region = getString(formData, "region");
  const city = getString(formData, "city");
  const language = getString(formData, "language") || "el";
  const assistedSetup = checked(formData, "assistedSetup");
  const termsAccepted = checked(formData, "termsAccepted");
  const privacyAccepted = checked(formData, "privacyAccepted");

  if (!firstName || !lastName || !email || !country || !region || !city || !birthDate) {
    redirectRegistrationError("missing_required_fields");
  }
  if (!/^[a-z0-9_]{3,30}$/.test(username)) redirectRegistrationError("invalid_username");
  if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) redirectRegistrationError("phone_must_be_e164");
  if (!/^[A-Z]{2}$/.test(countryCode)) redirectRegistrationError("country_code_required");
  if (!/^(AF|AN|AS|EU|NA|OC|SA)$/.test(continentCode)) redirectRegistrationError("continent_code_required");
  if (password.length < 12) redirectRegistrationError("password_too_short");
  if (!termsAccepted || !privacyAccepted) redirectRegistrationError("consent_required");

  const parsedBirthDate = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(parsedBirthDate.getTime()) || parsedBirthDate > new Date()) {
    redirectRegistrationError("invalid_birth_date");
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const displayName = `${firstName} ${lastName}`.trim();

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
        signup_phone: phone,
        birth_date: birthDate,
        country,
        country_code: countryCode,
        continent_code: continentCode,
        region,
        city,
        language,
        onboarding_mode: assistedSetup ? "assisted" : "standard",
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
      },
    },
  });

  if (error) redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);
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
