import Link from "next/link";
import type { ReactNode } from "react";

export default function EvolutionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-950/95 px-6 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 text-sm">
          <span className="mr-2 font-semibold text-cyan-300">Pantavion Evolution</span>
          <Link href="/evolution" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200">
            Console
          </Link>
          <Link href="/evolution/radar" className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-cyan-200">
            Technology Radar
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
