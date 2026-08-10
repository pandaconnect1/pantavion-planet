import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { supabase, user: null };
  return { supabase, user: data.user };
}

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const { data, error } = await supabase
    .from("relationships")
    .select("id,requester_id,addressee_id,status,created_at,updated_at")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: "relationships_unavailable", detail: error.message }, { status: 503 });
  return NextResponse.json({ ok: true, relationships: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const addresseeId = typeof body.addresseeId === "string" ? body.addresseeId : "";
  if (!addresseeId) return NextResponse.json({ ok: false, error: "addressee_required" }, { status: 400 });

  const { data, error } = await supabase.rpc("pantavion_request_relationship", { p_addressee_id: addresseeId });
  if (error) return NextResponse.json({ ok: false, error: "relationship_request_failed", detail: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, relationshipId: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const relationshipId = typeof body.relationshipId === "string" ? body.relationshipId : "";
  const action = body.action === "accept" || body.action === "decline" ? body.action : "";
  if (!relationshipId || !action) return NextResponse.json({ ok: false, error: "relationship_and_action_required" }, { status: 400 });

  const { data, error } = await supabase.rpc("pantavion_respond_relationship", {
    p_relationship_id: relationshipId,
    p_action: action,
  });
  if (error) return NextResponse.json({ ok: false, error: "relationship_response_failed", detail: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, status: data });
}
