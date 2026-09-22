import WaterMapNavigation from "../water-map-navigation";
import { getCyprusWaterGeospatialSourceSnapshot } from "@/core/water/cyprus-geospatial-source-registry";

export const metadata = {
  title: "Pantavion Water Cyprus GIS Federation",
  description:
    "Official Cyprus geospatial source federation for Pantavion Water: DLS, INSPIRE, Geological Survey and authorized district water-network imports.",
};

function badge(access: string) {
  if (access === "PUBLIC_OPEN") return "Public open";
  if (access === "PUBLIC_METADATA") return "Public metadata";
  if (access === "AUTHORIZED_ACCOUNT_REQUIRED") return "Authorized account";
  return "Authority agreement";
}

export default function CyprusWaterSourcesPage() {
  const snapshot = getCyprusWaterGeospatialSourceSnapshot();

  return (
    <>
      <WaterMapNavigation title="Cyprus GIS Federation" />
      <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d8b45f]">
              Cyprus Geospatial Federation
            </p>
            <h1 className="mt-4 text-3xl font-black md:text-5xl">
              Επίσημα γεωχωρικά δεδομένα Κύπρου + ιδιωτικά δίκτυα ΕΟΑ
            </h1>
            <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-300 md:text-base">
              Το Pantavion Water συνδέει επίσημα επίπεδα Κτηματολογίου, τοπογραφίας,
              υψομέτρων, φωτογραμμετρίας και γεωλογίας με ξεχωριστές ιδιωτικές πηγές
              δικτύων ύδρευσης. Τα master δίκτυα ΕΟΑ δεν γίνονται δημόσια: μπαίνουν
              μόνο με επίσημη εξουσιοδότηση και σε κινητό αποστέλλονται viewport
              derivatives ανά ρόλο.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {[
                ["Sources", snapshot.totalSources],
                ["Public/metadata", snapshot.publicOrMetadataSources],
                ["Authorized", snapshot.authorizedSources],
                ["EOA agreements", snapshot.authorityAgreementSources],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="mt-2 text-3xl font-black text-[#f3db9d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {snapshot.sources.map((source) => (
              <article key={source.id} className="rounded-[1.75rem] border border-white/10 bg-[#0a1629] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d8b45f]">
                    {source.owner}
                  </p>
                  <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-black text-slate-200">
                    {badge(source.access)}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-black">{source.title}</h2>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  {source.category} · {source.protocol} · {source.updatePolicy}
                </p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                  {source.notes.map((note) => <li key={note}>• {note}</li>)}
                </ul>
                {source.endpoint ? (
                  <a
                    href={source.endpoint}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block rounded-xl border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-sm font-black text-sky-100"
                  >
                    Άνοιγμα επίσημης πηγής
                  </a>
                ) : (
                  <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs font-bold text-amber-100">
                    Αναμένει επίσημο API/export ή συμφωνία διάθεσης δεδομένων από τον αντίστοιχο ΕΟΑ.
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
