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
                        Required real implementation
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
                        No public route yet. Work order required before live use.
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
