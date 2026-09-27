import WaterMapNavigation from "../water-map-navigation";

export const metadata = {
  title: "Pantavion Water Source Maps + Intelligence",
  description:
    "Protected entry for Map A, canonical Map B, legacy Map B and C engineering intelligence.",
};

const sourceMaps = [
  {
    label: "SOURCE MAP 1",
    title: "Map A — Live Operational",
    status: "Operational",
    description:
      "Ο προστατευμένος λειτουργικός χάρτης ύδρευσης για καθημερινή εργασία πεδίου, approved users και segmented viewport loading.",
    href: "/professional/infrastructure/water/live",
    action: "Άνοιγμα Map A",
  },
  {
    label: "SOURCE MAP 2",
    title: "Map B — Canonical DWG",
    status: "Canonical source",
    description:
      "Derived επαγγελματική προβολή του canonical DWG ANDREASPAP 2026. Το raw master παραμένει ιδιωτικό και δεν φορτώνεται στον browser.",
    href: "/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap",
    action: "Άνοιγμα Canonical B",
  },
  {
    label: "SOURCE MAP 3",
    title: "Map B — Legacy DWG",
    status: "Legacy candidate",
    description:
      "Ξεχωριστή derived προβολή του παλαιότερου GEORGE DWG για σύγκριση. Δεν αντικαθιστά και δεν γράφει πάνω στον canonical χάρτη.",
    href: "/professional/infrastructure/water/master-b-mobile?sourceKey=legacy-george-85m",
    action: "Άνοιγμα Legacy B",
  },
] as const;

export default function WaterMapsPage() {
  return (
    <>
      <WaterMapNavigation title="Pantavion Water Maps" />

      <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
        <section className="mx-auto max-w-6xl rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 shadow-2xl shadow-black/40 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d8b45f]">
            Pantavion Protected Water GIS
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
            3 Source Maps
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">
            Οι τρεις πραγματικές πηγές μένουν ξεχωριστές και immutable: Map A,
            canonical Map B και legacy Map B. Οι αλλαγές πεδίου, evidence και
            approved spatial patches μπορούν να προβληθούν ως overlays χωρίς να
            αλλοιώνεται κανένα original source.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {sourceMaps.map((card) => (
              <article
                key={card.title}
                className="rounded-3xl border border-white/10 bg-black/20 p-5"
              >
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d8b45f]">
                  {card.label}
                </p>

                <h2 className="mt-3 text-2xl font-black">{card.title}</h2>

                <p className="mt-2 rounded-full border border-[#d8b45f]/30 bg-[#d8b45f]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#f3db9d]">
                  {card.status}
                </p>

                <p className="mt-4 min-h-[112px] text-sm leading-7 text-slate-300">
                  {card.description}
                </p>

                <a
                  href={card.href}
                  className="mt-5 block rounded-2xl border border-[#d8b45f]/50 bg-[#d8b45f] px-4 py-3 text-center text-sm font-black text-[#07101e] transition hover:bg-[#f0cf78]"
                >
                  {card.action}
                </a>
              </article>
            ))}
          </div>

          <section className="mt-7 rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
              Engineering intelligence
            </p>
            <h2 className="mt-2 text-2xl font-black">C Intelligent Map</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-cyan-50/80">
              Το C δεν είναι τέταρτο original source. Είναι engineering/intelligence
              view που συνδυάζει approved δεδομένα από τους source maps με
              υψόμετρα, πίεση, ζώνες, PRV, βλάβες, φωτογραφίες, spatial patches και
              μελλοντική τηλεμετρία.
            </p>
            <a
              href="/professional/infrastructure/water/c"
              className="mt-4 inline-block rounded-2xl border border-cyan-300/40 bg-cyan-200 px-4 py-3 text-sm font-black text-[#06101f]"
            >
              Άνοιγμα C Intelligence
            </a>
          </section>

          <div className="mt-7 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-100">
            Τα Map B source views χρησιμοποιούν browser-safe derived geometry.
            Raw DWG download παραμένει founder/admin-only, δεν υπάρχει public
            master και δεν γίνεται full raw dataset load στον browser.
          </div>

          <div className="mt-4 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
            Overlay πάνω σε Κτηματολόγιο/οδοποιία ενεργοποιείται μόνο όταν το
            συγκεκριμένο source έχει τεκμηριωμένο CRS ή control-point alignment.
            Source-CAD preview δεν βαφτίζεται γεωγραφικά ακριβές πριν την
            επαλήθευση.
          </div>
        </section>
      </main>
    </>
  );
}
