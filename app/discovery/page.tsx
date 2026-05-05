export const metadata = {
  title: "Pantavion Public Discovery | Google, Bing, Apple and Organic Growth",
  description:
    "Pantavion public discovery truth: search engines, sitemap, robots, Apple Business Connect readiness, Bing IndexNow readiness, social sharing and honest product status.",
};

const channels = [
  {
    title: "Google Search",
    status: "Public SEO required",
    text: "Pantavion needs crawlable public pages, useful content, clear metadata, sitemap, internal links and Google Search Console setup. Indexing and ranking are not guaranteed.",
  },
  {
    title: "Bing / MSN / IndexNow",
    status: "Setup required",
    text: "Pantavion has to prepare sitemap discipline and later IndexNow with a real domain ownership key. URL submission does not guarantee indexing.",
  },
  {
    title: "Apple ecosystem",
    status: "Business setup required",
    text: "Pantavion should prepare Apple Business Connect readiness for Maps, Siri, Wallet, branded communications and business discovery where eligible.",
  },
  {
    title: "Organic social",
    status: "Content engine required",
    text: "Pantavion needs repeated public threads and shareable pages for Interpreter, SOS, PantaAI, Life Connector, Communication Universe and Newspaper Ads Center.",
  },
  {
    title: "Pantavion-owned discovery",
    status: "Own channels required",
    text: "Pantavion should not depend only on paid ads from external platforms. It needs its own Newspaper, professional listings and public product pages.",
  },
];

export default function DiscoveryPage() {
  return (
    <main className="min-h-screen bg-[#06111f] px-6 py-12 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#f4c86a]">
          PANTAVION_PUBLIC_GROWTH_LEDGER_V1
        </p>
        <h1 className="max-w-5xl text-4xl font-bold tracking-tight md:text-6xl">
          Pantavion must be discovered, not merely uploaded.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          This page records the truth: being live on the internet does not guarantee visitors,
          revenue, indexing or public trust. Pantavion must build crawlable pages, sitemap,
          platform readiness, content loops, and its own professional discovery surfaces.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {channels.map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="mb-4 inline-flex rounded-full border border-[#f4c86a]/40 px-3 py-1 text-xs font-semibold text-[#f4c86a]">
                {item.status}
              </div>
              <h2 className="text-2xl font-semibold">{item.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{item.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-[#f4c86a]/30 bg-[#f4c86a]/10 p-6">
          <h2 className="text-2xl font-semibold text-[#f4c86a]">No fake growth claim</h2>
          <p className="mt-3 leading-7 text-slate-100">
            Pantavion will not claim guaranteed traffic, guaranteed revenue, guaranteed Google ranking
            or automatic Apple/Bing/Google discovery. Growth requires public pages, indexing setup,
            social content, trust, product usefulness and conversion paths.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a className="rounded-full bg-[#f4c86a] px-5 py-3 font-semibold text-[#06111f]" href="/advertise">
            Advertise without intrusive ads
          </a>
          <a className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white" href="/newspaper">
            Pantavion Newspaper
          </a>
          <a className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white" href="/product-status">
            Product status
          </a>
        </div>
      </section>
    </main>
  );
}
