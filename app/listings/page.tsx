import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPES = ["classified", "service", "job", "business", "event", "property", "marketplace"] as const;

export default async function ListingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const type = typeof params.type === "string" && TYPES.includes(params.type as (typeof TYPES)[number]) ? params.type : undefined;
  const country = typeof params.country === "string" ? params.country.toUpperCase().slice(0, 3) : undefined;
  const supabase = await createClient();
  let query = supabase
    .from("public_listings")
    .select("id,listing_type,title,description,category,country_code,region,city,price_amount,price_currency,published_at,expires_at")
    .eq("lifecycle_state", "published")
    .order("published_at", { ascending: false })
    .limit(60);
  if (type) query = query.eq("listing_type", type);
  if (country) query = query.eq("country_code", country);
  const { data, error } = await query;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Pantavion Exchange</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Listings, work, services and marketplace</h1>
            <p className="mt-3 max-w-3xl text-slate-300">One governed discovery surface for classifieds, jobs, services, businesses, events, property and marketplace offers. Only moderated published records appear here.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/listings/new" className="rounded-xl bg-white px-4 py-3 font-semibold text-slate-950">Create listing</Link>
            <Link href="/listings/mine" className="rounded-xl border border-slate-700 px-4 py-3 font-semibold">My listings</Link>
          </div>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Listing categories">
          <Link href="/listings" className="rounded-full border border-slate-700 px-4 py-2 text-sm">All</Link>
          {TYPES.map((item) => <Link key={item} href={`/listings?type=${item}`} className="rounded-full border border-slate-700 px-4 py-2 text-sm capitalize">{item}</Link>)}
        </nav>

        {error ? (
          <div className="mt-10 rounded-2xl border border-amber-700/50 bg-amber-950/30 p-6">
            <h2 className="font-semibold text-amber-200">Backend gate not ready</h2>
            <p className="mt-2 text-sm text-amber-100/80">The listings schema must be deployed before this surface can become backend-live. No sample listings are being shown as real data.</p>
          </div>
        ) : data && data.length > 0 ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.map((item) => (
              <Link key={item.id} href={`/listings/${item.id}`} className="block rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:border-slate-600">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wider text-slate-400">
                  <span>{item.listing_type}</span><span>{[item.city, item.country_code].filter(Boolean).join(", ")}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
                {item.description && <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-300">{item.description}</p>}
                <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-400">{item.category ?? "General"}</span>
                  {item.price_amount != null && <strong>{item.price_amount} {item.price_currency ?? ""}</strong>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
            <h2 className="text-xl font-semibold">No published listings yet</h2>
            <p className="mt-2 text-slate-300">The surface is connected to canonical data. It stays empty until real submissions pass moderation and publication gates.</p>
          </div>
        )}
      </section>
    </main>
  );
}
