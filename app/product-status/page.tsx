import Link from "next/link";
import type { Metadata } from "next";
import {
  PANTAVION_CAPABILITY_DOMAIN_ORDER,
  PANTAVION_UNIVERSAL_LIFE_CAPABILITIES,
  type PantavionCapabilityStatus,
} from "@/core/product/pantavion-universal-life-capabilities";

export const metadata: Metadata = {
  title: "Pantavion Product Status",
  description:
    "Public Pantavion capability status: live, beta, foundation, planned and provider-gated modules.",
  alternates: {
    canonical: "/product-status",
  },
};

const PANTAVION_VISIBLE_ECOSYSTEM_MODULES = [
  { title: "Messages / Chat", status: "planned", note: "Real messaging, inbox, privacy, moderation, identity and provider/backend work required." },
  { title: "Stories", status: "planned", note: "Media/story system requires storage, safety review, privacy controls and moderation." },
  { title: "Music", status: "planned", note: "Requires licensing, media providers, creator rights and playback infrastructure." },
  { title: "Dates / Connections", status: "legal_provider_required", note: "Requires age gates, consent, safety, matching rules and legal review." },
  { title: "Health", status: "legal_provider_required", note: "Safety-limited care support only; no diagnosis claims; provider and legal controls required." },
  { title: "Calendar / Reminders", status: "planned", note: "Requires user accounts, reminders, notifications, consent and recurring task backend." },
  { title: "Culture", status: "planned", note: "Global culture layer requires multilingual content, moderation and regional sensitivity." },
  { title: "Environment", status: "planned", note: "Requires verified environmental sources, maps, alerts and reliability tiers." },
  { title: "Education", status: "planned", note: "Requires academy structure, progress state, multilingual lessons and source quality controls." },
  { title: "Sports", status: "planned", note: "Requires feeds/providers, schedules, localization and rights-safe presentation." },
  { title: "News", status: "legal_provider_required", note: "Requires source reliability, misinformation controls and regional/legal policy." },
  { title: "Work / Business", status: "beta", note: "Existing work route exists, but marketplace, CRM, payments and provider layers remain staged." },
  { title: "Family and Friends", status: "planned", note: "Requires social graph, trusted circles, privacy and consent rules." },
  { title: "Economy / Banks", status: "legal_provider_required", note: "Financial information must remain risk-controlled; banking/payment providers required." },
  { title: "Shipping / Marine", status: "planned", note: "Requires maritime data providers, maps, safety disclaimers and professional controls." },
  { title: "Flights / Travel", status: "planned", note: "Requires travel providers, flight data, identity, notifications and regional rules." },
  { title: "Tourism", status: "planned", note: "Requires places, guides, localization, safety notes and marketplace/provider mapping." },
  { title: "Politics", status: "legal_provider_required", note: "Requires civic integrity, source quality, regional law and misinformation controls." },
  { title: "Faith and Religions", status: "planned", note: "Requires respectful global content, moderation and community safety rules." },
  { title: "VR / AR", status: "planned", note: "Requires device/provider capability, rendering pipeline and safety boundaries." },
  { title: "Multimedia", status: "planned", note: "Requires storage, upload, transcoding, copyright, moderation and creator controls." },
  { title: "Contacts and Invite System", status: "beta", note: "SOS contacts exist; broader invite/import needs consent, privacy and provider-safe flows." },
  { title: "Marketplace", status: "planned", note: "Requires categories, moderation, payments, fraud controls and lawful listing policy." },
  { title: "Academy", status: "planned", note: "Requires learning paths, progress, multilingual content and source reliability." },
  { title: "Research", status: "planned", note: "Requires source atlas, citations, licensing, retrieval and reliability tiers." },
  { title: "Communities", status: "planned", note: "Requires groups, roles, moderation, safety and region/community governance." },
  { title: "Support and Care", status: "planned", note: "Requires trusted support flows, escalation, vulnerable-user protections and audit." },
  { title: "Professional Infrastructure", status: "foundation", note: "Professional protected infrastructure area exists; access, vaults and audit continue." },
  { title: "Water Infrastructure", status: "beta", note: "Water Control Center and A Map exist; B/C/D map layers remain protected staged work." },
  { title: "Pantavion Elite", status: "planned", note: "Requires subscription, identity, privacy, premium service boundaries and billing controls." },
] as const;

const PANTAVION_LANGUAGE_LAYER = [
  {
    title: "Visible language selector",
    status: "planned",
    note: "Global language selection belongs in the Pantavion header/corner, not hidden inside one page.",
  },
  {
    title: "UI languages",
    status: "foundation",
    note: "Pantavion must expose supported interface languages clearly and expand through controlled releases.",
  },
  {
    title: "Speech and subtitle translation",
    status: "legal_provider_required",
    note: "Real-time speech, subtitles and rare-language support require providers, consent, safety and quality checks.",
  },
  {
    title: "Thousands of natural languages in scope",
    status: "planned",
    note: "Pantavion may target all natural human languages, but must not claim every language is live until provider and quality gates pass.",
  },
] as const;
const statusOrder: PantavionCapabilityStatus[] = [
  "live",
  "beta",
  "foundation",
  "planned",
  "legal_provider_required",
];

const statusMeta: Record<
  PantavionCapabilityStatus,
  { label: string; publicMeaning: string }
> = {
  live: {
    label: "Live",
    publicMeaning: "Usable now with real route, state or backend behavior.",
  },
  beta: {
    label: "Beta",
    publicMeaning: "Usable with limits, active safeguards or staged rollout.",
  },
  foundation: {
    label: "Foundation",
    publicMeaning: "Kernel/product foundation exists; full public function is not complete yet.",
  },
  planned: {
    label: "Planned",
    publicMeaning: "Part of Pantavion scope, waiting for implementation work order.",
  },
  legal_provider_required: {
    label: "Legal / Provider Required",
    publicMeaning: "Requires provider, legal, payment, safety or compliance approval before live use.",
  },
};

