import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ConversationClient from "./conversation-client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ conversationId: string }> };

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return (
      <main className="min-h-screen bg-[#f5f9fd] p-6">
        <section className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
          <p className="font-bold text-slate-700">Χρειάζεται σύνδεση.</p>
          <Link href="/auth/login" className="mt-4 inline-block rounded-full bg-[#2467aa] px-4 py-2 text-sm font-black text-white no-underline">
            Σύνδεση
          </Link>
        </section>
      </main>
    );
  }

  const [messagesResult, membersResult, ownProfileResult] = await Promise.all([
    supabase
      .from("messages")
      .select("id,conversation_id,sender_id,body,original_language,message_type,created_at,edited_at,deleted_at")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .is("left_at", null),
    supabase
      .from("profiles")
      .select("language")
      .eq("id", auth.user.id)
      .maybeSingle(),
  ]);

  const memberIds = (membersResult.data ?? []).map((member) => member.user_id);
  const otherMemberId = memberIds.find((id) => id !== auth.user.id) ?? null;
  const peerProfileResult = otherMemberId
    ? await supabase.from("profiles").select("language").eq("id", otherMemberId).maybeSingle()
    : { data: null, error: null };

  const backendError = messagesResult.error || membersResult.error;
  const currentUserLanguage = ownProfileResult.data?.language || "el";
  const peerLanguage = peerProfileResult.data?.language || null;

  return (
    <ConversationClient
      conversationId={conversationId}
      currentUserId={auth.user.id}
      currentUserLanguage={currentUserLanguage}
      peerLanguage={peerLanguage}
      initialMessages={messagesResult.data ?? []}
      backendReady={!backendError}
      backendMessage={backendError?.message ?? null}
    />
  );
}
