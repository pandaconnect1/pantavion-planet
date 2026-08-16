"use client";

import { useState } from "react";

type EntryResult = {
  ok?: boolean;
  saved?: boolean;
  assessment?: {
    mode: string;
    suggestedCategory: string;
    suggestedSubcategory: string;
    immediateResponse: string;
    canAnswerNow: boolean;
    requiresProviderAdapter: boolean;
    requiresFounderApproval: boolean;
    requiresPolicyGate: boolean;
    safeNextActions: string[];
    blockedActions: string[];
  };
};

const modes = [
  ["write", "Write / Ask"],
  ["talk", "Talk"],
  ["search", "Search"],
  ["social", "Social"],
  ["messaging", "Chat"],
  ["dating", "Dating"],
  ["payments", "Stripe / Pay"],
  ["vip", "VIP"],
  ["saved_chat", "Save Chat"],
  ["tools", "Tools"]
];

export default function PantavionUniversalEntryClient() {
  const [mode, setMode] = useState("write");
  const [text, setText] = useState("");
  const [saveChat, setSaveChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EntryResult | null>(null);
  const [error, setError] = useState("");

  async function submitEntry() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/pantavion/entry", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          mode,
          text,
          saveChat,
          actor: "pantavion_entry_user"
        })
      });

      const data = (await response.json()) as EntryResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Entry request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-[#f6d37a]/30 bg-white/5 p-6 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-[#f6d37a]">
            Pantavion Universal Entry
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-6xl">
            One Entry. All Tools. All Humanity.
          </h1>

          <p className="mt-4 max-w-3xl text-white/75">
            Write, talk, search, save chat, request social, messaging, dating,
            payments, VIP and any missing category. Every request becomes a real
            Pantavion gateway action with status, policy, adapter and approval
            boundaries.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {modes.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={
                  mode === value
                    ? "rounded-2xl border border-[#f6d37a] bg-[#f6d37a] px-4 py-3 text-sm font-bold text-black"
                    : "rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white/80 hover:border-[#f6d37a]/70"
                }
              >
                {label}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ask Pantavion anything. If the category does not exist, Pantavion opens it as a work order."
            className="mt-6 min-h-40 w-full rounded-2xl border border-white/15 bg-black/40 p-4 text-white outline-none placeholder:text-white/35 focus:border-[#f6d37a]"
          />

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <label className="flex items-center gap-3 text-sm text-white/75">
              <input
                type="checkbox"
                checked={saveChat}
                onChange={(event) => setSaveChat(event.target.checked)}
                className="h-5 w-5"
              />
              Save this request into local Pantavion entry memory foundation
            </label>

            <button
              onClick={submitEntry}
              disabled={loading}
              className="rounded-2xl bg-[#f6d37a] px-6 py-3 font-bold text-black disabled:opacity-50"
            >
              {loading ? "Opening..." : "Open Pantavion Entry"}
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-950/30 p-4 text-red-100">
              {error}
            </div>
          ) : null}

          {result?.assessment ? (
            <div className="mt-6 rounded-2xl border border-[#f6d37a]/25 bg-black/35 p-5">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-white/50">Mode</p>
                  <p className="font-bold text-[#f6d37a]">{result.assessment.mode}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Category</p>
                  <p className="font-bold">{result.assessment.suggestedCategory}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Subcategory</p>
                  <p className="font-bold">{result.assessment.suggestedSubcategory}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Saved</p>
                  <p className="font-bold">{result.saved ? "yes" : "no"}</p>
                </div>
              </div>

              <p className="mt-5 text-white/80">{result.assessment.immediateResponse}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Provider adapter</p>
                  <p className="font-bold">
                    {result.assessment.requiresProviderAdapter ? "required" : "not required now"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Founder approval</p>
                  <p className="font-bold">
                    {result.assessment.requiresFounderApproval ? "required" : "not required now"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Policy gate</p>
                  <p className="font-bold">
                    {result.assessment.requiresPolicyGate ? "required" : "not required now"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
