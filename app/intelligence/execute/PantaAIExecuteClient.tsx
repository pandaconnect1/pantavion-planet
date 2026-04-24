"use client";

import { useState } from "react";

const ACTIONS = [
  "answer",
  "write",
  "research",
  "summarize",
  "translate",
  "code",
  "image",
  "video",
  "slides",
  "notes",
  "memory",
  "plan",
  "data",
  "finance",
  "security",
  "health",
  "legal",
];

export default function PantaAIExecuteClient() {
  const [action, setAction] = useState("research");
  const [task, setTask] = useState("Research the best legal way to combine AI tools inside Pantavion.");
  const [result, setResult] = useState<string>("");

  async function runAction() {
    setResult("Running PantaAI execution...");

    const response = await fetch("/api/intelligence/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        task,
        userText: task,
        locale: "en",
      }),
    });

    const data = await response.json();
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-8 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-cyan-300/20 bg-white/[0.04] p-6 shadow-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">
            Pantavion Intelligence
          </p>

          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            PantaAI Real Execution Center
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            One governed place for AI work: writing, research, coding, images, video,
            slides, memory, notes, planning, finance, safety and more. This page calls
            the real Pantavion execution API and returns a governed execution packet.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-[260px_1fr]">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Capability
              </label>
              <select
                value={action}
                onChange={(event) => setAction(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100"
              >
                {ACTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                User task
              </label>
              <textarea
                value={task}
                onChange={(event) => setTask(event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100"
              />
            </div>
          </div>

          <button
            onClick={runAction}
            className="mt-5 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200"
          >
            Run PantaAI Action
          </button>

          <pre className="mt-6 max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-black/50 p-4 text-xs leading-6 text-cyan-100">
            {result || "No execution yet."}
          </pre>
        </div>
      </section>
    </main>
  );
}
