"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function moneyToCents(value: string) {
  if (!value) return null;
  const amount = Number(value.replace(",", "."));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function csv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function advertiserTrack(value: string): "standard" | "enterprise" {
  return value === "enterprise" ? "enterprise" : "standard";
}

function scopeType(value: string) {
  const allowed = new Set(["country", "multi_country", "continent", "multi_continent", "global"]);
  return allowed.has(value) ? value : "country";
}

export async function createAdvertiser(formData: FormData) {
  const displayName = text(formData, "displayName");
  if (displayName.length < 2 || displayName.length > 160) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/business/ads");

  const track = advertiserTrack(text(formData, "advertiserTrack"));
  const { error } = await supabase.from("pantavion_advertisers").insert({
    owner_id: user.id,
    display_name: displayName,
    legal_name: text(formData, "legalName") || null,
    country_code: text(formData, "countryCode").toUpperCase() || null,
    advertiser_track: track,
  });

  if (error) redirect(`/business/ads?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/business/ads");
}

export async function createAdRequest(formData: FormData) {
  const advertiserId = text(formData, "advertiserId");
  const title = text(formData, "title");
  const objective = text(formData, "objective");
  if (!advertiserId || title.length < 2 || objective.length < 2) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/business/ads");

  const { data: advertiser } = await supabase
    .from("pantavion_advertisers")
    .select("id,advertiser_track")
    .eq("id", advertiserId)
    .eq("owner_id", user.id)
    .single();

  if (!advertiser) redirect("/business/ads?error=Advertiser%20profile%20not%20found");

  const track = advertiserTrack(advertiser.advertiser_track);
  const scope = scopeType(text(formData, "scopeType"));
  const targetCountries = csv(text(formData, "countries")).map((country) => country.toUpperCase());
  const targetContinents = csv(text(formData, "continents"));

  const { error } = await supabase.from("pantavion_ad_requests").insert({
    advertiser_id: advertiserId,
    created_by: user.id,
    title,
    objective,
    requested_surfaces: ["ads_directory"],
    target_countries: targetCountries,
    target_continents: targetContinents,
    scope_type: scope,
    commercial_track: track,
    agreement_type: track === "enterprise" ? "enterprise_msa_io" : "standard_terms",
    legal_review_status: track === "enterprise" ? "pending" : "not_required",
    requested_start: text(formData, "start") || null,
    requested_end: text(formData, "end") || null,
    budget_cents: moneyToCents(text(formData, "budget")),
    currency: text(formData, "currency") || "EUR",
    status: "submitted",
  });

  if (error) redirect(`/business/ads?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/business/ads");
}

export async function sendAdRequestMessage(formData: FormData) {
  const requestId = text(formData, "requestId");
  const body = text(formData, "body");
  if (!requestId || !body || body.length > 5000) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/business/ads");

  const { error } = await supabase.from("pantavion_ad_request_messages").insert({
    request_id: requestId,
    sender_id: user.id,
    body,
  });

  if (error) redirect(`/business/ads?request=${requestId}&error=${encodeURIComponent(error.message)}`);
  revalidatePath("/business/ads");
}
