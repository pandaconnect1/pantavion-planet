import ControlledWaterSegmentClient from "./controlled-water-segment-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water Network",
  description:
    "Protected Pantavion water network map with controlled private pipe segments, mobile location marker, and authorized access.",
};

export default function WaterLivePage() {
  return <>
    <nav aria-label="Μητρώο δικτύου" className="bg-[#050b16] px-4 py-3 text-white print:hidden">
      <a href="/professional/infrastructure/water/register" target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl border border-sky-400 px-4 py-3 font-bold text-sky-200">Μητρώο βανών SV · Αναζήτηση και εκτύπωση ↗</a>
    </nav>
    <ControlledWaterSegmentClient />
  </>;
}
