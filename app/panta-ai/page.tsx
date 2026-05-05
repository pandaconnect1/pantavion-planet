export const metadata = {
  title: "PantaAI | Public, Personal and Guardian AI",
  description:
    "PantaAI truth page: public AI, personal AI and internal Guardian AI are separate layers with provider, database, privacy and audit requirements.",
};

const layers = [
  {
    title: "Public PantaAI",
    status: "Provider-required",
    text: "The public AI should answer about Pantavion, translation, safety, work and learning. It must not make medical, legal, financial or emergency authority claims.",
  },
  {
    title: "Personal PantaAI",
    status: "Database/auth-required",
    text: "Each user assistant needs auth, profile, age role, language, country, consent, memory policy and provider routing before being live.",
  },
  {
    title: "Guardian AI",
    status: "Audit-runner-required",
    text: "Guardian AI must check broken routes, dead buttons, debug text, unsafe SOS claims, language mismatch and missing requirements before auto-actions.",
  },
];

export default function PantaAIPage() {
  return (
    <main className="min-h-screen bg-[#06111f] px-6 py-12 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#f4c86a]">
          PANTAVION_AI_TRUTH_SURFACE_V1
        </p>
        <h1 className="max-w-5xl text-4xl font-bold md:text-6xl">PantaAI is not one chatbot.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          PantaAI has three different layers: public AI for visitors, personal AI for users,
          and internal Guardian AI for audits. Anything not connected to provider/auth/database
          must be shown as required, not fake-live.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {layers.map((layer) => (
            <article key={layer.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="mb-4 inline-flex rounded-full border border-[#f4c86a]/40 px-3 py-1 text-xs font-semibold text-[#f4c86a]">
                {layer.status}
              </div>
              <h2 className="text-2xl font-semibold">{layer.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{layer.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
