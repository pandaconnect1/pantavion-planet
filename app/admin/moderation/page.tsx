import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPlatformAuthority } from "@/lib/auth/platform-authority";
import ModerationClient, { type ModerationListing } from "./ModerationClient";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth");

  const authority = await hasPlatformAuthority(auth.user.id, ["founder", "admin", "moderator"]);
  if (!authority.allowed) redirect("/");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("public_listings")
    .select("id,owner_id,listing_type,title,description,category,country_code,region,city,language_code,price_amount,price_currency,lifecycle_state,moderation_note,created_at")
    .in("lifecycle_state", ["submitted", "under_review", "approved", "published", "rejected", "removed", "expired", "archived"])
    .order("created_at", { ascending: true })
    .limit(200);

  const listings = (data ?? []) as ModerationListing[];

  return (
    <main className="min-h-screen bg-[#06111f] px-5 py-10 text-white md:px-8">
      <section className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f4c86a]">Pantavion Founder / Admin Control</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">Listings moderation</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          Governed review and publishing queue. Every state transition is server-authorized and atomically written with its moderation audit record.
        </p>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">
            Moderation data is not available yet. Apply the Wave 2 database migrations before using this control surface.
          </div>
        ) : (
          <div className="mt-8">
            <ModerationClient initialListings={listings} role={authority.role} />
          </div>
        )}
      </section>
    </main>
  );
}
