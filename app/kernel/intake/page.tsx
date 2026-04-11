"use client";

import { useMemo, useState } from "react";

type IntakeResult = {
  input: string;
  detectedType: string;
  targetModule: string;
  userSegment: string;
  incomeRelated: boolean;
  learningRelated: boolean;
  toolDiscovery: boolean;
  businessFramework: boolean;
  deliveryType: string;
  matchedSeedIds: string[];
  matchedThemes: string[];
  cleanConclusion: string;
};

function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "gold" | "blue" | "green";
}) {
  const styles =
    tone === "gold"
      ? "border-[#D6A646] bg-[#2C210A] text-[#F4D37D]"
      : tone === "blue"
        ? "border-[#244777] bg-[#08182F] text-[#D7E5FA]"
        : tone === "green"
          ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
          : "border-white/10 bg-white/5 text-zinc-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${styles}`}>
      {children}
    </span>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#244777] bg-[#08182F] px-4 py-3">
      <div className="text-sm text-[#D7E5FA]">{label}</div>
      <Chip tone={value ? "green" : "default"}>{value ? "yes" : "no"}</Chip>
    </div>
  );
}

export default function KernelIntakePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntakeResult | null>(null);

  const examples = useMemo(
    () => [
      "build multilingual voice agents for business lead qualification",
      "find ai tools for writing coding design and automation",
      "create learning roadmap for python sql ml and data science",
      "build company operating system with okrs scorecards and accountability",
      "create freelance income workflow for offers pricing and client acquisition",
      "build app generator that turns ideas into software and deploys it"
    ],
    []
  );

  async function analyze(value?: string) {
    const text = (value ?? input).trim();
    if (!text) return;

    setLoading(true);
    setResult(null);

    const res = await fetch("/api/kernel/intake", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text }),
    });

    const data = await res.json();

    if (data?.ok) {
      setResult(data.result);
      setInput(text);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#041633] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[30px] border border-[#244777] bg-[linear-gradient(180deg,rgba(7,18,40,0.97)_0%,rgba(8,26,51,0.94)_100%)] p-6">
          <div className="text-[11px] uppercase tracking-[0.45em] text-[#D6A646]">
            Pantavion Kernel Intake
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Classify demand into Pantavion action
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-[#D7E5FA] md:text-base">
            Το kernel παίρνει input τζαι αποφασίζει τι είναι, πού πάει, ποιο segment αφορά,
            αν είναι income / learning / tool-discovery / business-framework, τζαι ποιο είναι
            το σωστό delivery mode.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="γράψε input για το Pantavion Kernel..."
              className="min-h-[130px] rounded-3xl border border-[#244777] bg-[#08182F] px-5 py-4 text-sm text-white outline-none placeholder:text-[#8EA7CF]"
            />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => analyze()}
                className="rounded-2xl border border-[#D6A646]/50 bg-[linear-gradient(180deg,#E5BD68_0%,#BE8C2F_100%)] px-5 py-3 text-sm font-medium text-[#07152D]"
              >
                Analyze input
              </button>

              <a
                href="/signals"
                className="rounded-2xl border border-[#244777] bg-[#08182F] px-5 py-3 text-sm font-medium text-[#D7E5FA]"
              >
                Open signals
              </a>

              <a
                href="/kernel"
                className="rounded-2xl border border-[#244777] bg-[#08182F] px-5 py-3 text-sm font-medium text-[#D7E5FA]"
              >
                Open kernel
              </a>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  onClick={() => analyze(example)}
                  className="rounded-full border border-[#244777] bg-[#08182F] px-3 py-1.5 text-xs text-[#D7E5FA]"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-[30px] border border-[#244777] bg-[#08182F] p-6 text-[#D7E5FA]">
            analyzing...
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[30px] border border-[#244777] bg-[#08182F] p-6">
              <div className="mb-4 text-[11px] uppercase tracking-[0.35em] text-[#D6A646]">
                Clean classification
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#244777] bg-[#0B1D39] p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#8EA7CF]">Detected type</div>
                  <div className="mt-2 text-xl font-semibold text-white">{result.detectedType}</div>
                </div>

                <div className="rounded-2xl border border-[#244777] bg-[#0B1D39] p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#8EA7CF]">Target module</div>
                  <div className="mt-2 text-xl font-semibold text-white">{result.targetModule}</div>
                </div>

                <div className="rounded-2xl border border-[#244777] bg-[#0B1D39] p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#8EA7CF]">User segment</div>
                  <div className="mt-2 text-xl font-semibold text-white">{result.userSegment}</div>
                </div>

                <div className="rounded-2xl border border-[#244777] bg-[#0B1D39] p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#8EA7CF]">Delivery type</div>
                  <div className="mt-2 text-xl font-semibold text-white">{result.deliveryType}</div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-[#D6A646]/35 bg-[#2A210D] p-5">
                <div className="text-[11px] uppercase tracking-[0.32em] text-[#F0C76B]">
                  Πολύ καθαρό συμπέρασμα
                </div>
                <p className="mt-3 text-sm leading-7 text-[#F6E4AF] md:text-base">
                  {result.cleanConclusion}
                </p>
              </div>

              <div className="mt-6 grid gap-3">
                <BoolRow label="Income-related" value={result.incomeRelated} />
                <BoolRow label="Learning-related" value={result.learningRelated} />
                <BoolRow label="Tool-discovery" value={result.toolDiscovery} />
                <BoolRow label="Business framework" value={result.businessFramework} />
              </div>
            </section>

            <section className="rounded-[30px] border border-[#244777] bg-[#08182F] p-6">
              <div className="mb-4 text-[11px] uppercase tracking-[0.35em] text-[#D6A646]">
                Matched themes
              </div>

              <div className="flex flex-wrap gap-2">
                {result.matchedThemes.map((theme) => (
                  <Chip key={theme} tone="blue">{theme}</Chip>
                ))}
              </div>

              <div className="mt-6 text-[11px] uppercase tracking-[0.35em] text-[#D6A646]">
                Matched seed ids
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.matchedSeedIds.map((id) => (
                  <Chip key={id}>{id}</Chip>
                ))}
              </div>

              <div className="mt-6 text-[11px] uppercase tracking-[0.35em] text-[#D6A646]">
                Raw input
              </div>
              <div className="mt-3 rounded-2xl border border-[#244777] bg-[#0B1D39] p-4 text-sm leading-7 text-[#D7E5FA]">
                {result.input}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
