"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = { id: string; conversation_id: string; sender_id: string; body: string | null; original_language: string | null; message_type: string; created_at: string; edited_at: string | null; deleted_at: string | null };

export default function ConversationClient({ conversationId, currentUserId, initialMessages, backendReady, backendMessage }: { conversationId: string; currentUserId: string; initialMessages: Message[]; backendReady: boolean; backendMessage: string | null }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!backendReady) return;
    const channel = supabase
      .channel(`pantavion-conversation-${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, async (payload) => {
        const incoming = payload.new as Message;
        setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
        if (incoming.sender_id !== currentUserId) {
          await supabase.rpc("pantavion_mark_message_receipt", { p_message_id: incoming.id, p_state: "delivered" });
          await supabase.rpc("pantavion_mark_message_receipt", { p_message_id: incoming.id, p_state: "read" });
        }
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [backendReady, conversationId, currentUserId, supabase]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending || !backendReady) return;
    setSending(true); setNotice(null);
    const clientMessageId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const response = await fetch("/api/messages/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ conversationId, body, clientMessageId }) });
    const json = await response.json();
    setSending(false);
    if (!response.ok) return setNotice(json.detail || json.error || "Το μήνυμα απέτυχε.");
    setText("");
    setNotice("Το μήνυμα έγινε accepted από το Pantavion. Δεν εμφανίζουμε delivered/read μέχρι να επιβεβαιωθεί.");
  }

  return (
    <main className="min-h-screen bg-[#f5f9fd] text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-5 sm:px-8">
        <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><Link href="/people" className="text-sm font-black text-[#173f72] no-underline">← People</Link><span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">PANTAVION MESSAGES</span></nav>

        <header className="py-5"><h1 className="text-2xl font-black text-[#173f72]">Conversation</h1><p className="mt-1 text-xs text-slate-500">Truthful states: accepted ≠ delivered ≠ read.</p></header>

        {!backendReady && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><strong>Messaging backend pending.</strong>{backendMessage ? <span className="mt-1 block text-xs opacity-70">{backendMessage}</span> : null}</div>}

        <div className="flex-1 space-y-2 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {messages.map((message) => {
            const mine = message.sender_id === currentUserId;
            return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${mine ? "bg-[#2467aa] text-white" : "bg-slate-100 text-slate-800"}`}><p>{message.body}</p><p className={`mt-1 text-[10px] ${mine ? "text-blue-100" : "text-slate-400"}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div></div>;
          })}
          {!messages.length && <p className="py-10 text-center text-sm text-slate-400">Η συνομιλία είναι άδεια. Στείλε το πρώτο πραγματικό μήνυμα.</p>}
        </div>

        {notice && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">{notice}</p>}
        <form onSubmit={send} className="mt-3 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><input value={text} onChange={(e) => setText(e.target.value)} disabled={!backendReady || sending} placeholder="Γράψε μήνυμα..." maxLength={10000} className="min-w-0 flex-1 rounded-xl border-0 bg-slate-50 px-4 py-3 text-sm outline-none disabled:opacity-50"/><button disabled={!backendReady || sending || !text.trim()} className="rounded-xl bg-[#123b67] px-5 py-3 text-sm font-black text-white disabled:opacity-40">{sending ? "..." : "Αποστολή"}</button></form>
      </section>
    </main>
  );
}
