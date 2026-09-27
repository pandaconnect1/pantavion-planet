import Link from "next/link";

import WaterMapBAlignmentAdminClient from "./water-map-b-alignment-admin-client";

export const metadata = {
  title: "Pantavion Water — Map B Alignment Admin",
  description:
    "Governed control-point georeferencing and overlay approval for canonical and legacy Map B.",
};

export default function WaterMapBAlignmentAdminPage() {
  return (
    <main className="min-h-screen bg-[#06101f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/professional/infrastructure/water/maps/compare"
            className="text-sm font-black text-[#f2c766]"
          >
            ← Map B Compare
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/professional/infrastructure/water/admin/changes"
              className="rounded-xl border border-emerald-400/40 px-3 py-2 text-xs font-black text-emerald-200"
            >
              Field Changes
            </Link>
            <Link
              href="/professional/infrastructure/water/maps"
              className="rounded-xl border border-white/20 px-3 py-2 text-xs font-black"
            >
              3 Source Maps
            </Link>
          </div>
        </div>

        <WaterMapBAlignmentAdminClient />
      </section>
    </main>
  );
}
