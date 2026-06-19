import Link from "next/link";
import PantavionHomeClient from "./pantavion-home-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function HomePage() {
  return (
    <>
      <PantavionHomeClient />

      <nav
        aria-label="Pantavion product visibility"
        className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-3xl border border-[#f6c85f]/35 bg-[#06111f]/92 px-4 py-3 text-sm shadow-2xl shadow-black/40 backdrop-blur"
      >
        <span className="hidden text-xs font-black uppercase tracking-[0.18em] text-[#f6c85f] sm:inline">
          Kernel-Governed Pantavion
        </span>

        <Link
          href="/product-status"
          className="rounded-full bg-[#f6c85f] px-4 py-2 font-black text-[#06111f] no-underline hover:bg-[#ffd978]"
        >
          Product Status
        </Link>

        <Link
          href="/universal-life"
          className="rounded-full border border-[#f6c85f]/45 px-4 py-2 font-black text-[#ffffe7] no-underline hover:bg-[#f6c85f]/10"
        >
          Universal Life
        </Link>
      </nav>
    </>
  );
}
