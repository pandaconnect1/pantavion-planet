export default function Home() {
  const sections = [
    "Messages / Chat",
    "Stories",
    "Music",
    "Dates / Connections",
    "Health",
    "Calendar / Reminders",
    "Culture",
    "Environment",
    "Education",
    "Sports",
    "News",
    "Work / Business",
    "Family & Friends",
    "Economy / Banks",
    "Shipping / Marine",
    "Flights / Travel",
    "Tourism",
    "Politics",
    "Faith & Religions",
    "VR / AR",
    "Multimedia",
    "Contacts",
    "Marketplace",
    "Academy",
    "Research",
    "Communities",
    "Support & Care"
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="w-full border-b border-slate-800/60 bg-slate-950/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-black text-lg shadow-lg shadow-amber-500/40">
              P
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wide uppercase text-amber-300">
                Pantavion One
              </span>
              <span className="text-xs text-slate-400">
                Here We Are One. For All Humanity.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button className="rounded-full border border-slate-700/70 px-3 py-1 hover:border-amber-400 hover:text-amber-300 transition-colors">
              EN
            </button>
            <button className="rounded-full border border-slate-700/70 px-3 py-1 hover:border-amber-400 hover:text-amber-300 transition-colors">
              EL
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-10 lg:pt-16 lg:pb-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-center">
          {/* Left: text */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/5 px-3 py-1 text-xs font-medium text-amber-200 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Global Prototype • v1
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-50">
              Pantavion One —{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                Unified Global Platform
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl">
              Ένα ενιαίο σημείο για ανθρώπους, φωνή, γνώση και δράση. Όλες οι
              πλευρές της ζωής σου — μηνύματα, υγεία, εργασία, εκπαίδευση,
              ταξίδια — σε μία παγκόσμια πλατφόρμα, με ζωντανή μετάφραση φωνής
              και έξυπνο γνώμονα για όλους.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#sections"
                className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/40 hover:bg-amber-300 transition-colors"
              >
                Enter Pantavion One
              </a>
              <button className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-100 hover:border-amber-400 hover:text-amber-200 transition-colors">
                Watch Vision Preview
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-4 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Real project • Not a demo
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Multilingual • Voice-first • PWA-ready
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                10–15 year global architecture
              </div>
            </div>
          </div>

          {/* Right: “planet” card */}
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-tr from-amber-500/10 via-sky-500/5 to-emerald-500/10 blur-3xl" />
            <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/70 px-6 py-6 shadow-2xl shadow-amber-500/20">
              <p className="text-xs font-medium text-amber-200 uppercase tracking-[0.18em] mb-3">
                GLOBAL SNAPSHOT
              </p>
              <p className="text-sm text-slate-200 mb-4">
                One live canvas for{" "}
                <span className="font-semibold text-amber-300">
                  People, Places, Professions, Stories
                </span>
                . Ό,τι συμβαίνει, όπου κι αν είσαι, σε μία ενιαία ροή.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-[10px] text-slate-400">LIVE CHANNELS</p>
                  <p className="mt-1 text-lg font-semibold text-amber-300">
                    28
                  </p>
                  <p className="text-[11px] text-slate-400">
                    From Messages to Health & Finance.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-[10px] text-slate-400">VOICE BRIDGE</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-300">
                    60+
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Languages planned for live translation.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-[10px] text-slate-400">TIMELINE</p>
                  <p className="mt-1 text-lg font-semibold text-sky-300">
                    10–15y
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Long-term resilient architecture.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-emerald-400/10 px-4 py-3 text-[11px] text-amber-100">
                Pantavion One χτίζεται για να ενώσει{" "}
                <span className="font-semibold">
                  όλες τις γενιές, όλες τις γλώσσες, όλους τους ανθρώπους
                </span>{" "}
                σε μία κοινή πλατφόρμα.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section
        id="sections"
        className="mx-auto max-w-6xl px-4 pb-14 lg:pb-20"
      >
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="text-sm font-semibold tracking-[0.12em] text-slate-300 uppercase">
            Pantavion One Channels
          </h2>
          <p className="text-[11px] text-slate-400">
            Τα κανάλια είναι ενδεικτικά – η πλατφόρμα θα επεκτείνεται συνεχώς.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((label) => (
            <button
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-left text-sm text-slate-100 hover:border-amber-400/70 hover:bg-slate-900 transition-colors"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-amber-400/10 via-amber-500/5 to-emerald-400/10 pointer-events-none transition-opacity" />
              <span className="relative font-medium">{label}</span>
              <p className="relative mt-1 text-[11px] text-slate-400">
                Coming online as Pantavion One evolves.
              </p>
            </button>
          ))}
        </div>

        <p className="mt-6 text-[11px] text-slate-500 text-center">
          This is the foundation live build of Pantavion One. All modules
          (Pulse, People, Chat, Voice, Compass, Mind, Create) will connect here.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/70 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>
            © {new Date().getFullYear()} Pantavion One — Here We Are One. For
            All Humanity.
          </span>
          <span className="text-slate-500">
            Built as a real unified platform, not a demo.
          </span>
        </div>
      </footer>
    </main>
  );
}
