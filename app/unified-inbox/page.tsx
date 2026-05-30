import Link from "next/link";

export const metadata = {
  title: "Unified Inbox | Pantavion",
  description:
    "Pantavion unified communication foundation for messages, contacts, translation and safe communication.",
};

const connectionCards = [
  {
    title: "Pantavion Messages",
    description: "A central place for Pantavion messages and trusted communication.",
    status: "Foundation ready",
  },
  {
    title: "Contacts",
    description: "Connect with people through consent-based contact and profile features.",
    status: "Controlled rollout",
  },
  {
    title: "Email",
    description: "Optional email connection for users who choose to enable it.",
    status: "Provider required",
  },
  {
    title: "SMS",
    description: "Optional SMS/provider connection where supported and permitted.",
    status: "Provider required",
  },
  {
    title: "Social Universe",
    description: "Pantavion social, media and community communication surfaces.",
    status: "Foundation ready",
  },
  {
    title: "Translation",
    description: "Multilingual communication support across text, voice and media.",
    status: "Foundation ready",
  },
];

export default function UnifiedInboxPage() {
  return (
    <main className="min-h-screen bg-[#050b16] px-5 py-8 text-white sm:px-8 lg:px-16">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-yellow-400/25 bg-[#071120] p-6 shadow-2xl sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.45em] text-yellow-300">
            Pantavion Communication Core
          </p>

          <div className="mt-5 max-w-4xl">
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Unified Inbox
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-200">
              One clean Pantavion communication center for messages, contacts,
              translation and trusted connection.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Some capabilities are being released gradually. Private connections
              remain optional and user-controlled.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-yellow-400 px-5 py-3 text-sm font-black text-black shadow-lg shadow-yellow-500/20"
            >
              Back to Pantavion
            </Link>
            <Link
              href="/translate"
              className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white hover:border-yellow-300"
            >
              Translation
            </Link>
            <Link
              href="/sos"
              className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white hover:border-yellow-300"
            >
              SOS Center
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {connectionCards.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-white/10 bg-[#0b1220] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-black">{card.title}</h2>
                <span className="rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-yellow-200">
                  {card.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6 sm:p-8">
          <h2 className="text-2xl font-black text-yellow-100">
            Built for consent-first communication
          </h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-yellow-50/85">
            Unified Inbox is being prepared as a controlled Pantavion
            communication center. External providers and private account
            connections will only be enabled when the user chooses them and the
            capability is ready.
          </p>
        </section>
      </section>
    </main>
  );
}
