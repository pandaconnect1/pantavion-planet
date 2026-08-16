"use client";

import { useEffect, useState } from "react";

type ApprovalItem = {
  id: string;
  title: string;
  description: string;
  risk: string;
  zone: string;
  status: string;
  reason: string;
  nextSafeStep: string;
};

type Snapshot = {
  ok: boolean;
  generatedAt: string;
  pendingCount: number;
  queue: ApprovalItem[];
  doctrine: string;
};

export default function PantavionFounderApprovalsClient() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/pantavion/agents/runtime/approvals", {
      cache: "no-store"
    });
    const data = await response.json();
    setSnapshot(data);
  }

  async function decide(itemId: string, decision: "approved" | "blocked") {
    setMessage("Recording founder decision...");

    const response = await fetch("/api/pantavion/agents/runtime/approvals", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        itemId,
        decision,
        actor: "founder"
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      setMessage(data.error || "Decision failed");
      return;
    }

    setMessage(`${decision.toUpperCase()} recorded for ${itemId}`);
    await load();
  }

  useEffect(() => {
    load().catch(() => setMessage("Could not load approval dashboard."));
  }, []);

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-[#050814] text-white p-8">
        <p>Loading Pantavion Founder Approval Dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050814] text-white p-8">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.35em] text-[#f6d37a]">
          Pantavion Founder Control
        </p>

        <h1 className="mt-4 text-5xl font-black">
          Founder Approval Dashboard
        </h1>

        <p className="mt-4 max-w-3xl text-white/80">
          Safe implementation can continue automatically. Risk actions wait here
          for founder approval before execution.
        </p>

        <div className="mt-8 rounded-3xl border border-[#f6d37a]/40 bg-black/30 p-5">
          <p className="font-bold text-[#f6d37a]">
            Pending approvals: {snapshot.pendingCount}
          </p>
          <p className="mt-2 text-sm text-white/70">{snapshot.doctrine}</p>
          {message ? <p className="mt-3 text-sm text-[#8fffc1]">{message}</p> : null}
        </div>

        <div className="mt-8 grid gap-5">
          {snapshot.queue.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-white/15 bg-white/[0.04] p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#f6d37a]">
                    {item.zone} / {item.risk}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">{item.title}</h2>
                </div>

                <span className="rounded-full border border-[#f6d37a]/50 px-4 py-2 text-sm text-[#f6d37a]">
                  {item.status}
                </span>
              </div>

              <p className="mt-4 text-white/80">{item.description}</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-black/30 p-4">
                  <p className="text-sm font-bold text-[#f6d37a]">Why approval is required</p>
                  <p className="mt-2 text-sm text-white/75">{item.reason}</p>
                </div>

                <div className="rounded-2xl bg-black/30 p-4">
                  <p className="text-sm font-bold text-[#f6d37a]">Next safe step</p>
                  <p className="mt-2 text-sm text-white/75">{item.nextSafeStep}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => decide(item.id, "approved")}
                  className="rounded-full bg-[#f6d37a] px-5 py-3 font-black text-black"
                >
                  Approve
                </button>

                <button
                  onClick={() => decide(item.id, "blocked")}
                  className="rounded-full border border-red-400 px-5 py-3 font-black text-red-200"
                >
                  Block
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
