import Link from "next/link";

import WaterMapWorkspaceClient from "./water-map-workspace-client";

export const metadata = {
  title: "Pantavion Water Map Workspace",
  description:
    "Single active water source map on mobile, shared overlays and fullscreen professional workspace.",
};

export default function WaterMapWorkspacePage() {
  return (
    <main className="min-h-screen bg-[#06101f] p-2 text-white sm:p-4">
      <section className="mx-auto flex min-h-[calc(100dvh-16px)] w-full max-w-[1800px] flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <Link
            href="/professional/infrastructure/water/maps"
            className="text-xs font-black text-[#f2c766]"
          >
            ← Water Maps
          </Link>

          <div className="flex gap-2">
            <Link
              href="/professional/infrastructure/water/field"
              className="rounded-xl border border-emerald-400/40 px-3 py-2 text-xs font-black text-emerald-200"
            >
              Field
            </Link>
            <Link
              href="/professional/infrastructure/water/maps/compare"
              className="hidden rounded-xl border border-white/20 px-3 py-2 text-xs font-black md:inline-block"
            >
              Compare
            </Link>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <WaterMapWorkspaceClient />
        </div>
      </section>
    </main>
  );
}
