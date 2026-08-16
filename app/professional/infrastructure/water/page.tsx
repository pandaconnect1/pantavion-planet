import WaterMapNavigation from "./water-map-navigation";

export const metadata = {
  title: "Pantavion Water Control Center",
  description:
    "Protected Pantavion Water entry for approved users, access management and separate A, B and C water maps.",
};

const cards = [
  {
    title: "Administrator / Users Management",
    label: "ADMINISTRATOR",
    description:
      "Προστατευμένη είσοδος Administrator και διαχείριση Users με πραγματικά Approve, Reject και Delete / Block controls.",
    href: "/professional/infrastructure/water/admin",
    action: "Σύνδεση / Άνοιγμα Administrator",
  },
  {
    title: "Users / Access",
    label: "LIVE ACCESS",
    description:
      "Αιτήσεις πρόσβασης και πραγματικός έλεγχος εγκεκριμένης συσκευής πριν από πρόσβαση στο δίκτυο.",
    href: "/professional/infrastructure/water/access",
    action: "Άνοιγμα Users / Access",
  },
  {
    title: "A / B / C Water Maps",
    label: "MAP CENTER",
    description:
      "Ξεχωριστή επιλογή χαρτών. A = ο υπάρχων live operational χάρτης. B = ο νέος DWG/QGIS-compatible Map B. C = ξεχωριστό intelligent engineering workspace.",
    href: "/professional/infrastructure/water/maps",
    action: "Επιλογή Map A / B / C",
  },
  {
    title: "A Live Water Map",
    label: "MAP A • LIVE",
    description:
      "Ο υπάρχων προστατευμένος Map A για approved users, με ασφαλή τμηματική φόρτωση σωληνώσεων. Δεν αλλάζει από την υλοποίηση του Map B.",
    href: "/professional/infrastructure/water/live",
    action: "Άνοιγμα Map A",
  },
];

export default function WaterControlCenterPage() {
  return (
    <>
      <WaterMapNavigation title="Water Control Center" />

      <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
        <section className="mx-auto max-w-6xl rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 shadow-2xl shadow-black/40 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d8b45f]">
            Pantavion Protected Water
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
            Water Control Center
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
            Οι χάρτες A, B και C είναι ξεχωριστές προστατευμένες εμπειρίες. Ο Map A παραμένει ανέγγιχτος. Ο Map B υλοποιείται από το πραγματικό DWG με QGIS-compatible γεωαναφορά, GPS/GNSS και αναζήτηση οδού. Ο Map C παραμένει ξεχωριστό intelligent engineering workspace και δεν συγχέεται με τον B.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <article
                key={card.href}
                className="rounded-3xl border border-white/10 bg-black/20 p-5"
              >
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d8b45f]">
                  {card.label}
                </p>

                <h2 className="mt-3 text-2xl font-black">{card.title}</h2>

                <p className="mt-4 min-h-[120px] text-sm leading-7 text-slate-300">
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
        </section>
      </main>
    </>
  );
}
