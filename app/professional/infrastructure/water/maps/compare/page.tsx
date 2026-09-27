import Link from "next/link";

import WaterMapBCompareClient from "./water-map-b-compare-client";

export const metadata = {
  title: "Pantavion Water — Compare Map B Versions",
  description:
    "Compare canonical and legacy Map B DWG-derived views without mutating either source.",
};

export default function WaterMapBComparePage() {
  return (
    <main className="min-h-screen bg-[#06101f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-[1800px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/professional/infrastructure/water/maps"
            className="text-sm font-black text-[#f2c766]"
          >
            ← 3 Source Maps
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
