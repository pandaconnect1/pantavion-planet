import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";
  const clientMessageId = typeof body.clientMessageId === "string" ? body.clientMessageId : null;
  const originalLanguage = typeof body.originalLanguage === "string" ? body.originalLanguage : null;

  if (!conversationId || !messageBody) {
    return NextResponse.json({ ok: false, error: "conversation_and_body_required" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("pantavion_send_message", {
    p_conversation_id: conversationId,
    p_body: messageBody,
    p_client_message_id: clientMessageId,
    p_original_language: originalLanguage,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "message_send_failed", detail: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    messageId: data,
    state: "accepted",
    truth: "accepted means persisted by Pantavion; it does not claim recipient delivery or read",
  }, { status: 201 });
}
