"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  original_language: string | null;
  message_type: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

type TranslationResult = {
  ok?: boolean;
  translatedText?: string;
  translation?: string;
  text?: string;
  output?: string;
  message?: string;
  error?: string;
  provider?: string;
};

const CHAT_LANGUAGES = [
  ["el", "Ελληνικά"],
  ["en", "English"],
  ["ar", "العربية"],
  ["ru", "Русский"],
  ["tr", "Türkçe"],
  ["de", "Deutsch"],
  ["fr", "Français"],
  ["es", "Español"],
  ["it", "Italiano"],
  ["zh", "中文"],
  ["ja", "日本語"],
  ["ko", "한국어"],
  ["hi", "हिन्दी"],
  ["ur", "اردو"],
] as const;

export default function ConversationClient({
  conversationId,
  currentUserId,
  initialMessages,
  backendReady,
  backendMessage,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  backendReady: boolean;
  backendMessage: string | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("el");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translationProviders, setTranslationProviders] = useState<Record<string, string>>({});
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);
  const [realtimeState, setRealtimeState] = useState<"connecting" | "live" | "error">("connecting");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!backendReady) return;
    const channel = supabase
      .channel(`pantavion-conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const incoming = payload.new as Message;
          setMessages((current) =>
            current.some((item) => item.id === incoming.id) ? current : [...current, incoming],
          );
          if (incoming.sender_id !== currentUserId) {
            await supabase.rpc("pantavion_mark_message_receipt", {
              p_message_id: incoming.id,
              p_state: "delivered",
            });
            await supabase.rpc("pantavion_mark_message_receipt", {
              p_message_id: incoming.id,
              p_state: "read",
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeState("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setRealtimeState("error");
        else setRealtimeState("connecting");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [backendReady, conversationId, currentUserId, supabase]);

  async function translateMessage(message: Message) {
    const body = message.body?.trim();
    if (!body || translatingMessageId) return;
    if (translations[message.id]) {
      setTranslations((current) => {
        const next = { ...current };
        delete next[message.id];
        return next;
      });
      return;
    }

    setTranslatingMessageId(message.id);
    setNotice(null);
    try {
      const response = await fetch("/api/pantavion/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: body,
          sourceLanguage: message.original_language || "auto",
          targetLanguage,
          bidirectional: true,
          domain: "general",
          tone: "natural",
          surface: "pantavion-chat",
          sessionId: conversationId,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as TranslationResult;
      const translated = String(
        result.translatedText || result.translation || result.text || result.output || "",
      ).trim();
      if (!response.ok || !translated) {
        setNotice(result.message || result.error || "Η μετάφραση δεν είναι διαθέσιμη τώρα.");
        return;
      }
      setTranslations((current) => ({ ...current, [message.id]: translated }));
      setTranslationProviders((current) => ({
        ...current,
        [message.id]: result.provider || "Pantavion",
      }));
    } finally {
      setTranslatingMessageId(null);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending || !backendReady) return;
    setSending(true);
    setNotice(null);
    const clientMessageId =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const response = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        conversationId,
        body,
        clientMessageId,
        originalLanguage: sourceLanguage,
      }),
    });
    const json = await response.json().catch(() => ({}));
    setSending(false);
    if (!response.ok) {
      setNotice(json.detail || json.error || "Το μήνυμα απέτυχε.");
      return;
    }
    setText("");
    setNotice("Accepted από το Pantavion. Delivered/read εμφανίζονται μόνο όταν επιβεβαιωθούν.");
  }

  return (
    <main className="min-h-screen bg-[#f5f9fd] text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-5 sm:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Link href="/people" className="text-sm font-black text-[#173f72] no-underline">
            ← People
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                realtimeState === "live"
                  ? "bg-emerald-50 text-emerald-700"
                  : realtimeState === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              Realtime {realtimeState === "live" ? "LIVE" : realtimeState === "error" ? "ERROR" : "…"}
            </span>
            <Link href="/translate" className="text-xs font-black text-[#2467aa] no-underline">
              Interpreter
            </Link>
          </div>
        </nav>

        <header className="py-5">
          <h1 className="text-2xl font-black text-[#173f72]">Pantavion Chat</h1>
          <p className="mt-1 text-xs text-slate-500">
            Realtime συνομιλία · accepted ≠ delivered ≠ read · μετάφραση μέσα στο μήνυμα.
          </p>
        </header>

        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
          <label className="font-black text-slate-600">Γλώσσα που γράφω</label>
          <select
            value={sourceLanguage}
            onChange={(event) => setSourceLanguage(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
          >
            {CHAT_LANGUAGES.map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
          <label className="ml-auto font-black text-slate-600">Μετάφραση προς</label>
          <select
            value={targetLanguage}
            onChange={(event) => setTargetLanguage(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
          >
            {CHAT_LANGUAGES.map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        {!backendReady && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Messaging backend pending.</strong>
            {backendMessage ? <span className="mt-1 block text-xs opacity-70">{backendMessage}</span> : null}
          </div>
        )}

        <div className="flex-1 space-y-2 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {messages.map((message) => {
            const mine = message.sender_id === currentUserId;
            const translated = translations[message.id];
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                    mine ? "bg-[#2467aa] text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p>{message.body}</p>
                  {translated ? (
                    <div className={`mt-2 rounded-xl px-3 py-2 ${mine ? "bg-white/15" : "bg-white"}`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] opacity-70">
                        Pantavion Translation · {translationProviders[message.id] || "Pantavion"}
                      </p>
                      <p className="mt-1">{translated}</p>
                    </div>
                  ) : null}
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className={`text-[10px] ${mine ? "text-blue-100" : "text-slate-400"}`}>
                      {message.original_language ? `${message.original_language.toUpperCase()} · ` : ""}
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {message.body ? (
                      <button
                        type="button"
                        onClick={() => void translateMessage(message)}
                        disabled={Boolean(translatingMessageId && translatingMessageId !== message.id)}
                        className={`text-[10px] font-black underline underline-offset-2 disabled:opacity-40 ${
                          mine ? "text-blue-100" : "text-[#2467aa]"
                        }`}
                      >
                        {translatingMessageId === message.id
                          ? "Μεταφράζω…"
                          : translated
                            ? "Απόκρυψη"
                            : `Μετάφραση → ${targetLanguage.toUpperCase()}`}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          {!messages.length && (
            <p className="py-10 text-center text-sm text-slate-400">
              Η συνομιλία είναι άδεια. Στείλε το πρώτο πραγματικό μήνυμα.
            </p>
          )}
        </div>

        {notice && (
          <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            {notice}
          </p>
        )}
        <form
          onSubmit={send}
          className="mt-3 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={!backendReady || sending}
            placeholder="Γράψε μήνυμα..."
            maxLength={10000}
            className="min-w-0 flex-1 rounded-xl border-0 bg-slate-50 px-4 py-3 text-sm outline-none disabled:opacity-50"
          />
          <button
            disabled={!backendReady || sending || !text.trim()}
            className="rounded-xl bg-[#123b67] px-5 py-3 text-sm font-black text-white disabled:opacity-40"
          >
            {sending ? "..." : "Αποστολή"}
          </button>
        </form>
      </section>
    </main>
  );
}
