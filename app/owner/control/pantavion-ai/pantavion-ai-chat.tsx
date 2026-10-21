"use client";
import { useState } from "react";
type Message = { role: "user" | "assistant"; content: string };
export default function PantavionAIChat() {
 const [messages, setMessages] = useState<Message[]>([]);
 const [input, setInput] = useState("");
 const [task, setTask] = useState<"chat" | "code" | "reason">("chat");
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 async function send(event: React.FormEvent) {
  event.preventDefault();
  const text = input.trim();
  if (!text || busy) return;
  const history = messages.slice(-12);
  setBusy(true); setError(""); setInput("");
  setMessages(old => [...old, { role: "user", content: text }]);
  try {
   const response = await fetch("/api/owner/pantavion-ai/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, history, task })
   });
   const result = await response.json();
   if (!response.ok) throw new Error(result.error || "request_failed");
   setMessages(old => [...old, { role: "assistant", content: result.answer }]);
  } catch (e) { setError(e instanceof Error ? e.message : "unknown_error"); }
  finally { setBusy(false); }
 }
 return <section className="space-y-4">
  <div aria-live="polite" className="min-h-80 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-700 p-4 space-y-4">
   {messages.length === 0 && <p className="text-slate-400">Γράψε την πρώτη εντολή. Απαιτείται ενεργό ιδιωτικό AI endpoint.</p>}
   {messages.map((m,i) => <article key={i} className={m.role === "user" ? "rounded-lg bg-slate-800 p-3" : "rounded-lg bg-slate-900 p-3"}>
    <p className="text-xs text-cyan-300">{m.role === "user" ? "Founder" : "Pantavion AI"}</p>
    <p className="whitespace-pre-wrap break-words">{m.content}</p>
   </article>)}
  </div>
  {error && <p role="alert" className="text-amber-300">AI: {error}</p>}
  <div className="flex gap-2" aria-label="AI model task">\n   <label htmlFor="pantavion-task">Λειτουργία AI</label>\n   <select id="pantavion-task" value={task} onChange={e => setTask(e.target.value as "chat" | "code" | "reason")} className="rounded-lg bg-slate-900 border border-slate-600 p-2">\n    <option value="chat">Συνομιλία</option><option value="code">Προγραμματισμός</option><option value="reason">Σύνθετη ανάλυση</option>\n   </select>\n  </div>\n  <form onSubmit={send} className="flex gap-2">
   <label htmlFor="pantavion-ai-input" className="sr-only">Εντολή AI</label>
   <textarea id="pantavion-ai-input" value={input} onChange={e=>setInput(e.target.value)} maxLength={8000}
    className="flex-1 rounded-lg bg-slate-900 border border-slate-600 p-3" rows={3} placeholder="Τι θέλεις να κατασκευάσουμε;" />
   <button disabled={busy || !input.trim()} className="rounded-lg bg-cyan-700 px-5 py-3 disabled:opacity-50">{busy ? "Αναμονή…" : "Αποστολή"}</button>
  </form>
 </section>;
}
