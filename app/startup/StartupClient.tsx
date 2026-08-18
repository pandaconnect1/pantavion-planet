"use client";

import { FormEvent, useState } from "react";

type StartupPacket = {
  id: string;
  currentStage: string;
  nextActions: string[];
  evidenceGaps: string[];
  governance: string[];
};

export default function StartupClient() {
  const [idea, setIdea] = useState("");
  const [problem, setProblem] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [geography, setGeography] = useState("");
  const [sector, setSector] = useState("");
  const [budget, setBudget] = useState("");
  const [founderGoal, setFounderGoal] = useState("");
  const [packet, setPacket] = useState<StartupPacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/pantavion/startup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, problem, targetCustomer, geography, sector, budget, founderGoal }),
      });
      const body = await response.json();
      if (!response.ok || !body?.ok) throw new Error(body?.error || "Startup planning failed");
      setPacket(body.packet);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Startup planning failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Pantavion Startup</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Evidence-first startup execution</h1>
          <p className="max-w-3xl text-slate-300">
            Turn a startup idea into a governed execution path: problem, customer, market, validation,
            product, go-to-market, finance, funding, operations, risk, metrics and scale.
          </p>
        </header>

        <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:grid-cols-2">
          <Field label="Idea" value={idea} onChange={setIdea} placeholder="What do you want to build?" />
          <Field label="Problem" value={problem} onChange={setProblem} placeholder="What real problem does it solve?" />
          <Field label="Target customer" value={targetCustomer} onChange={setTargetCustomer} placeholder="Who uses it / who pays?" />
          <Field label="Geography" value={geography} onChange={setGeography} placeholder="Country / region / global" />
          <Field label="Sector" value={sector} onChange={setSector} placeholder="Industry or market category" />
          <Field label="Budget" value={budget} onChange={setBudget} placeholder="Available budget / funding constraint" />
          <div className="sm:col-span-2">
            <Field label="Founder goal" value={founderGoal} onChange={setFounderGoal} placeholder="What outcome defines success?" />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-sky-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {loading ? "Building evidence plan…" : "Build startup plan"}
            </button>
          </div>
        </form>

        {error ? <p className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-200">{error}</p> : null}

        {packet ? (
          <section className="grid gap-5 md:grid-cols-2">
            <Card title={`Current gate: ${packet.currentStage}`} items={packet.nextActions} />
            <Card title="Evidence gaps" items={packet.evidenceGaps} />
            <div className="md:col-span-2">
              <Card title="Governance" items={packet.governance} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-200">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500"
      />
    </label>
  );
}

function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <ul className="space-y-2 text-sm text-slate-300">
        {items.map((item) => (
          <li key={item} className="rounded-lg bg-slate-950/70 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
