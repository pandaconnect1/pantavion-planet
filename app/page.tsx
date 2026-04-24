// app/page.tsx

const primaryActions = [
  {
    title: 'Translate',
    description: 'Live, offline, natural, and official translation flows for everyday and travel use.',
  },
  {
    title: 'Chat',
    description: 'Clean communication space for people, families, work, and trusted connections.',
  },
  {
    title: 'Services',
    description: 'Access practical services, workflows, and guided actions from one calm surface.',
  },
  {
    title: 'Safety',
    description: 'Protected access to urgent help, continuity, and trusted support paths.',
  },
];

const userModes = [
  'Everyday',
  'Family',
  'Professional',
  'Elite',
  'Accessibility',
  'Travel',
];

const sections = [
  'People',
  'Chat',
  'Voice',
  'Translate',
  'Work',
  'Media',
  'Safety',
  'Profile',
];

const languages = ['EL', 'EN', 'AR', 'TR', 'RU', 'FR', 'DE', 'ES', 'HI', 'ZH'];

const accessibility = [
  'Text Size',
  'Contrast',
  'Reduced Motion',
  'Simplified Mode',
  'Captions',
  'Voice Assist',
];

const continuityItems = [
  'Continue across phone, tablet, laptop, and new devices',
  'Restore settings, memory, and recent activity after device change',
  'Keep offline translator packs ready for travel and low-network situations',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#05101c] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-24 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pb-10">
        <header className="sticky top-0 z-30 mb-5 rounded-2xl border border-white/10 bg-[#081525]/90 px-4 py-3 backdrop-blur md:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300/75">
                  Pantavion
                </div>
                <div className="mt-1 text-lg font-semibold leading-tight text-white sm:text-[1.45rem]">
                  Human-First Platform Surface
                </div>
              </div>

              <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 xl:hidden">
                Menu
              </button>
            </div>

            <div className="hidden items-center gap-1 xl:flex">
              {['Home', 'Translate', 'People', 'Chat', 'Voice', 'Work'].map((item) => (
                <button
                  key={item}
                  className="rounded-xl px-3 py-2 text-[15px] text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200">
                Language
              </button>
              <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200">
                Accessibility
              </button>
              <button className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-950">
                Continue
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr] lg:gap-5">
          <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(10,35,64,0.96),rgba(8,20,36,0.98),rgba(10,57,87,0.88))] p-5 sm:p-6 lg:p-7">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
              One platform for all humanity
            </div>

            <h1 className="mt-4 max-w-2xl text-[2.35rem] font-semibold leading-[1.08] text-white sm:text-[3rem] lg:text-[3.55rem]">
              Clean, calm, professional access to people, language, services, and continuity.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Pantavion is designed to feel easy, trustworthy, accessible, and memorable across all
              ages, all user categories, and all devices, without visual fatigue or surface chaos.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950">
                Open Pantavion
              </button>
              <button className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-white">
                Start Translation
              </button>
              <button className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-white">
                Explore Sections
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {userModes.map((mode) => (
                <span
                  key={mode}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
                >
                  {mode}
                </span>
              ))}
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-[#0a1728] p-5 sm:p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Fixed Languages
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {languages.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0a1728] p-5 sm:p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Accessibility
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {accessibility.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Primary Actions
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {primaryActions.map((item) => (
              <article
                key={item.title}
                className="flex min-h-[226px] flex-col rounded-3xl border border-white/10 bg-[#0a1728] p-5 transition hover:border-cyan-300/20 hover:bg-[#0c1b2f]"
              >
                <div className="text-[1.08rem] font-semibold text-white">{item.title}</div>
                <p className="mt-4 text-sm leading-8 text-slate-300">{item.description}</p>
                <div className="mt-auto pt-5">
                  <button className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white">
                    Open
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0a1728] p-5 sm:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Pantavion Sections
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {sections.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-sm font-medium text-slate-100"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-400/10 bg-[linear-gradient(135deg,rgba(7,38,62,0.94),rgba(7,26,46,0.98))] p-5 sm:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              Translator Core
            </div>
            <h2 className="mt-3 max-w-xl text-2xl font-semibold leading-tight text-white sm:text-[2.05rem]">
              Natural, official, offline, and two-way translation.
            </h2>
            <p className="mt-4 text-sm leading-8 text-slate-300">
              Built for travel, real life, work, and emergencies, with room for regional style,
              official language, and downloaded packs for offline use.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {['Natural Dialect Mode', 'Official Language Mode', 'Offline Packs', 'Bidirectional Voice'].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-cyan-400/10 bg-[#0b1727] px-4 py-4 text-sm text-slate-100"
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0a1728] p-5 sm:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Cross-Device Continuity
            </div>
            <div className="mt-4 grid gap-3">
              {continuityItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0a1728] p-5 sm:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Trust and Comfort
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                'Balanced spacing without large or tiny gaps',
                'Professional and accessible contrast',
                'Simple structure for all age groups',
                'Mobile-safe layout with clear actions',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-6 rounded-3xl border border-white/10 bg-[#0a1728] px-5 py-4">
          <div className="flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
            <div>Pantavion surface v1 — calm, clear, accessible, multilingual, and cross-device ready.</div>
            <div className="flex flex-wrap gap-3 text-slate-400">
              <span>Language</span>
              <span>Accessibility</span>
              <span>Safety</span>
              <span>Continuity</span>
            </div>
          </div>
        </footer>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#081220]/95 px-3 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-5 gap-2">
          {['Home', 'Translate', 'Chat', 'Work', 'Profile'].map((item) => (
            <button
              key={item}
              className="rounded-xl px-2 py-3 text-center text-[11px] font-medium text-slate-200"
            >
              {item}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
