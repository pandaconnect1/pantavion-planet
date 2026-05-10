import type { Metadata } from "next";

import { getWaterProductionReadinessSummary } from "@/core/infrastructure/water/water-production-readiness-summary";
import { waterAddressCandidateDisambiguationReadiness } from "@/core/infrastructure/water/water-address-candidate-disambiguation";

export const metadata: Metadata = {
  title: "Pantavion Water Module Readiness",
  description:
    "Read-only readiness summary for the protected Pantavion Water Module serving architecture.",
};

const statusCards = [
  {
    title: "Full master network",
    status: "Protected",
    text: "The complete water master remains protected. It is not loaded in the browser and is not exposed as public geodata.",
  },
  {
    title: "Browser loading",
    status: "Blocked",
    text: "The browser must never receive the full raw network. Future rendering must request controlled viewport segments only.",
  },
  {
    title: "Target viewport",
    status: "Contract ready",
    text: "Network requests must come from current location, address search, manual pan/zoom, or founder/admin selected area.",
  },
  {
    title: "Repeated street names",
    status: "Disambiguation required",
    text: "When the same street/address exists in multiple zones, the system must return candidates and require selectedCandidateId before bbox serving.",
  },
];

const remainingItems = [
  "Real spatial index built from the complete protected master",
  "Server-side bbox query provider",
  "Viewport-scoped access filtering",
  "Durable authorized-person store",
  "Durable append-only encrypted audit sink",
  "Approved address candidate/geocoder provider",
  "Founder/admin production approval",
];

export default function WaterReadinessPresentationPage() {
  const summary = getWaterProductionReadinessSummary();

  return (
    <main className="min-h-screen bg-[#07101f] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10 md:px-10 md:py-14">
        <header className="rounded-[2rem] border border-[#d8b35a]/30 bg-[#0c1830] p-8 shadow-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#d8b35a]">
            Pantavion Professional Infrastructure
          </p>

          <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Water Module Readiness
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
                Safe read-only presentation page for the protected water network
                architecture. This page returns status only. It does not render
                network geometry, raw master data, or complete water infrastructure
                payloads.
              </p>
            </div>

            <div className="rounded-3xl border border-red-400/30 bg-red-950/30 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-200">
                Current status
              </p>
              <p className="mt-3 text-3xl font-bold text-red-100">
                Production blocked
              </p>
              <p className="mt-3 text-sm leading-6 text-red-100/80">
                Blocked by design until spatial index, bbox provider, access
                filtering, durable audit, authorized-person store, and founder/admin
                approval are complete.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {statusCards.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d8b35a]">
                {card.status}
              </p>
              <h2 className="mt-3 text-xl font-bold">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{card.text}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">
              Message for presentation
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-200">
              The Pantavion Water Module does not load the complete water network
              in the browser. The full master network remains protected. The map
              will request only a controlled segment based on current location,
              address search, manual pan/zoom, or founder/admin selected area.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-200">
              For addresses or street names that exist multiple times in the same
              city or municipality, the system must return candidates and require
              explicit selection of the correct area, sector, quarter, or zone before
              deriving a target bbox.
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">
              Production readiness
            </h2>

            <dl className="mt-5 grid gap-4">
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-300">Overall ready</dt>
                <dd className="font-bold text-red-200">
                  {String(summary.overallReady)}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-300">Production activation allowed</dt>
                <dd className="font-bold text-red-200">
                  {String(summary.productionActivationAllowed)}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-300">Data returned by this page</dt>
                <dd className="font-bold text-emerald-200">
                  {String(summary.dataReturned)}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-300">May return raw master</dt>
                <dd className="font-bold text-emerald-200">
                  {String(summary.mayReturnRawMaster)}
                </dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">
              Address disambiguation
            </h2>

            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-200">
              <p>
                Same street names or addresses can exist multiple times in the same
                city, municipality, quarter, sector, or zone.
              </p>
              <p>
                The system must never auto-pick an ambiguous address. Candidate
                selection is required before deriving the target viewport.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-[#d8b35a]/20 bg-[#d8b35a]/10 p-4 text-sm leading-7 text-[#f6e4aa]">
              selectedCandidateId required before bbox:{" "}
              <strong>
                {String(
                  waterAddressCandidateDisambiguationReadiness.selectedCandidateIdRequiredBeforeBbox,
                )}
              </strong>
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">
              Required before production
            </h2>

            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {remainingItems.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-950/20 p-7">
          <h2 className="text-2xl font-bold text-emerald-100">
            Safe presentation guarantee
          </h2>
          <div className="mt-5 grid gap-4 text-sm leading-7 text-emerald-50/90 md:grid-cols-3">
            <p>No raw master network is returned.</p>
            <p>No complete network payload is returned.</p>
            <p>No renderer or map layer is activated here.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
