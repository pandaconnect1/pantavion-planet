import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPlatformAuthority } from "@/lib/auth/platform-authority";

export const dynamic = "force-dynamic";

const MODERATION_ROLES = ["founder", "admin", "moderator"] as const;
const ACTIONS = new Set(["review", "approve", "reject", "publish", "remove", "expire", "archive"]);

const TRANSITIONS: Record<string, Record<string, string>> = {
  review: { submitted: "under_review" },
  approve: { submitted: "approved", under_review: "approved" },
  reject: { submitted: "rejected", under_review: "rejected", approved: "rejected" },
  publish: { approved: "published" },
  remove: { published: "removed", approved: "removed", under_review: "removed" },
  expire: { published: "expired", approved: "expired" },
  archive: { removed: "archived", expired: "archived", rejected: "archived", fulfilled: "archived", sold: "archived", rented: "archived" },
};

async function requireModerator() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, response: NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 }) };

  const authority = await hasPlatformAuthority(auth.user.id, [...MODERATION_ROLES]);
  if (!authority.allowed) {
    return { ok: false as const, response: NextResponse.json({ ok: false, error: authority.reason }, { status: 403 }) };
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

  if (error) return NextResponse.json({ ok: false, error: "moderation_queue_unavailable", detail: error.message }, { status: 503 });

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
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });

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
  const { data: listing, error: fetchError } = await admin
    .from("public_listings")
    .select("id,lifecycle_state,published_at")
    .eq("id", listingId)
    .single();

  if (fetchError || !listing) return NextResponse.json({ ok: false, error: "listing_not_found" }, { status: 404 });

  const nextState = TRANSITIONS[action]?.[listing.lifecycle_state];
  if (!nextState) {
    return NextResponse.json({
      ok: false,
      error: "invalid_state_transition",
      currentState: listing.lifecycle_state,
      action,
    }, { status: 409 });
  }

  const update: Record<string, unknown> = {
    lifecycle_state: nextState,
    moderation_note: reason,
  };
  if (nextState === "published" && !listing.published_at) update.published_at = new Date().toISOString();

  const { data: updated, error: updateError } = await admin
    .from("public_listings")
    .update(update)
    .eq("id", listingId)
    .eq("lifecycle_state", listing.lifecycle_state)
    .select("id,lifecycle_state,published_at,updated_at")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ ok: false, error: "moderation_update_failed", detail: updateError?.message }, { status: 409 });
  }

  const auditAction = action === "review" ? "submit_review" : action;
  const { error: auditError } = await admin.from("moderation_actions").insert({
    actor_user_id: gate.user.id,
    target_type: "listing",
    target_id: listingId,
    action: auditAction,
    previous_state: listing.lifecycle_state,
    next_state: nextState,
    reason,
    metadata: { authorityRole: gate.authority.role, authoritySource: gate.authority.source },
  });

  if (auditError) {
    // State was changed but audit persistence failed: surface this loudly rather than hiding it.
    return NextResponse.json({
      ok: false,
      error: "moderation_audit_failed",
      listing: updated,
      detail: auditError.message,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    listing: updated,
    transition: { from: listing.lifecycle_state, to: nextState, action },
    audited: true,
  });
}
