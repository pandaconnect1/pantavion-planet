import WaterMapNavigation from "../water-map-navigation";

export const metadata = {
  title: "Pantavion Water A B C Maps",
  description:
    "Protected mobile entry for Pantavion Water A Map, B Derived Map and C Intelligent Map.",
};

const cards = [
  {
    label: "A MAP",
    title: "Live Operational Map",
    status: "Ενεργό",
    description:
      "Ο σημερινός προστατευμένος live χάρτης ύδρευσης για approved users. Καθημερινή λειτουργική χρήση και φόρτωση ελεγχόμενων τμημάτων.",
    href: "/professional/infrastructure/water/live",
    action: "Άνοιγμα A Map",
  },
  {
    label: "B MAP",
    title: "B Derived Protected Map",
    status: "Real preview",
    description:
      "Πρώτη προστατευμένη B προβολή πάνω σε οδικό υπόβαθρο, για έλεγχο δικτύου/αγωγών χωρίς raw DWG και χωρίς full browser load.",
    href: "/professional/infrastructure/water/b",
    action: "Άνοιγμα B Map",
  },
  {
    label: "C MAP",
    title: "C Intelligent Map",
    status: "Intelligence preview",
    description:
      "C workspace για υψόμετρα, πίεση, ζώνες, PRV, βλάβες, αλλαγές πεδίου, φωτογραφίες και μελλοντική τηλεμετρία.",
    href: "/professional/infrastructure/water/c",
    action: "Άνοιγμα C Map",
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
            A για λειτουργία πεδίου, B για derived protected network view και C
            για έξυπνη engineering προβολή.
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
            B και C φορτώνουν protected network segments από το υπάρχον
            ασφαλές API. Δεν υπάρχει raw DWG download, δεν υπάρχει public master
            και δεν γίνεται πλήρες browser load.
          </div>

          <div className="mt-4 rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-7 text-red-100">
            Τα C engineering layers δεν είναι τελικές μετρήσεις πίεσης ή
            υψομέτρων μέχρι να συνδεθούν επίσημες πηγές, field data και
            founder/engineer approval.
          </div>
        </section>
      </main>
    </>
  );
}