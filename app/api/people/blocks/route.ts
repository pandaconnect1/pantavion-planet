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
  const { data, error } = await supabase.from("user_blocks").select("blocked_id,created_at").eq("blocker_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: "blocks_unavailable", detail: error.message }, { status: 503 });
  return NextResponse.json({ ok: true, blocks: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const blockedId = typeof body.blockedId === "string" ? body.blockedId : "";
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null;
  if (!blockedId || blockedId === user.id) return NextResponse.json({ ok: false, error: "invalid_blocked_user" }, { status: 400 });
  const { error } = await supabase.rpc("pantavion_block_user", { p_blocked_id: blockedId, p_reason: reason });
  if (error) return NextResponse.json({ ok: false, error: "block_failed", detail: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const blockedId = typeof body.blockedId === "string" ? body.blockedId : "";
  if (!blockedId) return NextResponse.json({ ok: false, error: "blocked_user_required" }, { status: 400 });
  const { error } = await supabase.rpc("pantavion_unblock_user", { p_blocked_id: blockedId });
  if (error) return NextResponse.json({ ok: false, error: "unblock_failed", detail: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
