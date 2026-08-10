import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "classified",
  "service",
  "job",
  "business",
  "event",
  "request",
  "property",
  "marketplace",
  "promotion",
  "community_announcement",
  "other",
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mine = url.searchParams.get("mine") === "1";
  const type = url.searchParams.get("type");
  const country = url.searchParams.get("country")?.toUpperCase();
  const category = url.searchParams.get("category");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 40) || 40, 1), 100);

  if (type && !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ ok: false, error: "unsupported_listing_type" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  let query = supabase
    .from("public_listings")
    .select("id,owner_id,listing_type,title,description,category,country_code,region,city,language_code,price_amount,price_currency,contact_mode,public_contact,lifecycle_state,paid_promotion,published_at,expires_at,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (mine) {
    if (!auth.user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
    query = query.eq("owner_id", auth.user.id);
  } else {
    query = query.eq("lifecycle_state", "published");
  }

  if (type) query = query.eq("listing_type", type);
  if (country) query = query.eq("country_code", country);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: "listings_unavailable", detail: error.message }, { status: 503 });

  return NextResponse.json({ ok: true, count: data?.length ?? 0, listings: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });

  const listingType = typeof body.listingType === "string" ? body.listingType : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!ALLOWED_TYPES.has(listingType) || title.length < 3 || title.length > 160) {
    return NextResponse.json({ ok: false, error: "invalid_listing_input" }, { status: 400 });
  }

  const payload = {
    owner_id: auth.user.id,
    listing_type: listingType,
    title,
    description: typeof body.description === "string" ? body.description.trim().slice(0, 10000) : null,
    category: typeof body.category === "string" ? body.category.trim().slice(0, 120) : null,
    country_code: typeof body.countryCode === "string" ? body.countryCode.trim().toUpperCase().slice(0, 3) : null,
    region: typeof body.region === "string" ? body.region.trim().slice(0, 120) : null,
    city: typeof body.city === "string" ? body.city.trim().slice(0, 120) : null,
    language_code: typeof body.languageCode === "string" ? body.languageCode.trim().toLowerCase().slice(0, 16) : null,
    price_amount: Number.isFinite(Number(body.priceAmount)) ? Number(body.priceAmount) : null,
    price_currency: typeof body.priceCurrency === "string" ? body.priceCurrency.trim().toUpperCase().slice(0, 3) : null,
    lifecycle_state: body.submit === true ? "submitted" : "draft",
    paid_promotion: false,
  };

  const { data, error } = await supabase
    .from("public_listings")
    .insert(payload)
    .select("id,lifecycle_state,created_at")
    .single();

  if (error) return NextResponse.json({ ok: false, error: "listing_create_failed", detail: error.message }, { status: 403 });

  return NextResponse.json({
    ok: true,
    listing: data,
    truth: "Creation does not mean publication or paid promotion. Moderation/payment gates remain separate.",
  }, { status: 201 });
}
