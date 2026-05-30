import Link from "next/link";

import { createPantavionUnifiedCommunicationContract } from "@/core/communication/pantavion-unified-communication-contract";

export const metadata = {
  title: "Unified Inbox | Pantavion",
  description:
    "Pantavion unified communication foundation for contacts, messages, social, email, SMS, translation and consent-based communication.",
};

const connectionCards = [
  {
    title: "Pantavion Messages",
    description: "Native Pantavion direct and group messaging layer.",
    status: "foundation",
  },
  {
    title: "Contacts Import",
    description: "Consent-based phone, email, CSV and device contact connection.",
    status: "provider-required",
  },
  {
    title: "Email Bridge",
    description: "Future authorized email connection with explicit user consent.",
    status: "provider-required",
  },
  {
    title: "SMS Bridge",
    description: "Future device/provider SMS bridge without unauthorized message reading.",
    status: "provider-required",
  },
  {
    title: "Social Universe",
    description: "Pantavion-owned social feed, media, friends and public signal surfaces.",
    status: "foundation",
  },
  {
    title: "Translation Layer",
    description: "Real-time multilingual communication support across text, voice and media.",
    status: "foundation",
  },
];

const safetyRules = [
  "No contact import without explicit consent.",
  "No private message reading without explicit consent.",
  "No copied competitor brands, logos, layouts or claims.",
  "No adult/dating exposure for minors.",
  "No dead buttons: inactive capabilities must show provider-required or disabled state.",
  "Core private inbox remains separate from professional/classified ad surfaces.",
];

function statusLabel(status: string) {
  if (status === "foundation") return "Foundation ready";
  if (status === "provider-required") return "Provider required";
  return "Controlled";
}

export default function UnifiedInboxPage() {
  const contract = createPantavionUnifiedCommunicationContract();

  return (
    <main className="min-h-screen bg-[#050b16] px-5 py-8 text-white sm:px-8 lg:px-16">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-yellow-400/25 bg-[#071120] p-6 shadow-2xl sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.45em] text-yellow-300">
            Pantavion Communication Core
          </p>

          <div className="mt-5 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
                Unified Inbox
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
                One controlled Pantavion screen for authorized communication signals:
                contacts, messages, social, email, SMS, translation and PantaAI assistance.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Contract marker
              </p>
              <p className="mt-3 break-words text-sm font-bold text-yellow-200">
                {contract.marker}
              </p>
              <p className="mt-4 text-xs text-slate-400">
                Status: {contract.status}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-yellow-400 px-5 py-3 text-sm font-black text-black shadow-lg shadow-yellow-500/20"
            >
              Back to Pantavion
            </Link>
            <Link
              href="/translate"
              className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white hover:border-yellow-300"
            >
              Translation
            </Link>
            <Link
              href="/sos"
              className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white hover:border-yellow-300"
            >
              SOS Center
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {connectionCards.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-white/10 bg-[#0b1220] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-black">{card.title}</h2>
                <span className="rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-yellow-200">
                  {statusLabel(card.status)}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {card.description}
              </p>

              <button
                type="button"
                disabled
                className="mt-6 cursor-not-allowed rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
              >
                Controlled rollout
              </button>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#0b1220] p-6 sm:p-8">
          <h2 className="text-2xl font-black">Safety and consent gates</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {safetyRules.map((rule) => (
              <div
                key={rule}
                className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-slate-200"
              >
                {rule}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6 sm:p-8">
          <h2 className="text-2xl font-black text-yellow-100">
            First build targets
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {contract.firstBuildTargets.map((target) => (
              <span
                key={target}
                className="rounded-full border border-yellow-300/25 bg-black/25 px-3 py-2 text-xs font-semibold text-yellow-100"
              >
                {target}
              </span>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
