import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await context.params;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.PANTAVION_STRIPE_LISTING_BOOST_PRICE_ID;
  if (!stripeSecret || !priceId || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, status: "provider_not_configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const { data: listing, error: listingError } = await supabase
    .from("public_listings")
    .select("id,owner_id,lifecycle_state,title")
    .eq("id", listingId)
    .single();
  if (listingError || !listing) return NextResponse.json({ ok: false, error: "listing_not_found" }, { status: 404 });
  if (listing.owner_id !== auth.user.id) return NextResponse.json({ ok: false, error: "owner_required" }, { status: 403 });
  if (listing.lifecycle_state !== "published") return NextResponse.json({ ok: false, error: "published_listing_required" }, { status: 409 });

  const body = await request.json().catch(() => ({}));
  const durationDays = Number(body.durationDays ?? 7);
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 90) {
    return NextResponse.json({ ok: false, error: "invalid_duration" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${origin}/listings/mine?promotion=processing`);
  form.set("cancel_url", `${origin}/listings/${listingId}?promotion=cancelled`);
  form.set("client_reference_id", listingId);
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("metadata[pantavion_module]", "listings");
  form.set("metadata[pantavion_revenue_class]", "DIRECT_REVENUE");
  form.set("metadata[pantavion_user_id]", auth.user.id);
  form.set("metadata[pantavion_capability]", `listing_promotion:${listingId}`);
  form.set("metadata[pantavion_listing_id]", listingId);
  form.set("metadata[pantavion_promotion_days]", String(durationDays));

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
    cache: "no-store",
  });

  const session = await stripeResponse.json().catch(() => null) as { id?: string; url?: string; amount_total?: number; currency?: string; error?: { message?: string } } | null;
  if (!stripeResponse.ok || !session?.id || !session.url) {
    return NextResponse.json({ ok: false, error: "checkout_session_failed" }, { status: 502 });
  }

  const admin = createAdminClient();
  const { error: orderError } = await admin.from("listing_promotion_orders").insert({
    listing_id: listingId,
    user_id: auth.user.id,
    provider: "stripe",
    provider_session_id: session.id,
    status: "pending",
    duration_days: durationDays,
    amount_minor: session.amount_total ?? null,
    currency: session.currency ?? null,
    metadata: { listing_title: listing.title },
  });

  if (orderError) {
    return NextResponse.json({ ok: false, error: "promotion_order_persistence_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    checkoutUrl: session.url,
    sessionId: session.id,
    truth: "Promotion remains inactive until the verified Stripe webhook confirms checkout completion.",
  });
}
