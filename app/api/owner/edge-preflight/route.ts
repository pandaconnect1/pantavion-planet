import { NextResponse } from "next/server";

import { createFounderEdgePreflight } from "@/core/sovereign/founder-edge-preflight";
import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_REQUEST_BYTES = 24_576;

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return json({ ok: false, error: "authentication_required" }, 401);
  try {
    requireFounderIdentity(auth.user.id);
  } catch {
    return json({ ok: false, error: "founder_only" }, 403);
  }
  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") {
    return json({ ok: false, error: "aal2_required" }, 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ ok: false, error: "application_json_required" }, 415);
  }

  const rawBody = await request.text().catch(() => null);
  if (rawBody === null) return json({ ok: false, error: "request_body_unreadable" }, 400);
  if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
    return json({ ok: false, error: "request_too_large" }, 413);
  }

  let input: unknown;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  try {
    return json({ ok: true, requesterUserId: auth.user.id, ...createFounderEdgePreflight(input) }, 200);
  } catch (error) {
    const detail =
      error instanceof Error && error.message.startsWith("invalid_edge_preflight:")
        ? error.message
        : "invalid_edge_preflight";
    return json({ ok: false, error: "invalid_edge_preflight", detail }, 400);
  }
}
