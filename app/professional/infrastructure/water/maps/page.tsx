import WaterMapNavigation from "../water-map-navigation";

export const metadata = {
  title: "Pantavion Water A B C Maps",
  description:
    "Protected mobile entry for Pantavion Water A Map, B Master DWG and C Intelligent Map.",
};

const cards = [
  {
    label: "A MAP",
    title: "Live Operational Map",
    status: "Ενεργό",
    description:
      "Ο σημερινός προστατευμένος live χάρτης ύδρευσης για approved users. Δεν αντικαθίσταται και δεν φορτώνει raw DWG.",
    href: "/professional/infrastructure/water/live",
    action: "Άνοιγμα A Map",
  },
  {
    label: "B MASTER",
    title: "Authentic DWG Master",
    status: "Private vault connected",
    description:
      "Το αυθεντικό DWG βρίσκεται σε private vault. Δεν κατεβαίνει raw, δεν είναι public, δεν φορτώνει ολόκληρο στο κινητό.",
    href: "/professional/infrastructure/water/master",
    action: "Έλεγχος B Master",
  },
  {
    label: "C INTELLIGENT",
    title: "Intelligent Engineering Map",
    status: "Foundation",
    description:
      "Το επόμενο έξυπνο επίπεδο για αλλαγές, βάνες, βλάβες, φωτογραφίες, σημειώσεις, οδούς, πίεση, PRV και τηλεμετρία.",
    href: "/professional/infrastructure/water/c",
    action: "Προβολή C Foundation",
  },
];

export default function WaterAbcMapsPage() {
  return (
    <>
      <WaterMapNavigation title="A / B / C Water Maps" />

      <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
        <section className="mx-auto max-w-5xl rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 shadow-2xl shadow-black/40 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d8b45f]">
            Pantavion Protected Water Maps
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
            A / B / C Water Maps
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
            Καθαρό κέντρο πλοήγησης για τους προστατευμένους χάρτες ύδρευσης:
            A Map για τον σημερινό live χάρτη, B Master για το αυθεντικό DWG
            private vault και C Intelligent για το επόμενο έξυπνο επαγγελματικό
            επίπεδο.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <article
                key={card.label}
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

          <div className="mt-7 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-100">
            Status: A Map παραμένει το λειτουργικό map. B Master DWG είναι
            private connected source. C Intelligent Map είναι το επόμενο στάδιο
            για derived protected intelligence view.
          </div>

          <div className="mt-4 rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-7 text-red-100">
            Protection: Δεν υπάρχει raw DWG download, δεν υπάρχει public master,
            δεν υπάρχει browser full network load και καμία αλλαγή master δεν
            γίνεται χωρίς founder approval.
          </div>
        </section>
      </main>
    </>
  );
}
