import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function connectToOwner(formData: FormData) {
  "use server";
  const listingId = String(formData.get("listingId") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "");
  if (!listingId || !ownerId) redirect("/listings");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/auth/signin?next=/listings/${listingId}`);
  if (auth.user.id === ownerId) redirect(`/listings/${listingId}`);

  const { data: relationships } = await supabase
    .from("relationships")
    .select("id,requester_id,addressee_id,status")
    .or(`and(requester_id.eq.${auth.user.id},addressee_id.eq.${ownerId}),and(requester_id.eq.${ownerId},addressee_id.eq.${auth.user.id})`)
    .limit(1);

  const existing = relationships?.[0];
  if (existing?.status === "accepted") {
    const { data: conversationId, error } = await supabase.rpc("pantavion_create_direct_conversation", { p_other_user_id: ownerId });
    if (!error && conversationId) redirect(`/messages/${conversationId}`);
  }

  if (!existing || !["pending", "accepted"].includes(existing.status)) {
    await supabase.rpc("pantavion_request_relationship", { p_addressee_id: ownerId });
  }

  redirect(`/listings/${listingId}?contact=requested`);
}

export default async function ListingDetailPage({ params, searchParams }: { params: Promise<{ listingId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { listingId } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: listing, error } = await supabase
    .from("public_listings")
    .select("id,owner_id,listing_type,title,description,category,country_code,region,city,language_code,price_amount,price_currency,contact_mode,public_contact,lifecycle_state,paid_promotion,published_at,expires_at,created_at")
    .eq("id", listingId)
    .eq("lifecycle_state", "published")
    .single();

  if (error || !listing) {
    return <main className="min-h-screen bg-slate-950 text-slate-100"><section className="mx-auto max-w-4xl px-5 py-16"><h1 className="text-3xl font-semibold">Listing unavailable</h1><p className="mt-3 text-slate-300">It may be unpublished, expired, removed or the listings backend may not yet be deployed.</p><Link href="/listings" className="mt-6 inline-block rounded-xl border border-slate-700 px-4 py-3">Back to listings</Link></section></main>;
  }

  let relationship: { status: string } | null = null;
  if (auth.user && auth.user.id !== listing.owner_id) {
    const { data } = await supabase
      .from("relationships")
      .select("status")
      .or(`and(requester_id.eq.${auth.user.id},addressee_id.eq.${listing.owner_id}),and(requester_id.eq.${listing.owner_id},addressee_id.eq.${auth.user.id})`)
      .limit(1);
    relationship = data?.[0] ?? null;
  }

  const requested = query.contact === "requested";
  const location = [listing.city, listing.region, listing.country_code].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/listings" className="text-sm text-cyan-300">← Back to Pantavion Exchange</Link>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-slate-400"><span>{listing.listing_type}</span><span>•</span><span>{listing.category ?? "General"}</span>{location && <><span>•</span><span>{location}</span></>}</div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">{listing.title}</h1>
            {listing.price_amount != null && <div className="mt-5 text-2xl font-semibold">{listing.price_amount} {listing.price_currency ?? ""}</div>}
            {listing.description && <div className="mt-7 whitespace-pre-wrap text-base leading-7 text-slate-300">{listing.description}</div>}
            <div className="mt-8 border-t border-slate-800 pt-5 text-sm text-slate-400">Published {listing.published_at ? new Date(listing.published_at).toLocaleDateString() : "after moderation"}. Contact remains inside Pantavion unless the listing explicitly exposes another approved contact mode.</div>
          </article>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-xl font-semibold">Contact</h2>
            {auth.user?.id === listing.owner_id ? (
              <><p className="mt-3 text-sm text-slate-300">This is your listing.</p><Link href="/listings/mine" className="mt-5 inline-block rounded-xl bg-white px-4 py-3 font-semibold text-slate-950">Manage my listings</Link></>
            ) : relationship?.status === "accepted" ? (
              <form action={connectToOwner} className="mt-5"><input type="hidden" name="listingId" value={listing.id} /><input type="hidden" name="ownerId" value={listing.owner_id} /><button className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-950">Message in Pantavion</button><p className="mt-3 text-xs text-slate-400">Uses the same protected direct-conversation core as People & Social.</p></form>
            ) : relationship?.status === "pending" || requested ? (
              <div className="mt-5 rounded-xl border border-amber-700/40 bg-amber-950/30 p-4 text-sm text-amber-100">Connection request sent. Messaging opens only after the relationship is accepted.</div>
            ) : (
              <form action={connectToOwner} className="mt-5"><input type="hidden" name="listingId" value={listing.id} /><input type="hidden" name="ownerId" value={listing.owner_id} /><button className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-950">Request contact</button><p className="mt-3 text-xs text-slate-400">Pantavion does not silently expose private contact details. Relationship, block and messaging policies are enforced first.</p></form>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
