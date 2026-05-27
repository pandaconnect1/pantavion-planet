import WaterMapNavigation from "../water-map-navigation";

export const metadata = {
  title: "Pantavion Water C Intelligent Map",
  description:
    "Foundation page for the future protected Pantavion Water C Intelligent Map.",
};

export default function WaterCIntelligentMapPage() {
  return (
    <>
      <WaterMapNavigation title="C Intelligent Map" />

      <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
        <section className="mx-auto max-w-4xl rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 shadow-2xl shadow-black/40 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d8b45f]">
            Pantavion Water C Intelligent Map
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
            C Intelligent Map Foundation
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
            Το C Map θα είναι ο έξυπνος επαγγελματικός χάρτης που θα συνδυάζει
            A Map, B Master DWG derived view, εγκεκριμένες αλλαγές πεδίου,
            φωτογραφίες, σημειώσεις, βλάβες, βάνες, οδούς, πίεση, PRV,
            ζώνες και μελλοντική τηλεμετρία.
          </p>

          <div className="mt-6 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="font-black text-[#d8b45f]">Field changes</p>
              <p className="mt-2 text-slate-300">
                Εργάτες, τεχνίτες και επιστάτες θα μπορούν να στέλνουν αλλαγές,
                αλλά θα γίνονται ορατές σε όλους μόνο μετά από founder approval.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="font-black text-[#d8b45f]">Street ledger</p>
              <p className="mt-2 text-slate-300">
                Μελλοντικό αρχείο ανά οδό για βάνες, επεκτάσεις, βλάβες,
                αναφορές, φωτογραφίες και ιστορικό.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="font-black text-[#d8b45f]">
                Engineering intelligence
              </p>
              <p className="mt-2 text-slate-300">
                Πίεση, ζώνες, PRV, ανάγκες βελτίωσης δικτύου και επαγγελματικές
                πληροφορίες θα μπουν σταδιακά.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="font-black text-[#d8b45f]">Protected access</p>
              <p className="mt-2 text-slate-300">
                Μόνο approved users. Κανένα raw DWG, κανένα public export,
                καμία αλλαγή master χωρίς έγκριση.
              </p>
            </div>
          </div>

          <a
            href="/professional/infrastructure/water/maps"
            className="mt-6 block rounded-2xl bg-[#d8b45f] px-5 py-3 text-center font-black text-[#07101e]"
          >
            Επιστροφή στα A / B / C Maps
          </a>
        </section>
      </main>
    </>
  );
}
