export const metadata = {
  title: "Pantavion Product Status | Truth Before Claims",
  description:
    "Pantavion product truth status: what is live, local-only, provider-required, database-required or legal-contract-required.",
};

const statuses = [
  ["SOS", "Local/browser/PWA layer"],
  ["Universal Interpreter", "Provider-required"],
  ["PantaAI Public", "Provider-required"],
  ["Personal PantaAI", "Auth/database-required"],
  ["Internal Guardian AI", "Audit-runner-required"],
  ["Life Connector Hub", "Provider/database-required"],
  ["Communication Universe", "Database/moderation-required"],
  ["Newspaper Ads Center", "Provider/payment/moderation-required"],
  ["Google/Bing/Apple discovery", "Setup/content-required"],
];

export default function ProductStatusPage() {
  return (
    <main className="min-h-screen bg-[#070b16] px-6 py-12 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#f4c86a]">
          PANTAVION_PRODUCT_TRUTH_LEDGER_V1
        </p>
        <h1 className="max-w-5xl text-4xl font-bold md:text-6xl">
          Product truth before public claims.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          Pantavion must show the truth of every product surface. Roadmap, static pages,
          local-only functions, provider-required functions and database-required functions
          must not be presented as fully live.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {statuses.map(([title, status]) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm font-semibold text-[#f4c86a]">{status}</div>
              <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
