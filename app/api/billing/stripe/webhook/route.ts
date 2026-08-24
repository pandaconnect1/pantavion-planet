import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_CLOCK_SKEW_SECONDS = 300;

function parseStripeSignature(header: string) {
  const parts = header.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));
  return { timestamp, signatures };
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

async function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return false;
  const skew = Math.abs(Math.floor(Date.now() / 1000) - timestampNumber);
  if (skew > MAX_CLOCK_SKEW_SECONDS) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`)
  );
  const expected = bytesToHex(digest);
  return signatures.some((signature) => constantTimeEqualHex(expected, signature));
}

type StripeEvent = {
  id: string;
  type: string;
  livemode?: boolean;
  created?: number;
  data?: { object?: Record<string, unknown> };
};

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function processStripeEvent(event: StripeEvent) {
  const supabase = createAdminClient();
  const object = event.data?.object ?? {};
  const metadata = objectValue(object.metadata);
  const pantavionModule = stringValue(metadata.pantavion_module) ?? "platform";
  const revenueClass =
    stringValue(metadata.pantavion_revenue_class) ?? "DIRECT_REVENUE";
  const userId = stringValue(metadata.pantavion_user_id);
  const customerId = stringValue(object.customer);
  const subscriptionId = stringValue(object.subscription) ?? stringValue(object.id);

  const inbox = await supabase
    .from("provider_webhook_events")
    .upsert(
      {
        provider: "stripe",
        provider_event_id: event.id,
        event_type: event.type,
        livemode: event.livemode ?? null,
        payload: event,
        processing_status: "received",
      },
      { onConflict: "provider,provider_event_id", ignoreDuplicates: true }
    );

  if (inbox.error) throw inbox.error;

  if (userId && customerId) {
    const customer = await supabase.from("billing_customers").upsert(
      {
        user_id: userId,
        provider: "stripe",
        provider_customer_id: customerId,
      },
      { onConflict: "user_id" }
    );
    if (customer.error) throw customer.error;
  }

  const occurredAt = event.created
    ? new Date(event.created * 1000).toISOString()
    : new Date().toISOString();

  const writeRevenue = async (
    eventKind:
      | "checkout_completed"
      | "payment_succeeded"
      | "payment_failed"
      | "subscription_started"
      | "subscription_changed"
      | "subscription_ended",
    amountMinor?: number | null,
    currency?: string | null
  ) => {
    const revenue = await supabase.from("revenue_events").upsert(
      {
        provider: "stripe",
        provider_event_id: event.id,
        provider_object_id: stringValue(object.id),
        user_id: userId,
        module: pantavionModule,
        revenue_class: revenueClass,
        event_kind: eventKind,
        amount_minor: amountMinor ?? null,
        currency: currency ?? null,
        metadata: { stripe_event_type: event.type },
        occurred_at: occurredAt,
      },
      { onConflict: "provider,provider_event_id,event_kind", ignoreDuplicates: true }
    );
    if (revenue.error) throw revenue.error;
  };

  switch (event.type) {
    case "checkout.session.completed": {
      await writeRevenue(
        "checkout_completed",
        numberValue(object.amount_total),
        stringValue(object.currency)
      );
      const capability = stringValue(metadata.pantavion_capability);
      if (userId && capability) {
        const entitlement = await supabase.from("entitlements").upsert(
          {
            user_id: userId,
            capability,
            source: "billing",
            status: "active",
            provider: "stripe",
            provider_subscription_id: subscriptionId,
            metadata: { checkout_session_id: stringValue(object.id) },
          },
          { onConflict: "user_id,capability,source" }
        );
        if (entitlement.error) throw entitlement.error;
      }
      break;
    }
    case "invoice.paid":
      await writeRevenue(
        "payment_succeeded",
        numberValue(object.amount_paid),
        stringValue(object.currency)
      );
      break;
    case "invoice.payment_failed":
      await writeRevenue(
        "payment_failed",
        numberValue(object.amount_due),
        stringValue(object.currency)
      );
      if (subscriptionId) {
        const update = await supabase
          .from("entitlements")
          .update({ status: "past_due" })
          .eq("provider", "stripe")
          .eq("provider_subscription_id", subscriptionId);
        if (update.error) throw update.error;
      }
      break;
    case "customer.subscription.created":
      await writeRevenue("subscription_started");
      break;
    case "customer.subscription.updated":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await writeRevenue("subscription_changed");
      break;
    case "customer.subscription.deleted":
      await writeRevenue("subscription_ended");
      if (subscriptionId) {
        const update = await supabase
          .from("entitlements")
          .update({ status: "revoked", valid_until: new Date().toISOString() })
          .eq("provider", "stripe")
          .eq("provider_subscription_id", subscriptionId);
        if (update.error) throw update.error;
      }
      break;
    default:
      await supabase
        .from("provider_webhook_events")
        .update({ processing_status: "ignored", processed_at: new Date().toISOString() })
        .eq("provider", "stripe")
        .eq("provider_event_id", event.id);
      return;
  }

  const complete = await supabase
    .from("provider_webhook_events")
    .update({ processing_status: "processed", processed_at: new Date().toISOString() })
    .eq("provider", "stripe")
    .eq("provider_event_id", event.id);
  if (complete.error) throw complete.error;
}

export async function POST(request: Request) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { ok: false, status: "provider_not_configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const verified = await verifyStripeSignature(rawBody, signature, endpointSecret);
  if (!verified) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!event.id || !event.type) {
    return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });
  }

  try {
    await processStripeEvent(event);
    return NextResponse.json({ ok: true, received: true });
  } catch {
    return NextResponse.json({ ok: false, error: "processing_failed" }, { status: 500 });
  }
}
