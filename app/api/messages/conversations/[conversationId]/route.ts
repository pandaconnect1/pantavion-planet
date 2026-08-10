import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ conversationId: string }> };

export async function GET(_request: Request, context: Context) {
  const { conversationId } = await context.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const { data, error } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_id,body,original_language,message_type,reply_to_message_id,created_at,edited_at,deleted_at")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ ok: false, error: "messages_unavailable", detail: error.message }, { status: 403 });
  return NextResponse.json({ ok: true, conversationId, messages: data ?? [] });
}
