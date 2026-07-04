"use client";

import { useEffect, useState } from "react";

type LiveModule = {
  id: string;
  title: string;
  description: string;
  status: string;
  route: string;
  api?: string;
  visibleNow: boolean;
  userAction: string;
  nextFoundation: string;
};

type ChatRecord = {
  id: string;
  input: string;
  createdAt: string;
  result?: {
    responseOptions?: {
      short?: string;
      deep?: string;
      nextActions?: string[];
    };
    finalStatus?: string;
  };
};

type PulseRecord = {
  id: string;
  text: string;
  actor: string;
  createdAt: string;
};

type PantavionLiveMode = "live" | "chat" | "pulse" | "people" | "tools" | "execution";

type LiveSurfaceProps = {
  defaultMode?: PantavionLiveMode;
};

const modeLabels = [
  ["live", "Live Home"],
  ["chat", "Chat"],
  ["pulse", "Pulse"],
  ["people", "People"],
  ["tools", "Tools"],
  ["execution", "Execution"]
] as const;

function statusClass(status: string) {
  if (status === "live_foundation") return "border-emerald-400/40 bg-emerald-950/20 text-emerald-100";
  if (status === "internal_runtime") return "border-sky-400/40 bg-sky-950/20 text-sky-100";
  if (status === "requires_auth") return "border-yellow-400/40 bg-yellow-950/20 text-yellow-100";
  if (status === "requires_policy_gate") return "border-orange-400/40 bg-orange-950/20 text-orange-100";
  if (status === "requires_founder_approval") return "border-red-400/40 bg-red-950/20 text-red-100";
  return "border-white/20 bg-white/5 text-white";
}

