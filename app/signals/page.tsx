"use client";

import { useEffect, useMemo, useState } from "react";

type SignalItem = {
  id: string;
  title: string;
  domain: string;
  category: string;
  summary: string;
  userNeeds: string[];
  monetizationPaths: string[];
  moduleTargets: string[];
  nativeCandidates: string[];
  connectorCandidates: string[];
  geographyScope: string;
  languageScope: string;
  sourcePattern: string;
  priority: string;
};

type SignalResponse = {
  ok: boolean;
  total: number;
  items: SignalItem[];
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#284A79] bg-[#081A33] px-3 py-1 text-xs text-[#D7E5FA]">
      {children}
    </span>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-[#244777] bg-[#08182F] p-4">
      <div className="mb-3 text-[11px] uppercase tracking-[0.28em] text-[#D6A646]">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Chip key={item}>{item}</Chip>
        ))}
      </div>
    </div>
  );
}

export default function SignalsPage() {
  const [items, setItems] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDomain, setActiveDomain] = useState("all");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/signals", { cache: "no-store" });
      const data: SignalResponse = await res.json();
      if (data.ok) {
        setItems(data.items);
      }
      setLoading(false);
    }
    load();
  }, []);

  const domains = useMemo(() => {
    const base = ["all"];
    const unique = [...new Set(items.map((item) => item.domain))];
    return [...base, ...unique];
  }, [items]);

  const filtered = useMemo(() => {
    if (activeDomain === "all") return items;
    return items.filter((item) => item.domain === activeDomain);
  }, [items, activeDomain]);

  return (
    <main className="min-h-screen bg-[#041633] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.45em] text-[#D6A646]">
              Pantavion Signal Map
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Structured market signals for the kernel
            </h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-[#D3E0F6] md:text-base">
              These are not random screenshots. They become structured demand signals,
              monetization paths, module targets, native feature candidates and connector opportunities.
            </p>
          </div>

          <a
            href="/kernel"
            className="inline-flex rounded-2xl border border-[#D6A646]/50 bg-[#0B234F] px-5 py-3 text-sm font-medium text-[#F1C86A] transition hover:bg-[#12316A]"
          >
            Back to Kernel
          </a>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {domains.map((domain) => (
            <button
              key={domain}
              onClick={() => setActiveDomain(domain)}
              className={`rounded-2xl border px-4 py-2 text-sm transition ${
                activeDomain === domain
                  ? "border-[#F0C76B] bg-[linear-gradient(180deg,#E5BD68_0%,#BE8C2F_100%)] text-[#07152D]"
                  : "border-[#3967BB] bg-[#0D327C] text-[#E2EBFB] hover:bg-[#124094]"
              }`}
            >
              {domain}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[#244777] bg-[#08182F] p-8 text-[#D7E5FA]">
            Loading signal map...
          </div>
        ) : (
          <div className="grid gap-6">
            {filtered.map((item) => (
              <section
                key={item.id}
                className="rounded-[30px] border border-[#224777] bg-[linear-gradient(180deg,rgba(8,24,53,0.96)_0%,rgba(8,30,68,0.93)_100%)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
              >
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Chip>{item.domain}</Chip>
                      <Chip>{item.category}</Chip>
                      <Chip>{item.priority}</Chip>
                      <Chip>{item.geographyScope}</Chip>
                      <Chip>{item.languageScope}</Chip>
                    </div>
                    <h2 className="text-2xl font-semibold text-white md:text-3xl">
                      {item.title}
                    </h2>
                    <p className="mt-3 max-w-4xl text-sm leading-7 text-[#D7E5FA] md:text-base">
                      {item.summary}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#244777] bg-[#08182F] px-4 py-3 text-sm text-[#D7E5FA]">
                    Source pattern: {item.sourcePattern}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  <Section title="User needs" items={item.userNeeds} />
                  <Section title="Monetization paths" items={item.monetizationPaths} />
                  <Section title="Module targets" items={item.moduleTargets} />
                  <Section title="Native candidates" items={item.nativeCandidates} />
                  <Section title="Connector candidates" items={item.connectorCandidates} />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
