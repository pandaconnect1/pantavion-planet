"use client";

import { useRouter } from "next/navigation";

const links = [
  {
    href: "/professional/infrastructure/water",
    label: "Water Home",
    description: "κέντρο",
  },
  {
    href: "/professional/infrastructure/water/access",
    label: "Users / Access",
    description: "αιτήσεις / approvals",
  },
  {
    href: "/professional/infrastructure/water/maps",
    label: "Maps A / B / C",
    description: "ξεχωριστοί χάρτες",
  },
  {
    href: "/professional/infrastructure/water/live",
    label: "Map A",
    description: "υπάρχων live",
  },
  {
    href: "/professional/infrastructure/water/b",
    label: "Map B",
    description: "DWG + GIS",
  },
];

export default function WaterMapNavigation({
  title = "Pantavion Water",
}: {
  title?: string;
}) {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-40 border-b border-[#d8b45f]/25 bg-[#06101f]/95 px-3 py-3 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#d8b45f]">
            Pantavion Protected Water
          </p>
          <h1 className="text-lg font-black leading-tight">{title}</h1>
        </div>

        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-black text-white"
          >
            Πίσω
          </button>

          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-[#d8b45f]/35 bg-[#d8b45f]/10 px-3 py-2 text-xs font-black text-[#f3db9d]"
            >
              <span className="block">{link.label}</span>
              <span className="block text-[10px] font-semibold text-slate-300">
                {link.description}
              </span>
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
