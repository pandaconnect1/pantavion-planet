"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

export async function createConversation(formData: FormData) {
  const title = value(formData, "title");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/chat");

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({ kind: "group", title: title || "New conversation", created_by: user.id })
    .select("id")
    .single();
  if (error) redirect(`/social/chat?error=${encodeURIComponent(error.message)}`);

  const { error: memberError } = await supabase
    .from("conversation_members")
    .insert({ conversation_id: conversation.id, user_id: user.id, role: "owner" });
  if (memberError) redirect(`/social/chat?error=${encodeURIComponent(memberError.message)}`);

  redirect(`/social/chat?conversation=${conversation.id}`);
}

export async function sendMessage(formData: FormData) {
  const conversationId = value(formData, "conversationId");
  const body = value(formData, "body");
  if (!conversationId || !body) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/social/chat");

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });
  if (error) redirect(`/social/chat?conversation=${conversationId}&error=${encodeURIComponent(error.message)}`);
  revalidatePath("/social/chat");
}
