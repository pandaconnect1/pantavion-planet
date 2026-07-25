"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signUp(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const username = getString(formData, "username").toLowerCase();
  const displayName = getString(formData, "displayName");

  if (!email || password.length < 8 || !/^[a-z0-9_]{3,30}$/.test(username)) {
    redirect("/auth/sign-up?error=invalid_input");
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: { username, display_name: displayName || username }
    }
  });

  if (error) redirect(`/auth/sign-up?error=${encodeURIComponent(error.message)}`);
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
