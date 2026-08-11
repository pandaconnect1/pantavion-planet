import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/login?next=/messages");

  const { data: memberships, error: membershipError } = await supabase
    .from("conversation_members")
    .select("conversation_id,role,joined_at")
    .eq("user_id", auth.user.id)
    .is("left_at", null)
    .order("joined_at", { ascending: false });

  const ids = (memberships ?? []).map((item) => item.conversation_id);
  const { data: conversations, error: conversationError } = ids.length
    ? await supabase
        .from("conversations")
        .select("id,kind,title,created_at,updated_at")
        .in("id", ids)
        .order("updated_at", { ascending: false })
    : { data: [], error: null };

  const { data: recentMessages } = ids.length
    ? await supabase
        .from("messages")
        .select("id,conversation_id,body,message_type,created_at,sender_id")
        .in("conversation_id", ids)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(150)
    : { data: [] };

  const latestByConversation = new Map<string, NonNullable<typeof recentMessages>[number]>();
  for (const message of recentMessages ?? []) {
    if (!latestByConversation.has(message.conversation_id)) latestByConversation.set(message.conversation_id, message);
  }

  const backendReady = !membershipError && !conversationError;

  return (
    <main className="min-h-screen bg-[#f5f9fd] text-slate-950">
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:px-12">
        <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Link href="/" className="font-black tracking-[0.18em] text-[#173f72] no-underline">PANTAVION</Link>
          <div className="flex gap-2">
            <Link href="/people" className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 no-underline">People</Link>
            <Link href="/profile" className="rounded-full bg-[#2467aa] px-3 py-2 text-xs font-black text-white no-underline">Profile</Link>
          </div>
        </nav>

        <header className="py-9">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#3474b8]">MESSAGES</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#173f72] sm:text-5xl">Οι συνομιλίες σου.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Πραγματικές Pantavion συνομιλίες από το ίδιο People & Communication σύστημα.</p>
        </header>

        {!backendReady && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Η βάση συνομιλιών δεν έχει επιβεβαιωθεί ακόμη στο production. Δεν εμφανίζονται ψεύτικες συνομιλίες.
          </div>
        )}

        <div className="grid gap-3">
          {(conversations ?? []).map((conversation) => {
            const latest = latestByConversation.get(conversation.id);
            return (
              <Link key={conversation.id} href={`/messages/${conversation.id}`} className="rounded-[1.25rem] border border-slate-200 bg-white p-5 no-underline shadow-sm transition hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-black text-slate-900">{conversation.title || (conversation.kind === "direct" ? "Ιδιωτική συνομιλία" : conversation.kind === "group" ? "Ομαδική συνομιλία" : "Συνομιλία")}</h2>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">{latest?.body || (latest ? `[${latest.message_type}]` : "Δεν υπάρχουν ακόμη μηνύματα.")}</p>
                  </div>
                  <span className="text-xs font-black text-[#2d6ca9]">Άνοιγμα →</span>
                </div>
              </Link>
            );
          })}
        </div>

        {backendReady && !(conversations ?? []).length && (
          <div className="rounded-[1.35rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Δεν έχεις ακόμη συνομιλίες. <Link href="/people" className="font-black text-[#2467aa]">Βρες ανθρώπους και δημιούργησε σύνδεση.</Link>
          </div>
        )}
      </section>
    </main>
  );
}
