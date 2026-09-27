import Link from "next/link";

import WaterMapBCompareClient from "./water-map-b-compare-client";

export const metadata = {
  title: "Pantavion Water — Compare Map B / Map C",
  description:
    "Compare protected derived manifests for authentic Map B and Map C without framing or exposing raw DWG.",
};

export default function WaterMapComparePage() {
  return (
    <main className="min-h-screen bg-[#06101f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/professional/infrastructure/water/maps"
            className="text-sm font-black text-[#f2c766]"
          >
            ← Water Maps
          </Link>

          <Link
            href="/professional/infrastructure/water/admin/alignment"
            className="rounded-xl border border-cyan-400/40 px-3 py-2 text-xs font-black text-cyan-200"
          >
            Alignment Admin
          </Link>
        </div>

        <WaterMapBCompareClient />
      </section>
    </main>
  );
}
