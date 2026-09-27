import WaterMapNavigation from "../water-map-navigation";

export const metadata = {
  title: "Pantavion Water Map Workspace",
  description:
    "Authentic Water source maps with explicit live/verified/not-ingested truth, plus a separate engineering intelligence workspace.",
};

const sourceMaps = [
  {
    label: "SOURCE MAP 1",
    title: "Map A — Live Operational",
    status: "AUTHENTIC · LIVE",
    description:
      "Αυθεντικό operational δίκτυο σε production κατάσταση ready_exact. Ο browser λαμβάνει μόνο ασφαλή segmented viewport τμήματα.",
    href: "/professional/infrastructure/water/maps/workspace?source=A",
    action: "Άνοιγμα στο Workspace",
  },
  {
    label: "SOURCE MAP 2",
    title: "Map B — Canonical DWG",
    status: "AUTHENTIC · BYTE VERIFIED · NOT LIVE YET",
    description:
      "Το αυθεντικό canonical DWG ANDREASPAP 2026 έχει επαληθευτεί byte-for-byte (size, SHA-256, AC1032). Δεν θεωρείται production-live μέχρι να ολοκληρωθούν private Storage ingest, server verification, versioning και derived delivery.",
    href: "/professional/infrastructure/water/maps/workspace?source=B_CANONICAL",
    action: "Άνοιγμα στο Workspace",
  },
  {
    label: "SOURCE MAP 3",
    title: "Map B — Legacy DWG",
    status: "AUTHENTIC · BYTE VERIFIED · NOT LIVE YET",
    description:
      "Το αυθεντικό legacy GEORGE 85.7 MB DWG έχει επαληθευτεί byte-for-byte και παραμένει ξεχωριστό από το canonical master. Δεν θεωρείται production-live πριν από ingest/versioning/derived delivery.",
    href: "/professional/infrastructure/water/maps/workspace?source=B_LEGACY",
    action: "Άνοιγμα στο Workspace",
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
            Αυθεντικές Πηγές · Καθαρό Runtime Truth
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">
            Κάθε χάρτης που ονομάζουμε source/master πρέπει να έχει αυθεντικό
            αρχείο ή authoritative provider feed και επαληθευμένη ταυτότητα.
            Το Map A είναι live. Τα δύο αυθεντικά DWG έχουν byte-level verification,
            αλλά μέχρι να ολοκληρωθεί το production ingest δεν παρουσιάζονται ως live.
            Derived/intelligence workspaces εμφανίζονται ξεχωριστά και δεν βαφτίζονται master maps.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/professional/infrastructure/water/maps/workspace"
              className="inline-block rounded-2xl bg-[#f2c766] px-5 py-3 text-sm font-black text-[#07101e]"
            >
              Άνοιγμα Water Map Workspace
            </a>
            <a
              href="/professional/infrastructure/water/location"
              className="inline-block rounded-2xl border border-cyan-300/40 bg-cyan-950/30 px-5 py-3 text-sm font-black text-cyan-100"
            >
              GPS · Διεύθυνση · Πήγαινέ με
            </a>
            <a
              href="/professional/infrastructure/water/infrastructure"
              className="inline-block rounded-2xl border border-emerald-300/40 bg-emerald-950/30 px-5 py-3 text-sm font-black text-emerald-100"
            >
              Utility Layers · Field Check
            </a>
          </div>

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

          <section className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d8b45f]">
              Αυτούσια προβολή
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Αυθεντικό DWG και ξεχωριστό Engineering Workspace
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
              Το Map B ανοίγει μόνο όταν το ακριβές verified DWG υπάρχει στο
              private production storage. Το Engineering Workspace είναι αναλυτική
              επιφάνεια πάνω από εγκεκριμένα source δεδομένα και δεν είναι τρίτο master.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/professional/infrastructure/water/b"
                className="rounded-2xl border border-emerald-400/40 bg-emerald-950/30 px-4 py-3 text-sm font-black text-emerald-100"
              >
                Map B · Authentic DWG
              </a>

              <a
                href="/professional/infrastructure/water/master-b-mobile?sourceKey=canonical-2026-andreaspap"
                className="rounded-2xl border border-[#d8b45f]/50 bg-[#d8b45f]/10 px-4 py-3 text-sm font-black text-[#f3db9d]"
              >
                Map B · Mobile Derived
              </a>

              <a
                href="/professional/infrastructure/water/c"
                className="rounded-2xl border border-cyan-400/40 bg-cyan-950/30 px-4 py-3 text-sm font-black text-cyan-100"
              >
                Engineering Intelligence
              </a>
            </div>
          </section>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/professional/infrastructure/water/maps/compare"
              className="rounded-2xl border border-[#d8b45f]/50 bg-[#d8b45f] px-4 py-3 text-sm font-black text-[#07101e]"
            >
              Desktop / Admin Compare
            </a>
            <a
              href="/professional/infrastructure/water/admin/alignment"
              className="rounded-2xl border border-cyan-300/40 bg-cyan-950/30 px-4 py-3 text-sm font-black text-cyan-100"
            >
              Alignment / Georeferencing
            </a>
          </div>

          <section className="mt-7 rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
              Engineering intelligence
            </p>
            <h2 className="mt-2 text-2xl font-black">Engineering Intelligence Workspace</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-cyan-50/80">
              Το engineering/intelligence workspace δεν είναι original source map.
              Συνδυάζει μόνο approved δεδομένα από αυθεντικές πηγές με υψόμετρα,
              πίεση, ζώνες, PRV, βλάβες, φωτογραφίες, spatial patches και μελλοντική
              τηλεμετρία. Αν προστεθεί μελλοντικά Map C/D/E/F, θα απαιτεί δικό του
              αυθεντικό source artifact ή authoritative feed πριν ονομαστεί master.
            </p>
            <a
              href="/professional/infrastructure/water/c"
              className="mt-4 inline-block rounded-2xl border border-cyan-300/40 bg-cyan-200 px-4 py-3 text-sm font-black text-[#06101f]"
            >
              Άνοιγμα Engineering Workspace
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
