import PantavionHomeClient from "./pantavion-home-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function HomePage() {
  return (
    <>
      <div className="fixed left-3 top-3 z-[100] rounded-full border border-emerald-300/40 bg-[#071a35]/90 px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-emerald-200 shadow-lg backdrop-blur sm:left-4 sm:top-4 sm:text-xs">
        CANONICAL LIVE BUILD · 2026-08-22
      </div>
      <PantavionHomeClient />
    </>
  );
}
