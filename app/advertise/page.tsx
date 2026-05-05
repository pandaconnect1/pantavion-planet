export const metadata = {
  title: "Advertise on Pantavion | No Intrusive Ads",
  description:
    "Request professional promotion on Pantavion by continent, country, city, region, community, category and language. No intrusive ads, no ads in SOS, no adult ads to minors.",
};

const targeting = [
  "Continent",
  "Country",
  "City",
  "Region",
  "Community",
  "Category",
  "Profession",
  "Service type",
  "Language",
  "Local reach",
  "Regional reach",
  "Global reach",
];

const mediaTypes = ["Text", "Image", "Audio", "Video", "Document", "Link"];

const workflow = [
  "Advertiser submits a request",
  "Chooses geography and category",
  "Adds text, image, audio, video, document or link",
  "Payment provider setup is required before live checkout",
  "Listing enters moderation review",
  "Approved listing appears in Pantavion Newspaper",
  "Sold, rented, fulfilled or expired listings leave public promotion",
];

export default function AdvertisePage() {
  return (
    <main className="min-h-screen bg-[#070b16] px-6 py-12 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#f4c86a]">
          PANTAVION_NO_INTRUSIVE_ADS_POLICY_V1
        </p>
        <h1 className="max-w-5xl text-4xl font-bold tracking-tight md:text-6xl">
          Advertise on Pantavion without disturbing users.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          Pantavion does not place intrusive ads inside SOS, private communication, minors,
          trusted contacts or core life flows. Advertising belongs in a separate professional
          Newspaper / Classifieds / Promotion Center.
        </p>

        <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
          <strong>Truth status:</strong> automated payment, invoices, tax handling, checkout,
          webhooks and self-serve publishing are provider/payment/database-required. This page is
          a public inquiry surface, not a live checkout claim.
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-semibold text-[#f4c86a]">Targeting model</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {targeting.map((item) => (
                <span key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-semibold text-[#f4c86a]">Accepted media</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {mediaTypes.map((item) => (
                <span key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                  {item}
                </span>
              ))}
            </div>
          </article>
        </div>

        <article className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold text-[#f4c86a]">Professional workflow</h2>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {workflow.map((item, index) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                <span className="mr-2 text-[#f4c86a]">{index + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </article>

        <article className="mt-8 rounded-3xl border border-[#f4c86a]/30 bg-[#f4c86a]/10 p-6">
          <h2 className="text-2xl font-semibold text-[#f4c86a]">No intrusive ads rule</h2>
          <p className="mt-3 leading-7 text-slate-100">
            No ads inside SOS. No adult ads to minors. No popups that disturb core life use.
            Paid promotion must be clearly marked and reviewed before public appearance.
          </p>
        </article>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            className="rounded-full bg-[#f4c86a] px-5 py-3 font-semibold text-[#070b16]"
            href="mailto:info.pandaconnect@gmail.com?subject=Pantavion%20Ads%20Center%20Request"
          >
            Submit advertising inquiry
          </a>
          <a className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white" href="/newspaper">
            Open Pantavion Newspaper
          </a>
          <a className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white" href="/discovery">
            Public discovery plan
          </a>
        </div>
      </section>
    </main>
  );
}
