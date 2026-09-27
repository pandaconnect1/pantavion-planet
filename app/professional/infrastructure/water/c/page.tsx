import Link from "next/link";

import WaterMapBAuthenticClient from "../components/water-map-b-authentic-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Map C — Authentic DWG",
  description:
    "Protected authentic Map C from the verified GEORGE DWG source.",
};

export default function WaterCMapPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-cyan-300/25 bg-[#06101f]/95 px-3 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
              Pantavion Water
            </p>
            <h1 className="text-lg font-black leading-tight">
              Map C — Authentic DWG
            </h1>
          </div>

          <Link
            href="/professional/infrastructure/water/maps"
            className="rounded-2xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-100"
          >
            Water Maps
          </Link>
        </div>
      </header>

      <WaterMapBAuthenticClient
        initialSourceKey="legacy-george-85m"
        allowSourceSwitch={false}
        mapLabel="Map C"
      />
    </main>
  );
}
