import Link from "next/link";

import WaterMapBAuthenticClient from "../components/water-map-b-authentic-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Map B — DWG GIS",
  description:
    "Protected Map B workspace for the owner-supplied DWG, with read-only CAD/GIS viewing and controlled upload verification.",
};

export default function WaterBMapPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-[#d8b45f]/25 bg-[#06101f]/95 px-3 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#d8b45f]">
              Pantavion Water
            </p>
            <h1 className="text-lg font-black leading-tight">
              Map B — DWG GIS
            </h1>
          </div>

          <Link
            href="/professional/infrastructure/water"
            className="rounded-2xl border border-[#d8b45f]/35 bg-[#d8b45f]/10 px-4 py-2 text-xs font-black text-[#f3db9d]"
          >
            Water Home
          </Link>
        </div>
      </header>

      <WaterMapBAuthenticClient />
    </main>
  );
}
