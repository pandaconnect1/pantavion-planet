export const metadata = {
  title: "Pantavion Communication Universe | Chat, Channels, Groups, Media and 18+ Boundaries",
  description:
    "Pantavion Communication Universe: own chat, channels, groups, pulse, stories, shorts, media, live, people, family, elite and 18+ relationship surfaces with age locks.",
};

const surfaces = [
  "PantaChat",
  "PantaChannels",
  "PantaPulse",
  "PantaStories",
  "PantaShorts",
  "PantaMedia",
  "PantaLive",
  "PantaGroups",
  "PantaConnect / People",
  "PantaFamily",
  "PantaElite",
  "PantaDating / Relationships 18+",
];

export default function CommunicationPage() {
  return (
    <main className="min-h-screen bg-[#06111f] px-6 py-12 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#f4c86a]">
          PANTAVION_COMMUNICATION_UNIVERSE_V1
        </p>
        <h1 className="max-w-5xl text-4xl font-bold md:text-6xl">
          Pantavion needs its own channels of communication.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          Pantavion must not be only a link to outside platforms. It needs its own communication
          universe inspired by social patterns but built with Pantavion-owned safety, translation,
          age locks, reporting, consent and product truth.
        </p>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {surfaces.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
          Real chat/social/media requires auth, database, storage, moderation, reporting and age-role enforcement.
          Under-18 users must not access adult dating or explicit adult discovery.
        </div>
      </section>
    </main>
  );
}
