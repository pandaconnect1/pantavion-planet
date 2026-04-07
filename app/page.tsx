export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03060D] text-white">
      <section className="relative isolate min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,73,160,0.35),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(201,163,95,0.10),_transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 md:px-10 lg:px-12">
          <header className="mb-10 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.45em] text-[#C9A35F]">
                Pantavion Planet
              </div>
              <div className="mt-2 text-sm text-[#8EA3C7]">
                Global Human Network · Knowledge Infrastructure · Intelligence Layer
              </div>
            </div>

            <div className="rounded-full border border-[#C9A35F]/30 bg-[#0B1730]/80 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[#E0BC74]">
              Foundation v0.1
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative">
              <div className="relative mx-auto flex h-[520px] w-full max-w-[640px] items-center justify-center">
                <div className="absolute h-[440px] w-[440px] rotate-45 rounded-[42px] border border-[#173764] bg-[linear-gradient(180deg,#08101F_0%,#091A31_34%,#0A2A59_100%)] shadow-[0_0_120px_rgba(5,24,56,0.9)]" />

                <div className="absolute h-[356px] w-[356px] rotate-45 rounded-[34px] border-[10px] border-[#C9A35F] bg-[linear-gradient(180deg,#07101E_0%,#0A2550_100%)] shadow-[0_0_28px_rgba(201,163,95,0.30),0_0_70px_rgba(21,74,173,0.28)]" />

                <div className="absolute h-[270px] w-[270px] rotate-45 rounded-[26px] border border-[#E0BC74]/65 bg-[linear-gradient(180deg,#0A1730_0%,#0B2D60_100%)] shadow-[inset_0_0_30px_rgba(255,255,255,0.04)]" />

                <div className="absolute h-[510px] w-[510px] rotate-45 rounded-[48px] border border-[#C9A35F]/12" />
                <div className="absolute left-[8%] top-[19%] h-24 w-24 rounded-full bg-[#E0BC74]/18 blur-2xl" />
                <div className="absolute bottom-[17%] right-[11%] h-28 w-28 rounded-full bg-[#2E7CF6]/18 blur-2xl" />

                <div className="relative z-10 max-w-[280px] text-center">
                  <div className="text-[13px] uppercase tracking-[0.45em] text-[#8EA3C7]">
                    Pantavion One
                  </div>
                  <h1 className="mt-5 text-4xl font-semibold tracking-[0.14em] text-[#E6C27B] md:text-5xl">
                    PANTAVION
                  </h1>
                  <div className="mx-auto mt-5 h-px w-28 bg-gradient-to-r from-transparent via-[#E0BC74] to-transparent" />
                  <p className="mt-6 text-sm leading-7 text-[#D7E1F2]">
                    Here We Are One. For All Humanity.
                  </p>
                  <p className="mt-4 text-xs leading-6 text-[#8EA3C7]">
                    Human-first platform with memory, voice translation, knowledge,
                    workspaces, trust and global continuity.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-[#1B3354] bg-[linear-gradient(180deg,rgba(8,18,35,0.94)_0%,rgba(7,23,48,0.92)_100%)] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                <div className="text-[11px] uppercase tracking-[0.38em] text-[#C9A35F]">
                  Pantavion Direction
                </div>
                <h2 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
                  A premium black, blue and gold foundation.
                </h2>
                <p className="mt-5 text-sm leading-7 text-[#C3CFE0]">
                  This is the first clean visual shell for Pantavion Planet. From now on,
                  we build directly inside the repo with stable files, not loose drafts.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button className="rounded-2xl border border-[#E0BC74]/70 bg-[linear-gradient(180deg,#E0BC74_0%,#B8893F_100%)] px-5 py-3 text-sm font-semibold text-[#07111F] shadow-[0_0_22px_rgba(201,163,95,0.25)] transition hover:brightness-110">
                    Enter Pantavion
                  </button>

                  <button className="rounded-2xl border border-[#284A78] bg-[#0A1830] px-5 py-3 text-sm font-medium text-[#D9E3F4] transition hover:bg-[#102243]">
                    Voice · Live Translator
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[#183154] bg-[#081321]/90 p-5">
                  <div className="text-xs uppercase tracking-[0.32em] text-[#C9A35F]">
                    Locked Core
                  </div>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-[#D3DDF0]">
                    <li>• One identity</li>
                    <li>• One continuity</li>
                    <li>• One memory spine</li>
                    <li>• One governed ecosystem</li>
                  </ul>
                </div>

                <div className="rounded-[24px] border border-[#183154] bg-[#081321]/90 p-5">
                  <div className="text-xs uppercase tracking-[0.32em] text-[#C9A35F]">
                    Voice Spine
                  </div>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-[#D3DDF0]">
                    <li>• STT / TTS</li>
                    <li>• Auto language detect</li>
                    <li>• Bidirectional translation</li>
                    <li>• Fallback / continuity</li>
                  </ul>
                </div>

                <div className="rounded-[24px] border border-[#183154] bg-[#081321]/90 p-5">
                  <div className="text-xs uppercase tracking-[0.32em] text-[#C9A35F]">
                    Global Kernel
                  </div>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-[#D3DDF0]">
                    <li>• Intake</li>
                    <li>• Classification</li>
                    <li>• Gap detection</li>
                    <li>• Execution routing</li>
                  </ul>
                </div>

                <div className="rounded-[24px] border border-[#183154] bg-[#081321]/90 p-5">
                  <div className="text-xs uppercase tracking-[0.32em] text-[#C9A35F]">
                    Build Order
                  </div>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-[#D3DDF0]">
                    <li>• Homepage shell</li>
                    <li>• Kernel files</li>
                    <li>• Input / output panels</li>
                    <li>• Memory panel</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
