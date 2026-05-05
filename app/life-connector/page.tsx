export const metadata = {
  title: "Pantavion Life Connector | Contacts, Email, SMS, Calendar and Reminders",
  description:
    "Pantavion Life Connector truth page: consent-based contacts, email, SMS, calendar, birthdays, reminders, notes and tasks.",
};

const connectors = [
  ["Phone contacts", "Mobile/OS-permission-required"],
  ["Email contacts", "OAuth/provider-required"],
  ["CSV / vCard import", "Local-first possible"],
  ["Email hub", "OAuth/provider-required"],
  ["SMS / messages hub", "Mobile-app/platform-required"],
  ["Calendar", "OAuth/provider-required"],
  ["Birthdays", "Local-first/database-required"],
  ["Notes and tasks", "Local-first/database-required"],
];

export default function LifeConnectorPage() {
  return (
    <main className="min-h-screen bg-[#070b16] px-6 py-12 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#f4c86a]">
          PANTAVION_LIFE_CONNECTOR_HUB_V1
        </p>
        <h1 className="max-w-5xl text-4xl font-bold md:text-6xl">
          One life center instead of 100 disconnected apps.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          The Life Connector Hub is the requirement for contacts, email, SMS/messages,
          calendar, birthdays, reminders, notes, work and daily organization. Nothing is imported
          without explicit consent and real provider/OS permission.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {connectors.map(([title, status]) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm font-semibold text-[#f4c86a]">{status}</div>
              <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
          Web/PWA cannot claim full phone contacts or SMS access without OS/mobile permissions.
          Email and calendar require OAuth/provider consent. App contacts require official APIs or legal exports.
        </div>
      </section>
    </main>
  );
}
