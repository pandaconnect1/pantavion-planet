export const metadata = {
  title: "Pantavion Newspaper | Global Professional Listings",
  description:
    "Pantavion Newspaper is the separate public surface for professional listings, community announcements, services, requests and promoted entries.",
};

const sections = [
  {
    title: "Professional listings",
    text: "Businesses, professionals and creators can request visibility without interrupting users in private or safety areas.",
  },
  {
    title: "Community announcements",
    text: "Cities, villages, diaspora groups, events and institutions can publish structured public announcements after approval.",
  },
  {
    title: "Marketplace lifecycle",
    text: "Sold, rented, fulfilled, expired or removed listings must leave public promotion and move to archive according to policy.",
  },
  {
    title: "Global-local discovery",
    text: "Listings are organized by continent, country, city, region, community, category and language.",
  },
];

const statuses = [
  "Submitted",
  "Payment pending",
  "Under review",
  "Approved",
  "Published",
  "Sold",
  "Rented",
  "Fulfilled",
  "Expired",
  "Removed from public",
];

export default function NewspaperPage() {
  return (
    <main className="min-h-screen bg-[#06111f] px-6 py-12 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#f4c86a]">
          PANTAVION_NEWSPAPER_ADS_CENTER_V1
        </p>
        <h1 className="max-w-5xl text-4xl font-bold tracking-tight md:text-6xl">
          Pantavion Newspaper: public listings without intrusive advertising.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          This is the planned public surface for professional promotion, classifieds,
          requests, community announcements and regional discovery. It is separate from SOS,
          private communication and minor-safe experiences.
        </p>

        <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
          <strong>Current status:</strong> public product surface. Real paid placement,
          automated checkout, publishing and expiry automation require provider/payment,
          database, moderation and legal workflow before being marked live.
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-semibold text-[#f4c86a]">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{section.text}</p>
            </article>
          ))}
        </div>

        <article className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold text-[#f4c86a]">Listing lifecycle</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            {statuses.map((status) => (
              <span key={status} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                {status}
              </span>
            ))}
          </div>
          <p className="mt-5 leading-7 text-slate-300">
            Items marked sold, rented, fulfilled, expired or removed from public should not remain promoted.
            They should be hidden from public browsing and archived according to legal, accounting and abuse-prevention policy.
          </p>
        </article>

        <div className="mt-8 flex flex-wrap gap-3">
          <a className="rounded-full bg-[#f4c86a] px-5 py-3 font-semibold text-[#06111f]" href="/advertise">
            Request a listing
          </a>
          <a className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white" href="/discovery">
            Public discovery
          </a>
          <a className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white" href="/">
            Pantavion home
          </a>
        </div>
      </section>
    </main>
  );
}
