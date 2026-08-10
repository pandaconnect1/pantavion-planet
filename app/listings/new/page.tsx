import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function createListing(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/signin?next=/listings/new");

  const title = String(formData.get("title") ?? "").trim();
  const listingType = String(formData.get("listingType") ?? "classified");
  if (title.length < 3 || title.length > 160) redirect("/listings/new?error=title");

  const allowed = new Set(["classified", "service", "job", "business", "event", "request", "property", "marketplace", "promotion", "community_announcement", "other"]);
  if (!allowed.has(listingType)) redirect("/listings/new?error=type");

  const priceRaw = String(formData.get("priceAmount") ?? "").trim();
  const price = priceRaw ? Number(priceRaw) : null;
  const { error } = await supabase.from("public_listings").insert({
    owner_id: auth.user.id,
    listing_type: listingType,
    title,
    description: String(formData.get("description") ?? "").trim().slice(0, 10000) || null,
    category: String(formData.get("category") ?? "").trim().slice(0, 120) || null,
    country_code: String(formData.get("countryCode") ?? "").trim().toUpperCase().slice(0, 3) || null,
    region: String(formData.get("region") ?? "").trim().slice(0, 120) || null,
    city: String(formData.get("city") ?? "").trim().slice(0, 120) || null,
    language_code: String(formData.get("languageCode") ?? "").trim().toLowerCase().slice(0, 16) || null,
    price_amount: Number.isFinite(price) ? price : null,
    price_currency: String(formData.get("priceCurrency") ?? "").trim().toUpperCase().slice(0, 3) || null,
    lifecycle_state: formData.get("submit") === "1" ? "submitted" : "draft",
    paid_promotion: false,
  });
  if (error) redirect("/listings/new?error=backend");
  redirect("/listings/mine?created=1");
}

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/signin?next=/listings/new");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Pantavion Exchange</p>
        <h1 className="mt-2 text-4xl font-semibold">Create a listing</h1>
        <p className="mt-3 text-slate-300">Save a draft or submit it for moderation. Submission never means automatic publication or paid promotion.</p>
        <form action={createListing} className="mt-8 grid gap-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <label className="grid gap-2"><span>Type</span><select name="listingType" className="rounded-xl bg-slate-950 p-3"><option value="classified">Classified</option><option value="service">Service</option><option value="job">Job</option><option value="business">Business</option><option value="event">Event</option><option value="property">Property</option><option value="marketplace">Marketplace</option><option value="request">Request</option></select></label>
          <label className="grid gap-2"><span>Title</span><input required minLength={3} maxLength={160} name="title" className="rounded-xl bg-slate-950 p-3" /></label>
          <label className="grid gap-2"><span>Description</span><textarea name="description" rows={7} maxLength={10000} className="rounded-xl bg-slate-950 p-3" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span>Category</span><input name="category" className="rounded-xl bg-slate-950 p-3" /></label><label className="grid gap-2"><span>Language</span><input name="languageCode" placeholder="en" className="rounded-xl bg-slate-950 p-3" /></label></div>
          <div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-2"><span>Country</span><input name="countryCode" placeholder="CY" className="rounded-xl bg-slate-950 p-3" /></label><label className="grid gap-2"><span>Region</span><input name="region" className="rounded-xl bg-slate-950 p-3" /></label><label className="grid gap-2"><span>City</span><input name="city" className="rounded-xl bg-slate-950 p-3" /></label></div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span>Price</span><input type="number" step="0.01" min="0" name="priceAmount" className="rounded-xl bg-slate-950 p-3" /></label><label className="grid gap-2"><span>Currency</span><input name="priceCurrency" placeholder="EUR" maxLength={3} className="rounded-xl bg-slate-950 p-3" /></label></div>
          <div className="flex flex-wrap gap-3"><button name="submit" value="0" className="rounded-xl border border-slate-700 px-5 py-3 font-semibold">Save draft</button><button name="submit" value="1" className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950">Submit for review</button></div>
        </form>
      </section>
    </main>
  );
}
