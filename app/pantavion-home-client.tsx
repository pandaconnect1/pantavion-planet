"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PANTAVION_MISSION = "Here We Are One. For All Humanity.";

const journeys = [
  ["People", "People, relationships & communities", "/people"],
  ["Chat", "Messages, voice & connection", "/messages"],
  ["Language", "Translate & understand", "/translate"],
  ["Discover", "Places, events & interests", "/social"],
  ["Work", "Jobs, business & services", "/build-services"],
  ["Safety", "SOS, alerts & trusted help", "/sos"],
];

export default function PantavionHomeClient() {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#071a35] text-white" data-pantavion-live-ui="true">
      <style jsx global>{`
        @keyframes pantaEntrance {
          0% { transform: perspective(900px) translateZ(-260px) scale(.55) rotateY(-18deg); opacity: 0; filter: blur(10px); }
          42% { opacity: 1; }
          68% { transform: perspective(900px) translateZ(150px) scale(1.14) rotateY(7deg); filter: blur(0); }
          84% { transform: perspective(900px) translateZ(45px) scale(1.035) rotateY(-2deg); }
          100% { transform: perspective(900px) translateZ(0) scale(1) rotateY(0); opacity: 1; }
        }
        @keyframes pantaHalo { 0%,100% { transform: scale(.94); opacity:.42 } 50% { transform:scale(1.08); opacity:.8 } }
        @keyframes pantaOrbit { to { transform: rotate(360deg); } }
        .panta-mark { animation: pantaEntrance 1.45s cubic-bezier(.16,1,.3,1) both; transform-style: preserve-3d; }
        .panta-halo { animation: pantaHalo 3.8s ease-in-out infinite; }
        .panta-orbit { animation: pantaOrbit 13s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .panta-mark,.panta-halo,.panta-orbit { animation:none!important; } }
      `}</style>

      <section className="relative mx-auto min-h-screen max-w-[1500px] px-4 pb-12 pt-4 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_56%_37%,rgba(35,126,255,.24),transparent_25%),radial-gradient(circle_at_68%_30%,rgba(166,74,255,.14),transparent_22%),linear-gradient(180deg,#071a35_0%,#06162e_60%,#041126_100%)]" />

        <nav className="relative z-30 flex items-center justify-between gap-3 border-b border-white/10 py-3">
          <Link href="/" className="text-sm font-black tracking-[0.16em] text-white no-underline sm:text-base">PANTAVION ONE</Link>
          <div className="flex items-center gap-1.5 text-xs font-bold sm:text-sm">
            <Link href="/translate" className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white no-underline">🌐 Language</Link>
            <Link href="/professional/infrastructure/water" className="hidden rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-cyan-100 no-underline sm:block">💧 Water</Link>
            <a href="#all-pantavion" className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white no-underline">☰ All Pantavion</a>
          </div>
        </nav>

        <section className="relative z-10 grid min-h-[650px] items-center gap-10 py-10 lg:grid-cols-[.92fr_1.08fr] lg:py-16">
          <div className="relative z-20 max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[.28em] text-cyan-300 sm:text-xs">ONE HUMAN WORLD · SHARED TRUSTED CONTEXT</p>
            <h1 className="mt-4 text-[2.75rem] font-black leading-[.98] tracking-[-.045em] sm:text-6xl lg:text-7xl">{PANTAVION_MISSION}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-100/80 sm:text-lg">Connect. Communicate. Discover. Learn. Work. Get help. One intelligent human ecosystem, designed to reveal what you need when you need it.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/auth/signup" className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-3 text-sm font-black text-white no-underline shadow-[0_12px_38px_rgba(61,102,255,.28)]">Join Pantavion One</Link>
              <Link href="/social" className="rounded-xl border border-cyan-300/35 bg-white/5 px-6 py-3 text-sm font-black text-white no-underline backdrop-blur">Explore</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-blue-100/70"><span>◉ One Identity</span><span>◇ Trust & Safety</span><span>◎ Human Centric</span><span>✦ AI-assisted</span></div>
          </div>

          <div className="relative z-10 flex min-h-[390px] items-center justify-center [perspective:900px] sm:min-h-[500px]">
            <div className="panta-halo absolute h-[340px] w-[340px] rounded-full bg-blue-500/20 blur-[70px] sm:h-[470px] sm:w-[470px]" />
            <div className="panta-orbit absolute h-[300px] w-[300px] rounded-full border border-cyan-300/25 sm:h-[430px] sm:w-[430px]"><span className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_18px_#67e8f9]" /></div>
            <div className={`panta-mark relative flex h-[250px] w-[250px] items-center justify-center sm:h-[370px] sm:w-[370px] ${entered ? "" : "opacity-0"}`} aria-label="Pantavion One">
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-500 p-[3px] shadow-[0_0_70px_rgba(76,132,255,.42)]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#071a35] shadow-[inset_0_0_55px_rgba(71,114,255,.35)]">
                  <span className="translate-y-[-4%] bg-gradient-to-br from-cyan-200 via-blue-400 to-violet-400 bg-clip-text text-[10rem] font-black leading-none text-transparent drop-shadow-[0_20px_24px_rgba(0,0,0,.35)] sm:text-[15rem]">P</span>
                </div>
              </div>
              <div className="absolute -bottom-10 h-16 w-[72%] rounded-[50%] bg-cyan-300/20 blur-2xl" />
            </div>
          </div>
        </section>

        <section id="all-pantavion" className="relative z-20 rounded-[1.6rem] border border-white/10 bg-white/[.045] p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-cyan-300">ALL PANTAVION</p><h2 className="mt-1 text-2xl font-black">Everything you need. One clear place.</h2></div><div className="rounded-full border border-white/10 bg-black/10 px-4 py-2 text-xs text-blue-100/70">What are you looking for? ⌕</div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{journeys.map(([title, subtitle, href]) => <Link key={title} href={href} className="rounded-2xl border border-white/10 bg-[#0a2243]/75 p-4 text-white no-underline transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-[#0c2a52]"><h3 className="font-black">{title}</h3><p className="mt-1 text-xs leading-5 text-blue-100/65">{subtitle}</p></Link>)}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link href="/professional/infrastructure/water" className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[.06] p-4 text-white no-underline"><p className="text-xs font-black text-cyan-300">💧 PROFESSIONAL & INFRASTRUCTURE</p><h3 className="mt-1 font-black">Water Network</h3><p className="mt-1 text-xs text-blue-100/65">Protected infrastructure and mapping tools for approved users.</p></Link>
            <Link href="/translate" className="rounded-2xl border border-violet-300/20 bg-violet-300/[.06] p-4 text-white no-underline"><p className="text-xs font-black text-violet-200">🌐 UNIVERSAL LANGUAGE</p><h3 className="mt-1 font-black">Language & Translation</h3><p className="mt-1 text-xs text-blue-100/65">Automatic or user-selected language experiences.</p></Link>
          </div>
        </section>
      </section>
    </main>
  );
}
