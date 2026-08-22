"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const CONSENT_VERSION = "2026-08-22";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function firstRow<T>(value: T[] | T | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function signUp(formData: FormData) {
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const username = getString(formData, "username").toLowerCase();
  const displayName = getString(formData, "displayName");
  const country = getString(formData, "country");
  const language = getString(formData, "language").toLowerCase();
  const termsAccepted = getChecked(formData, "termsAccepted");
  const privacyAccepted = getChecked(formData, "privacyAccepted");

  if (
    !email ||
    password.length < 8 ||
    !/^[a-z0-9_]{3,30}$/.test(username) ||
    firstName.length < 1 ||
    lastName.length < 1 ||
    displayName.length < 1 ||
    country.length < 2 ||
    !/^[a-z0-9-]{2,16}$/.test(language) ||
    !termsAccepted ||
    !privacyAccepted
  ) {
    redirect("/auth/register?error=invalid_input");
  }

  const supabase = await createClient();
  const { data: gateData, error: gateError } = await supabase.rpc(
    "pantavion_public_registration_status",
  );
  const gate = firstRow(
    gateData as
      | Array<{ public_registration_enabled?: boolean }>
      | { public_registration_enabled?: boolean }
      | null,
  );

  if (gateError || gate?.public_registration_enabled !== true) {
    redirect("/auth/register?error=registration_closed");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const callback = `${siteUrl}/auth/callback?next=${encodeURIComponent("/auth/complete-profile")}`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callback,
      data: {
        username,
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        country,
        language,
        terms_accepted: true,
        privacy_accepted: true,
        consent_version: CONSENT_VERSION,
      },
    },
  });

  if (error) redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);
  redirect("/auth/check-email");
}

export async function signIn(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);

  const userId = data.user?.id;
  if (!userId) redirect("/auth/login?error=authentication_failed");

  const { data: registration } = await supabase
    .from("profile_registration_states")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();

  if (registration?.state === "email_confirmation_pending") {
    redirect("/auth/check-email");
  }
  if (registration?.state === "profile_completion_required") {
    redirect("/auth/complete-profile");
  }

  redirect("/profile");
}

export async function completeRegistrationProfile(formData: FormData) {
  const username = getString(formData, "username").toLowerCase();
  const displayName = getString(formData, "displayName");
  const country = getString(formData, "country");
  const countryCode = getString(formData, "countryCode").toUpperCase();
  const language = getString(formData, "language").toLowerCase();
  const legalFirstName = getString(formData, "legalFirstName");
  const legalLastName = getString(formData, "legalLastName");
  const dateOfBirth = getString(formData, "dateOfBirth");

  if (
    !/^[a-z0-9_]{3,30}$/.test(username) ||
    displayName.length < 1 ||
    country.length < 2 ||
    !/^[A-Z]{2}$/.test(countryCode) ||
    !/^[a-z0-9-]{2,16}$/.test(language) ||
    legalFirstName.length < 1 ||
    legalLastName.length < 1 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
  ) {
    redirect("/auth/complete-profile?error=invalid_profile");
  }

  const parsedDob = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
    redirect("/auth/complete-profile?error=invalid_date_of_birth");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/auth/complete-profile");
  if (!user.email_confirmed_at) redirect("/auth/check-email");

  const { data, error } = await supabase.rpc("pantavion_complete_registration_profile", {
    p_username: username,
    p_display_name: displayName,
    p_country: country,
    p_country_code: countryCode,
    p_language: language,
    p_legal_first_name: legalFirstName,
    p_legal_last_name: legalLastName,
    p_date_of_birth: dateOfBirth,
  });

  if (error) {
    const code = error.code === "23505" ? "username_taken" : "completion_failed";
    redirect(`/auth/complete-profile?error=${code}`);
  }

  const completion = firstRow(
    data as
      | Array<{ registration_state?: string; protected_by_default?: boolean }>
      | { registration_state?: string; protected_by_default?: boolean }
      | null,
  );
  const state = completion?.registration_state ?? "completed";
  redirect(`/profile?registration=${encodeURIComponent(state)}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