const capabilities = PANTAVION_UNIVERSAL_LIFE_CAPABILITIES;

const statusRows = statusOrder.map((status) => ({
  status,
  ...statusMeta[status],
  count: capabilities.filter((capability) => capability.status === status).length,
}));

const usableNow = capabilities.filter(
  (capability) =>
    (capability.status === "live" || capability.status === "beta") &&
    capability.route,
);

const domainGroups = PANTAVION_CAPABILITY_DOMAIN_ORDER.map((domain) => ({
  domain,
  capabilities: capabilities.filter((capability) => capability.domain === domain),
})).filter((group) => group.capabilities.length > 0);

function statusClass(status: PantavionCapabilityStatus) {
  if (status === "live") return "border-emerald-400/40 bg-emerald-400/10 text-emerald-100";
  if (status === "beta") return "border-sky-400/40 bg-sky-400/10 text-sky-100";
  if (status === "foundation") return "border-amber-400/40 bg-amber-400/10 text-amber-100";
  if (status === "planned") return "border-slate-500/40 bg-slate-500/10 text-slate-200";
  return "border-orange-400/40 bg-orange-400/10 text-orange-100";
}

export default function ProductStatusPage() {
  return (
    <main className="min-h-screen bg-[#06111f] text-slate-50">
      <section className="border-b border-amber-400/20 bg-[radial-gradient(circle_at_top,rgba(245,190,82,0.16),transparent_42%),linear-gradient(180deg,#071a2d,#06111f)]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
          <p className="mb-4 inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-amber-200">
            Pantavion Realness Status
          </p>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
            What is live, what is building, and what needs approval
          </h1>

          <p className="mt-5 max-w-4xl text-base leading-8 text-slate-300 sm:text-lg">
            Pantavion does not present unfinished functions as complete. This page
            is generated from the canonical capability registry so users and the
            founder can see which sections are usable, which are foundations, and
            which require provider, legal or safety approval before becoming live.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/universal-life"
              className="rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300"
            >
              Universal Life Hub
            </Link>
            <Link
              href="/"
              className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 hover:border-amber-300 hover:text-amber-200"
            >
              Back to Pantavion
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="rounded-[2rem] border border-amber-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-black/30">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            Pantavion Planet Registry
          </p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Pantavion Ecosystem Modules
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
            Όλες οι βασικές ενότητες εμφανίζονται εδώ ως Kernel-governed product modules.
            Όσα δεν έχουν ακόμη πραγματικό route, backend, provider ή legal approval δεν εμφανίζονται ως τελειωμένα.
            Περνούν πρώτα από work order, autonomous draft gate και Founder approval όπου απαιτείται.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PANTAVION_VISIBLE_ECOSYSTEM_MODULES.map((module) => (
              <article
                key={module.title}
                className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-black text-white">{module.title}</h3>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] ${statusClass(module.status)}`}>
                    {statusMeta[module.status].label}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{module.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <div className="rounded-[2rem] border border-amber-400/25 bg-slate-950/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
                Universal Language Layer
              </p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Languages, translation, voice and subtitles
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
                Pantavion is designed for global language access. A visible language selector, voice translation,
                subtitles, RTL support and rare-language coverage must pass provider, quality, consent, safety and legal gates
                before they are shown as live.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm font-bold text-amber-100">
              Header/corner selector: planned as global UI layer
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {PANTAVION_LANGUAGE_LAYER.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-black text-white">{item.title}</h3>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] ${statusClass(item.status)}`}>
                    {statusMeta[item.status].label}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statusRows.map((row) => (
            <div
              key={row.status}
              className={`rounded-3xl border p-5 ${statusClass(row.status)}`}
            >
              <p className="text-3xl font-black">{row.count}</p>
              <h2 className="mt-2 text-sm font-bold uppercase tracking-[0.16em]">
                {row.label}
              </h2>
              <p className="mt-3 text-sm leading-6 opacity-90">{row.publicMeaning}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5 sm:p-7">
          <h2 className="text-2xl font-black text-white">Usable now</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
            Only capabilities with a real route and live/beta status are shown here
            as usable. Planned and provider-gated areas remain visible in the
            registry but are not presented as complete.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {usableNow.map((capability) => (
              <Link
                key={capability.id}
                href={capability.route || "/product-status"}
                className="rounded-2xl border border-emerald-400/20 bg-slate-950/60 p-4 hover:border-emerald-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">{capability.title}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                      {capability.domain}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(capability.status)}`}>
                    {statusMeta[capability.status].label}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {capability.principle}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="space-y-8">
          {domainGroups.map((group) => (
            <section key={group.domain} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5 sm:p-7">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
                    Domain
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-white">{group.domain}</h2>
                </div>
                <p className="text-sm text-slate-400">
                  {group.capabilities.length} capabilities
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {group.capabilities.map((capability) => (
                  <article
                    key={capability.id}
                    className="rounded-2xl border border-slate-800 bg-[#071525] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{capability.title}</h3>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          Source: {capability.source}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(capability.status)}`}>
                        {statusMeta[capability.status].label}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {capability.principle}
                    </p>

                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">
                        Next implementation step
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {capability.realImplementationRequired}
                      </p>
                    </div>

                    {capability.route ? (
                      <Link
                        href={capability.route}
                        className="mt-4 inline-flex rounded-full border border-amber-400/40 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-400/10"
                      >
                        Open real route
                      </Link>
                    ) : (
                      <p className="mt-4 text-sm font-semibold text-slate-500">
                        Not live yet. Work order and approval required before public use.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}



