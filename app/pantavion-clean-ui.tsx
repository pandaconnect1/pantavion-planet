import Link from "next/link";

type RouteKey =
  | "home"
  | "pulse"
  | "people"
  | "chat"
  | "voice"
  | "compass"
  | "mind"
  | "create";

type Card = {
  eyebrow?: string;
  title: string;
  copy: string;
  bullets?: string[];
  highlight?: boolean;
};

type VoicePanel = {
  title: string;
  copy: string;
  body: string;
};

type PantavionPageProps = {
  current: Exclude<RouteKey, "home">;
  title: string;
  subtitle: string;
  intro?: string;
  cards?: Card[];
  voicePanels?: VoicePanel[];
  note?: string;
  wideCards?: boolean;
};

const NAV_ITEMS: Array<{ key: RouteKey; href: string; label: string }> = [
  { key: "home", href: "/", label: "Home" },
  { key: "pulse", href: "/pulse", label: "Pulse" },
  { key: "people", href: "/people", label: "People" },
  { key: "chat", href: "/chat", label: "Chat" },
  { key: "voice", href: "/voice", label: "Voice" },
  { key: "compass", href: "/compass", label: "Compass" },
  { key: "mind", href: "/mind", label: "Mind" },
  { key: "create", href: "/create", label: "Create" },
];

function Nav({ current }: { current: RouteKey }) {
  return (
    <header className="sticky top-0 z-40 border-b border-sky-900/40 bg-[#08203c]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-[24px] font-extrabold tracking-wide text-[#f7c94a] transition hover:opacity-90"
        >
          PANTAVION ONE
        </Link>

        <nav className="flex flex-wrap items-center gap-6 text-[16px] font-semibold text-white/90">
          {NAV_ITEMS.map((item) => {
            const active = current === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={active ? "text-white" : "text-white/85 transition hover:text-white"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function InfoCard({ card }: { card: Card }) {
  return (
    <section
      className={[
        "rounded-[24px] border px-6 py-7 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]",
        card.highlight
          ? "border-blue-300/45 bg-[#1d327d]"
          : "border-sky-300/25 bg-[#0b1836]",
      ].join(" ")}
    >
      {card.eyebrow ? (
        <div className="mb-5 text-[14px] font-extrabold uppercase tracking-[0.24em] text-[#ffd34d]">
          {card.eyebrow}
        </div>
      ) : null}

      <h2 className="mb-4 text-[18px] font-bold text-white">{card.title}</h2>
      <p className="text-[16px] leading-8 text-white/82">{card.copy}</p>

      {card.bullets && card.bullets.length > 0 ? (
        <ul className="mt-6 space-y-3 text-[15px] leading-7 text-white/85">
          {card.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              <span className="mt-[10px] h-1.5 w-1.5 rounded-full bg-white/85" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function VoiceCard({ panel }: { panel: VoicePanel }) {
  return (
    <section className="rounded-[24px] border border-sky-300/35 bg-[#163e7a] px-5 py-6">
      <h2 className="mb-4 text-[18px] font-bold text-white">{panel.title}</h2>
      <p className="mb-5 text-[16px] leading-7 text-white/86">{panel.copy}</p>
      <div className="min-h-[120px] rounded-[16px] border border-blue-400/45 bg-[#0b1836] p-4 text-[15px] leading-7 text-white/88">
        {panel.body}
      </div>
    </section>
  );
}

export function PantavionPage({
  current,
  title,
  subtitle,
  intro,
  cards = [],
  voicePanels = [],
  note,
  wideCards = false,
}: PantavionPageProps) {
  return (
    <div className="min-h-screen bg-[#02081d] text-white">
      <Nav current={current} />

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="max-w-5xl">
          <h1 className="text-[56px] font-extrabold uppercase tracking-[0.12em] text-[#d7e5ff] sm:text-[66px]">
            {title}
          </h1>

          <p className="mt-8 max-w-5xl text-[19px] leading-9 text-white/82">{subtitle}</p>

          {intro ? (
            <p className="mt-6 max-w-4xl text-[16px] leading-8 text-white/74">{intro}</p>
          ) : null}
        </section>

        {current === "voice" ? (
          <>
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="rounded-full border border-cyan-400 px-7 py-3 text-[16px] font-semibold text-white transition hover:bg-cyan-500/10">
                Start listening
              </button>
              <button className="rounded-full border border-rose-400 px-7 py-3 text-[16px] font-semibold text-white transition hover:bg-rose-500/10">
                Stop
              </button>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {voicePanels.map((panel) => (
                <VoiceCard key={panel.title} panel={panel} />
              ))}
            </div>
          </>
        ) : null}

        {cards.length > 0 ? (
          <div
            className={[
              "mt-10 grid gap-6",
              wideCards ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-3",
            ].join(" ")}
          >
            {cards.map((card) => (
              <InfoCard key={card.title} card={card} />
            ))}
          </div>
        ) : null}

        {note ? (
          <section className="mt-8 rounded-[22px] border border-dashed border-[#f0c654]/40 bg-[#081226] px-5 py-4 text-[15px] leading-7 text-[#f2f4f8]">
            <span className="font-extrabold text-[#ffd34d]">Implementation note:</span> {note}
          </section>
        ) : null}
      </main>
    </div>
  );
}
