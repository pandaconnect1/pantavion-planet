import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const domains = [
  { label: "News", type: "article", description: "Source-backed reporting, corrections and provenance." },
  { label: "Sports", type: "sports_update", description: "Fixtures, results and updates when authorized data is connected." },
  { label: "Internet Radio", type: "radio_station", description: "Rights-aware live stations and multilingual audio." },
  { label: "Podcasts & Audio", type: "audio_episode", description: "Creator, cultural and professional audio." },
  { label: "Video", type: "video", description: "Rights-aware published video and creator media." },
  { label: "Announcements", type: "announcement", description: "Structured public/community/institutional notices." },
];

type MediaItem = {
  id: string;
  item_type: string;
  title: string;
  summary: string | null;
  canonical_url: string | null;
  media_url: string | null;
  image_url: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  language_code: string | null;
  category: string | null;
  published_at: string | null;
  correction_note: string | null;
};

export default async function MediaPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_items")
    .select("id,item_type,title,summary,canonical_url,media_url,image_url,country_code,region,city,language_code,category,published_at,correction_note")
    .eq("editorial_state", "published")
    .order("published_at", { ascending: false })
    .limit(24);

  const items = (data ?? []) as MediaItem[];
  const backendReady = !error;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_80%_0%,#1b4b81_0,#081525_34%,#030812_72%)] px-4 py-6 text-white sm:px-8 sm:py-10">
      <section className="mx-auto max-w-7xl">
        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="font-black tracking-[0.18em] text-[#f4c86a] no-underline">PANTAVION</Link>
          <div className="flex flex-wrap gap-2 text-sm font-bold">
            <Link href="/newspaper" className="rounded-full border border-white/10 px-3 py-2 text-slate-200 no-underline">Classifieds</Link>
            <Link href="/advertise" className="rounded-full border border-white/10 px-3 py-2 text-slate-200 no-underline">Ads Center</Link>
            <Link href="/ecosystem" className="rounded-full border border-white/10 px-3 py-2 text-slate-200 no-underline">Ecosystem</Link>
          </div>
        </nav>

        <header className="py-12 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">PANTAVION MEDIA · NEWS · SPORTS · RADIO</p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[#fff3c4] sm:text-6xl lg:text-7xl">
            One global media world, with source truth built in.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            News, sports, internet radio, podcasts, video and public announcements share one provenance, rights, freshness and correction model instead of separate disconnected shells.
          </p>
          <div className={`mt-6 inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${backendReady ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : "border-amber-300/30 bg-amber-400/10 text-amber-100"}`}>
            {backendReady ? `DATABASE CONNECTED · ${items.length} CURRENT ELIGIBLE ITEMS` : "DATABASE MIGRATION / BACKEND GATE NOT YET AVAILABLE"}
          </div>
        </header>

        <section>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {domains.map((domain) => (
              <article key={domain.type} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/10">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{domain.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{domain.description}</p>
                <Link href={`/api/media/feed?type=${domain.type}`} className="mt-4 inline-flex text-sm font-black text-[#f4c86a] no-underline">Open truthful feed API →</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">CURRENT PUBLIC FEED</p>
              <h2 className="mt-1 text-2xl font-black text-[#fff3c4] sm:text-3xl">Published and RLS-eligible</h2>
            </div>
            <Link href="/api/media/feed" className="rounded-full border border-white/15 px-4 py-2 text-sm font-black text-white no-underline">JSON feed</Link>
          </div>

          {!backendReady ? (
            <div className="mt-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
              The canonical media schema has not been applied to this environment yet. Pantavion will not fabricate headlines or radio stations while the backend gate is unavailable.
            </div>
          ) : items.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
              No verified/eligible content is stored yet. This is a truthful empty state: providers and sources must be reviewed for provenance and rights before content appears here.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const href = item.canonical_url || item.media_url;
                return (
                  <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                    <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200">
                      <span>{item.item_type.replaceAll("_", " ")}</span>
                      {item.country_code ? <span>· {item.country_code}</span> : null}
                      {item.language_code ? <span>· {item.language_code}</span> : null}
                    </div>
                    <h3 className="mt-3 text-xl font-black text-[#fff3c4]">{item.title}</h3>
                    {item.summary ? <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p> : null}
                    {item.correction_note ? <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100">Correction: {item.correction_note}</p> : null}
                    {href ? <a href={href} rel="noreferrer" className="mt-4 inline-flex text-sm font-black text-[#f4c86a]">Open source/content →</a> : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#f4c86a]/20 bg-[#f4c86a]/10 p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f4c86a]">RIGHTS & TRUST GATE</p>
            <p className="mt-3 leading-7 text-slate-100">No copyrighted music, sports broadcast or restricted media is treated as usable merely because a URL exists. Source verification and rights state are part of the database eligibility gate.</p>
          </article>
          <article className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">GLOBAL-LOCAL DESIGN</p>
            <p className="mt-3 leading-7 text-slate-100">The same feed contract can filter by language, country, category and domain, allowing one global system to expose a different relevant media front door in every region.</p>
          </article>
        </section>
      </section>
    </main>
  );
}
