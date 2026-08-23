
// components/MainNav.js
import Link from "next/link";

export default function MainNav() {
  return (
    <header className="border-b border-slate-800/60">
      <div className="pv-container flex items-center justify-between py-4">
        {/* Λογότυπο / brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="pv-logo-circle" />
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-emerald-400">
            Here We Are One
          </span>
        </Link>

        {/* Δεξιά – μενού κειμένου */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-300">
          <Link href="/pulse" className="hover:text-emerald-400 transition-colors">
            Pulse
          </Link>
          <Link href="/people" className="hover:text-emerald-400 transition-colors">
            People
          </Link>
          <Link href="/chat" className="hover:text-emerald-400 transition-colors">
            Chat
          </Link>
          <Link href="/voice" className="hover:text-emerald-400 transition-colors">
            Voice
          </Link>
          <Link href="/elite" className="hover:text-emerald-400 transition-colors">
            Elite
          </Link>
          <Link href="/compass" className="hover:text-emerald-400 transition-colors">
            Compass
          </Link>
          <Link href="/mind" className="hover:text-emerald-400 transition-colors">
            Mind
          </Link>
          <Link href="/create" className="hover:text-emerald-400 transition-colors">
            Create
          </Link>
        </nav>
      </div>
    </header>
  );
}
