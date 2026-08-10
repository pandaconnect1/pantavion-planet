import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const { data: memberships, error: membershipError } = await supabase
    .from("conversation_members")
    .select("conversation_id,role,joined_at,left_at")
    .eq("user_id", auth.user.id)
    .is("left_at", null)
    .order("joined_at", { ascending: false });

  if (membershipError) return NextResponse.json({ ok: false, error: "conversations_unavailable", detail: membershipError.message }, { status: 503 });
  return NextResponse.json({ ok: true, memberships: memberships ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const otherUserId = typeof body.otherUserId === "string" ? body.otherUserId : "";
  if (!otherUserId) return NextResponse.json({ ok: false, error: "other_user_required" }, { status: 400 });

  const { data, error } = await supabase.rpc("pantavion_create_direct_conversation", { p_other_user_id: otherUserId });
  if (error) return NextResponse.json({ ok: false, error: "conversation_create_failed", detail: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, conversationId: data }, { status: 201 });
}
