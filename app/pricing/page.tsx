import Link from "next/link";

const stripeLink = process.env.NEXT_PUBLIC_STRIPE_FOUNDING_LINK;

export const metadata = {
  title: "Pricing | Pantavion One",
  description: "Pantavion founding access, marketplace, build services and future premium plans.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e8b94f]">
          Pantavion Pricing
        </p>
        <h1 className="mt-5 max-w-5xl text-5xl font-black leading-none md:text-7xl">
          Start with Founding Access. More power releases progressively.
        </h1>
        <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-200">
          Pricing is designed for growth: first the world learns Pantavion, then
          plans expand into business listings, creator tools, build services,
          media, marketplace and premium execution.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Plan
            title="Free Preview"
            price="€0"
            body="Public routes, vision, signal map, basic communication foundation and launch information."
            cta="Explore"
            href="/"
          />
          <Plan
            title="Founding Access"
            price="€9.99 / month"
            body="30-day founding trial with fair-use limits. Supports Pantavion development, infrastructure and live capability rollout."
            cta={stripeLink ? "Start Trial" : "Stripe Link Pending"}
            href={stripeLink || "/founding-access"}
            featured
          />
          <Plan
            title="Business / Creator"
            price="Coming next"
            body="Listings, media, creator tools, build services, business pages and promotional surfaces without intrusive ads."
            cta="View Market"
            href="/market"
          />
        </div>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <h2 className="text-3xl font-black">Important launch note</h2>
          <p className="mt-4 leading-8 text-slate-300">
            Pantavion provides access, tools and digital capabilities. It does
            not guarantee financial, professional, social, romantic, medical or
            personal outcomes. Fair-use limits and safety rules apply.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/terms" className="rounded-full border border-white/20 px-5 py-3 font-black">Terms</Link>
            <Link href="/privacy" className="rounded-full border border-white/20 px-5 py-3 font-black">Privacy</Link>
            <Link href="/refund-policy" className="rounded-full border border-white/20 px-5 py-3 font-black">Refund Policy</Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function Plan({
  title,
  price,
  body,
  cta,
  href,
  featured = false,
}: {
  title: string;
  price: string;
  body: string;
  cta: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <article className={`rounded-[1.5rem] border p-6 ${featured ? "border-[#e8b94f]/60 bg-[#e8b94f]/10" : "border-white/10 bg-white/[0.04]"}`}>
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mt-4 text-4xl font-black text-[#f4d37a]">{price}</p>
      <p className="mt-5 leading-7 text-slate-300">{body}</p>
      <Link href={href} className="mt-6 inline-flex rounded-full bg-[#e8b94f] px-5 py-3 font-black text-black">
        {cta}
      </Link>
    </article>
  );
}
