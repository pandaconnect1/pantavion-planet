import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/signin?next=/listings/mine");
  const { data, error } = await supabase
    .from("public_listings")
    .select("id,listing_type,title,category,city,country_code,lifecycle_state,moderation_note,paid_promotion,published_at,expires_at,created_at")
    .eq("owner_id", auth.user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Pantavion Exchange</p><h1 className="mt-2 text-4xl font-semibold">My listings</h1></div><Link href="/listings/new" className="rounded-xl bg-white px-4 py-3 font-semibold text-slate-950">Create listing</Link></div>
        {error ? <div className="mt-8 rounded-2xl border border-amber-700/50 p-6 text-amber-100">Listings backend is not deployed yet. No false account data is shown.</div> : data && data.length ? <div className="mt-8 grid gap-3">{data.map((item) => <article key={item.id} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="text-xs uppercase tracking-wider text-slate-400">{item.listing_type} · {[item.city,item.country_code].filter(Boolean).join(", ")}</div><h2 className="mt-1 text-lg font-semibold">{item.title}</h2>{item.moderation_note && <p className="mt-2 text-sm text-amber-200">Review note: {item.moderation_note}</p>}</div><div className="rounded-full border border-slate-700 px-3 py-1 text-sm capitalize">{item.lifecycle_state.replaceAll("_", " ")}</div></article>)}</div> : <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-7"><h2 className="text-xl font-semibold">No listings yet</h2><p className="mt-2 text-slate-300">Create a draft when you are ready. Publication happens only after the required review gates.</p></div>}
      </section>
    </main>
  );
}
