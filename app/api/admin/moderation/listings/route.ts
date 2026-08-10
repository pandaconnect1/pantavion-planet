import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPlatformAuthority } from "@/lib/auth/platform-authority";

export const dynamic = "force-dynamic";

const MODERATION_ROLES = ["founder", "admin", "moderator"] as const;
const ACTIONS = new Set(["review", "approve", "reject", "publish", "remove", "expire", "archive"]);

async function requireModerator() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 }),
    };
  }

  const authority = await hasPlatformAuthority(auth.user.id, [...MODERATION_ROLES]);
  if (!authority.allowed) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: authority.reason }, { status: 403 }),
    };
  }

  return { ok: true as const, user: auth.user, authority };
}

export async function GET(request: Request) {
  const gate = await requireModerator();
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "submitted";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 100);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("public_listings")
    .select("id,owner_id,listing_type,title,description,category,country_code,region,city,language_code,price_amount,price_currency,lifecycle_state,paid_promotion,published_at,expires_at,moderation_note,created_at,updated_at")
    .eq("lifecycle_state", state)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ ok: false, error: "moderation_queue_unavailable", detail: error.message }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    role: gate.authority.role,
    state,
    count: data?.length ?? 0,
    listings: data ?? [],
  });
}

export async function POST(request: Request) {
  const gate = await requireModerator();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  const action = typeof body.action === "string" ? body.action : "";
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) : null;

  if (!listingId || !ACTIONS.has(action)) {
    return NextResponse.json({ ok: false, error: "invalid_moderation_action" }, { status: 400 });
  }

  if ((action === "reject" || action === "remove") && !reason) {
    return NextResponse.json({ ok: false, error: "reason_required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("pantavion_moderate_listing", {
    p_listing_id: listingId,
    p_actor_user_id: gate.user.id,
    p_action: action,
    p_reason: reason,
    p_authority_role: gate.authority.role,
    p_authority_source: gate.authority.source,
  });

  if (error) {
    const message = error.message ?? "";
    const code = message.includes("listing_not_found")
      ? "listing_not_found"
      : message.includes("reason_required")
        ? "reason_required"
        : message.includes("invalid_state_transition")
          ? "invalid_state_transition"
          : "moderation_transition_failed";
    const status = code === "listing_not_found" ? 404 : code === "reason_required" ? 400 : code === "invalid_state_transition" ? 409 : 500;
    return NextResponse.json({ ok: false, error: code }, { status });
  }

  const transition = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    ok: true,
    transition,
    audited: true,
    atomic: true,
  });
}
