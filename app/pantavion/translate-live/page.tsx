"use client";

import { FormEvent, useState } from "react";

export default function PantavionTranslateLivePage() {
  const [text, setText] = useState("Καλημέρα, χρειάζομαι βοήθεια στο νοσοκομείο.");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [domain, setDomain] = useState("medical");
  const [tone, setTone] = useState("natural");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Μετάφραση...");
    setResult("");

    const response = await fetch("/api/pantavion/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLanguage, domain, tone, bidirectional: true }),
    });

    const payload = await response.json();
    setStatus(payload.status || (payload.ok ? "ok" : "error"));
    setResult(payload.translatedText || payload.warning || payload.error || "");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#192b55_0,#071020_48%,#02040b_100%)] px-4 py-6 text-[#fff8e7] sm:px-8">
      <section className="mx-auto max-w-5xl rounded-[2rem] border border-[#f6c85f]/25 bg-[#071020]/85 p-5 shadow-2xl sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#f6c85f]">
          PANTAVION UNIVERSAL TRANSLATION RUNTIME
        </p>

        <h1 className="mt-4 text-4xl font-black sm:text-6xl">
          Πραγματικός διερμηνέας για κάθε άνθρωπο.
        </h1>

        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-200">
          Γράφεις οποιαδήποτε γλώσσα, διάλεκτο ή τοπική μορφή λόγου. Το Pantavion περνάει το αίτημα στο πραγματικό translation API.
          Αν δεν υπάρχει provider key, δεν λέει ψέματα: εμφανίζει provider-required.
        </p>

        <form onSubmit={submit} className="mt-8 grid gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[140px] rounded-2xl bg-black/40 p-4 text-white"
          />

          <input
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="rounded-2xl bg-black/40 p-4 text-white"
            placeholder="Target language / dialect"
          />

          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="rounded-2xl bg-black/40 p-4 text-white">
            <option value="general">general</option>
            <option value="social">social</option>
            <option value="professional">professional</option>
            <option value="medical">medical</option>
            <option value="legal">legal</option>
            <option value="scientific">scientific</option>
            <option value="emergency">emergency</option>
            <option value="education">education</option>
            <option value="travel">travel</option>
            <option value="technical">technical</option>
          </select>

          <select value={tone} onChange={(e) => setTone(e.target.value)} className="rounded-2xl bg-black/40 p-4 text-white">
            <option value="natural">natural</option>
            <option value="formal">formal</option>
            <option value="simple">simple</option>
            <option value="professional">professional</option>
            <option value="local_demotic">local/demotic</option>
          </select>

          <button className="rounded-full bg-[#f6c85f] px-6 py-4 font-black text-[#071020]">
            Μετάφραση τώρα
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-[#f6c85f]/20 bg-black/30 p-4">
          <p className="text-sm font-black text-[#f6c85f]">Status: {status}</p>
          <p className="mt-3 whitespace-pre-wrap text-lg leading-8 text-slate-100">{result}</p>
        </div>
      </section>
    </main>
  );
}
