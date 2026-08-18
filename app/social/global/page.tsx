import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSocialCountryPackRuntimeState } from "@/core/governance/social-country-packs";

export const dynamic = "force-dynamic";

export default async function GlobalSocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("country,language,display_name,username").eq("id", user.id).maybeSingle()
    : { data: null };

  const runtime = getSocialCountryPackRuntimeState(profile?.country ?? null);
  const pack = runtime.pack;

  return (
    <main className="min-h-screen bg-[#f4f8fc] px-4 py-6 text-slate-950 sm:px-6">
      <section className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#3474b8]">PANTAVION GLOBAL SOCIAL</p>
              <h1 className="mt-2 text-4xl font-black text-[#173f72]">Παγκόσμια λειτουργία χωρίς ψεύτικες υποσχέσεις.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Το SOCIAL-GLOBAL-001 εφαρμόζεται ως κοινό policy/runtime layer πάνω από Social, People και Chat. Η χώρα ρυθμίζει νόμιμες τοπικές διαφορές χωρίς να δημιουργεί διαφορετικό προϊόν.</p>
            </div>
            <Link href="/social" className="rounded-full bg-[#2467aa] px-4 py-2 text-sm font-black text-white no-underline">← Social</Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">Country pack</p>
            <h2 className="mt-2 text-2xl font-black text-[#173f72]">{runtime.countryCode ?? "Δεν ορίστηκε"}</h2>
            <p className="mt-2 text-sm text-slate-600">{runtime.state === "reviewed-runtime-ready" ? "Reviewed runtime pack διαθέσιμο" : runtime.state === "blocked" ? "Pack blocked από validation" : "Research pending — δεν ενεργοποιούνται μη τεκμηριωμένοι τοπικοί κανόνες"}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">Low-data / offline</p>
            <h2 className="mt-2 text-2xl font-black text-[#173f72]">Ενεργό baseline</h2>
            <p className="mt-2 text-sm text-slate-600">Text-first, resumable uploads, offline drafts και store-and-forward με idempotency είναι μέρος του κοινού συμβολαίου.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">Truth boundary</p>
            <h2 className="mt-2 text-2xl font-black text-[#173f72]">Chat ≠ Social ≠ SOS</h2>
            <p className="mt-2 text-sm text-slate-600">Ιδιωτικό Chat δεν μπαίνει σε Social ranking. Emergency truth ανήκει στο SOS. Μετάφραση κρατά το πρωτότυπο.</p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#173f72]">Κοινά release gates</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Χρονολογικό/ουδέτερο feed ως default", "Επεξηγήσιμη και resettable personalization", "Μηδενικό targeted advertising για minors", "WCAG 2.2 AA", "Original-language preservation", "Block / mute / report propagation", "Low-data mode", "Offline deduplication", "Verified emergency/corrections ανεξάρτητα από engagement"].map((item) => <div key={item} className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">✓ {item}</div>)}
          </div>
        </section>

        {pack ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-xl font-black text-emerald-950">{pack.countryCode} · {pack.version}</h2>
            <p className="mt-2 text-sm text-emerald-900">Γλώσσες: {pack.officialAndSupportedLanguages.join(", ")} · Status: {pack.status} · Effective from: {pack.effectiveFrom}</p>
            <p className="mt-2 text-xs leading-5 text-emerald-800">Το pack είναι recovered/reviewed από το SOCIAL-GLOBAL-001. Δεν παρουσιάζεται ως πλήρης νομική κάλυψη όλων των country cells μέχρι να περάσουν τα country-specific evidence και acceptance gates.</p>
          </section>
        ) : (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
            Η χώρα του profile δεν έχει ακόμη reviewed CountryPack στο recovered implementation. Τα global safety/privacy/accessibility invariants παραμένουν, αλλά δεν εφευρίσκουμε country-specific κανόνες.
          </section>
        )}

        <nav className="flex flex-wrap gap-2">
          <Link href="/people" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 no-underline">People</Link>
          <Link href="/messages" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 no-underline">Chat</Link>
          <Link href="/social/communities" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 no-underline">Communities</Link>
          <Link href="/social/notifications" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 no-underline">Notifications</Link>
        </nav>
      </section>
    </main>
  );
}