export default function PantavionLiveSurfaceClient({ defaultMode = "live" }: LiveSurfaceProps) {
  const [mode, setMode] = useState<PantavionLiveMode>(defaultMode);
  const [modules, setModules] = useState<LiveModule[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [pulseInput, setPulseInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatRecord[]>([]);
  const [pulsePosts, setPulsePosts] = useState<PulseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadAll() {
    const [statusResponse, chatResponse, pulseResponse] = await Promise.all([
      fetch("/api/pantavion/live/status", { cache: "no-store" }),
      fetch("/api/pantavion/chat", { cache: "no-store" }),
      fetch("/api/pantavion/pulse", { cache: "no-store" })
    ]);

    const statusData = await statusResponse.json();
    const chatData = await chatResponse.json();
    const pulseData = await pulseResponse.json();

    setModules(statusData.live?.modules || []);
    setChatMessages(chatData.messages || []);
    setPulsePosts(pulseData.posts || []);
  }

  useEffect(() => {
    loadAll().catch((error) => {
      setNotice(error instanceof Error ? error.message : "Could not load Pantavion Live");
    });
  }, []);

  async function sendChat() {
    const input = chatInput.trim();
    if (!input) return;

    setLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/pantavion/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input,
          actor: "pantavion_live_user"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Chat failed");
      }

      setChatInput("");
      await loadAll();
      setMode("chat");
      setNotice("Pantavion Chat saved and executed the request.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Chat request failed");
    } finally {
      setLoading(false);
    }
  }

  async function postPulse() {
    const text = pulseInput.trim();
    if (!text) return;

    setLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/pantavion/pulse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
          actor: "pantavion_live_user"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Pulse failed");
      }

      setPulseInput("");
      await loadAll();
      setMode("pulse");
      setNotice("Pantavion Pulse post saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Pulse post failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050814] px-5 py-7 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#f6d37a]/30 bg-white/[0.04] p-6 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.35em] text-[#f6d37a]">
            Pantavion Live Surface
          </p>

          <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">
                One Living Screen.
                <br />
                Chat, Pulse, People, Tools.
              </h1>

              <p className="mt-4 max-w-3xl text-white/70">
                This is the first visible Pantavion live surface. Chat and Pulse are connected to real
                internal APIs. Sensitive modules show truthful gates instead of fake claims.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm font-bold text-[#f6d37a]">Runtime Status</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-white/45">Chat API</p>
                  <p className="font-bold">live</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-white/45">Pulse API</p>
                  <p className="font-bold">live</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-white/45">Execution</p>
                  <p className="font-bold">internal</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-white/45">Social</p>
                  <p className="font-bold">gated</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {modeLabels.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={
                  mode === value
                    ? "rounded-2xl bg-[#f6d37a] px-4 py-2 text-sm font-bold text-black"
                    : "rounded-2xl border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/75 hover:border-[#f6d37a]/60"
                }
              >
                {label}
              </button>
            ))}
          </div>

          {notice ? (
            <div className="mt-5 rounded-2xl border border-[#f6d37a]/30 bg-[#f6d37a]/10 p-4 text-sm text-[#f6d37a]">
              {notice}
            </div>
          ) : null}

          <div className="mt-7 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <h2 className="text-xl font-black">Live Input</h2>

              <div className="mt-5">
                <label className="text-sm font-bold text-white/70">Chat with Pantavion</label>
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Write anything. Pantavion will convert it into intent, plan and execution result."
                  className="mt-2 min-h-32 w-full rounded-2xl border border-white/15 bg-black/40 p-4 text-white outline-none placeholder:text-white/35 focus:border-[#f6d37a]"
                />
                <button
                  onClick={sendChat}
                  disabled={loading}
                  className="mt-3 rounded-2xl bg-[#f6d37a] px-5 py-3 font-bold text-black disabled:opacity-50"
                >
                  Send to Pantavion Chat
                </button>
              </div>

              <div className="mt-7">
                <label className="text-sm font-bold text-white/70">Post to Pulse</label>
                <textarea
                  value={pulseInput}
                  onChange={(event) => setPulseInput(event.target.value)}
                  placeholder="Write a local Pantavion Pulse post."
                  className="mt-2 min-h-24 w-full rounded-2xl border border-white/15 bg-black/40 p-4 text-white outline-none placeholder:text-white/35 focus:border-[#f6d37a]"
                />
                <button
                  onClick={postPulse}
                  disabled={loading}
                  className="mt-3 rounded-2xl border border-[#f6d37a] px-5 py-3 font-bold text-[#f6d37a] disabled:opacity-50"
                >
                  Publish Pulse
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-black/25 p-5">
              {mode === "chat" ? (
                <div>
                  <h2 className="text-xl font-black">Pantavion Chat</h2>
                  <div className="mt-4 space-y-3">
                    {chatMessages.length === 0 ? (
                      <p className="text-white/50">No chat messages yet.</p>
                    ) : (
                      chatMessages.slice().reverse().map((message) => (
                        <article key={message.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs text-white/45">{new Date(message.createdAt).toLocaleString()}</p>
                          <p className="mt-2 font-bold">{message.input}</p>
                          <p className="mt-3 text-sm text-[#f6d37a]">
                            {message.result?.responseOptions?.short || "Pantavion execution completed."}
                          </p>
                          <p className="mt-2 text-xs text-white/50">
                            status: {message.result?.finalStatus || "unknown"}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              ) : mode === "pulse" ? (
                <div>
                  <h2 className="text-xl font-black">Pantavion Pulse</h2>
                  <div className="mt-4 space-y-3">
                    {pulsePosts.length === 0 ? (
                      <p className="text-white/50">No pulse posts yet.</p>
                    ) : (
                      pulsePosts.slice().reverse().map((post) => (
                        <article key={post.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs text-white/45">
                            {post.actor} · {new Date(post.createdAt).toLocaleString()}
                          </p>
                          <p className="mt-2">{post.text}</p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-black">Modules</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {modules.map((item) => (
                      <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-black">{item.title}</h3>
                          <span className={`rounded-xl border px-2 py-1 text-[11px] ${statusClass(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-white/65">{item.description}</p>
                        <p className="mt-3 text-xs text-[#f6d37a]">Now: {item.userAction}</p>
                        <p className="mt-2 text-xs text-white/45">Next: {item.nextFoundation}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

