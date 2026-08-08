import Link from "next/link";

export default function TranslateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-white/10 bg-[#0b2348] px-3 py-2 text-sm font-black text-white shadow-lg">
        <Link
          href="/translate"
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white no-underline"
        >
          Μετάφραση
        </Link>
        <Link
          href="/translate/interpreter"
          className="rounded-full border border-[#f6c85f]/35 bg-[#f6c85f]/15 px-4 py-2 text-[#ffe29a] no-underline"
        >
          Αμφίδρομος Διερμηνέας ↔
        </Link>
      </nav>
      {children}
    </>
  );
}
