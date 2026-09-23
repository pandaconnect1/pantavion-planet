import WaterMapNavigation from "./water-map-navigation";

export const metadata = {
  title: "Pantavion Water Professional Control Center",
  description:
    "Protected professional water-supply workspace for live network, maps, field operations, faults, warehouse, accounting, administration and engineering intelligence.",
};

const primary = [
  {
    title: "Live Network / Βρες με",
    label: "OPERATIONAL MAP",
    description:
      "GPS/geolocation, αναζήτηση διεύθυνσης και προστατευμένη τμηματική φόρτωση του πραγματικού δικτύου χωρίς να εκτίθεται ολόκληρο το master network στον browser.",
    href: "/professional/infrastructure/water/live",
    action: "Άνοιγμα Live Network",
  },
  {
    title: "Universal Map Intake",
    label: "ANY MAP FORMAT",
    description:
      "Private resumable upload για CAD/GIS/BIM/maps/documents και άγνωστα future formats. Raw preservation, πραγματική signature ταξινόμηση και adapter/conversion queue.",
    href: "/professional/infrastructure/water/maps/intake",
    action: "Ανέβασμα χάρτη / σχεδίου",
  },
  {
    title: "Users / Access",
    label: "CONTROLLED ACCESS",
    description:
      "Αίτηση πρόσβασης, approved-device έλεγχος και πραγματική Supabase-backed έγκριση πριν από πρόσβαση στο προστατευμένο δίκτυο.",
    href: "/professional/infrastructure/water/access",
    action: "Άνοιγμα Users / Access",
  },
  {
    title: "Administrator / Approvals",
    label: "ADMIN CONTROL",
    description:
      "Founder/admin είσοδος για έγκριση ή απόρριψη νέων χρηστών, ενεργές/μπλοκαρισμένες συσκευές και protected operational control.",
    href: "/professional/infrastructure/water/admin",
    action: "Άνοιγμα Administrator",
  },
  {
    title: "Maps A / B / C",
    label: "MAP CENTER",
    description:
      "Ξεχωριστές προστατευμένες εμπειρίες για operational, DWG/QGIS-compatible και engineering/intelligence map workflows.",
    href: "/professional/infrastructure/water/maps",
    action: "Άνοιγμα Map Center",
  },
];

const professional = [
  {
    title: "Cyprus GIS Federation",
    description:
      "Επίσημα DLS/Open Data επίπεδα για δρόμους, υδρογραφία, DTM/DSM/ισοϋψείς και γεωλογία, μαζί με private-authorized θέσεις για τα δίκτυα των 5 ΕΟΑ.",
    href: "/professional/infrastructure/water/cyprus",
  },
  {
    title: "Field Operations",
    description:
      "Καταχωρήσεις πεδίου, βλάβες, πιθανές βάνες, δρόμοι, βάθη, υλικά σωλήνων και τεκμήρια από κινητό.",
    href: "/professional/infrastructure/water/field",
  },
  {
    title: "Supervisor Workspace",
    description:
      "Εργασίες επιστάτη, operational oversight, συνεργεία και εποπτεία πραγματικών field records.",
    href: "/professional/infrastructure/water/supervisor",
  },
  {
    title: "Chief / Engineering",
    description:
      "Ανώτερη τεχνική εικόνα, αποφάσεις, engineering workflow και συντονισμός δικτύου.",
    href: "/professional/infrastructure/water/chief",
  },
  {
    title: "Fault Management",
    description:
      "Πραγματική ροή βλαβών και operational records για τεχνική διαχείριση.",
    href: "/professional/infrastructure/water/faults",
  },
  {
    title: "Warehouse",
    description:
      "Αποθήκη και υλικά ύδρευσης ως ξεχωριστό επαγγελματικό workspace.",
    href: "/professional/infrastructure/water/warehouse",
  },
  {
    title: "Accounting / Cost",
    description:
      "Οικονομική/λογιστική επιφάνεια για κόστος και επαγγελματική διοικητική συνέχεια.",
    href: "/professional/infrastructure/water/accounting",
  },
  {
    title: "HR / Personnel",
    description:
      "Προσωπικό, ρόλοι και διοικητική υποστήριξη μέσα στο Water επαγγελματικό οικοσύστημα.",
    href: "/professional/infrastructure/water/hr",
  },
  {
    title: "Water Intelligence",
    description:
      "Υδραυλική, terrain/pressure/demand intelligence και engineering foundations για βελτίωση/σχεδιασμό δικτύου.",
    href: "/professional/infrastructure/water/intelligence",
  },
  {
    title: "Workspaces",
    description:
      "Role-based επαγγελματικές επιφάνειες για τεχνίτη, επιστάτη, chief, warehouse, accounting, HR και help.",
    href: "/professional/infrastructure/water/workspaces",
  },
  {
    title: "Help / Collaboration",
    description:
      "Help requests και συνεργασία χρηστών με protected inbox flows.",
    href: "/professional/infrastructure/water/help",
  },
  {
    title: "Admin / Approvals",
    description:
      "Founder/admin διαχείριση access requests, approved/blocked devices, field submissions και fault approvals.",
    href: "/professional/infrastructure/water/admin/approvals",
  },
  {
    title: "Source / Readiness",
    description:
      "Source truth, master DWG/readiness και τεχνικά evidence surfaces χωρίς δημόσια έκθεση του raw master.",
    href: "/professional/infrastructure/water/readiness",
  },
];

export default function WaterControlCenterPage() {
  return (
    <>
      <WaterMapNavigation title="Water Professional Control Center" />

      <main className="min-h-screen bg-[#06101f] px-3 py-5 text-white sm:px-4 sm:py-6">
        <section className="mx-auto max-w-7xl rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 shadow-2xl shadow-black/40 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[#d8b45f]">
                Pantavion Professional Water
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                Water Supply Operating System
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">
                Ενιαίο προστατευμένο εργαλείο για live network, χαρτογράφηση,
                τεχνικές εργασίες, βλάβες, αποθήκη, κόστος, προσωπικό και
                engineering intelligence. Κάθε surface πιο κάτω είναι πραγματικό
                route του σημερινού Pantavion — όχι placeholder.
              </p>
            </div>
            <a
              href="/professional/infrastructure/water/live"
              className="rounded-2xl bg-emerald-400 px-6 py-4 text-center text-sm font-black text-emerald-950"
            >
              Βρες με στο δίκτυο →
            </a>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {primary.map((card) => (
              <article
                key={card.href}
                className="rounded-3xl border border-[#d8b45f]/25 bg-black/20 p-5"
              >
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d8b45f]">
                  {card.label}
                </p>
                <h2 className="mt-3 text-2xl font-black">{card.title}</h2>
                <p className="mt-4 min-h-[120px] text-sm leading-7 text-slate-300">
                  {card.description}
                </p>
                <a
                  href={card.href}
                  className="mt-5 block rounded-2xl bg-[#d8b45f] px-4 py-3 text-center text-sm font-black text-[#07101e]"
                >
                  {card.action}
                </a>
              </article>
            ))}
          </div>

          <div className="mt-8 border-t border-white/10 pt-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                  Professional Modules
                </p>
                <h2 className="mt-2 text-2xl font-black md:text-3xl">
                  Τεχνική + διοικητική + οικονομική λειτουργία
                </h2>
              </div>
              <a
                href="/professional/infrastructure/water/maps/intake"
                className="rounded-2xl border border-cyan-400/50 px-5 py-3 text-sm font-black text-cyan-100"
              >
                Universal Map Intake
              </a>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {professional.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-300/40 hover:bg-cyan-950/20"
                >
                  <h3 className="text-lg font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-950/10 p-5">
            <h2 className="text-xl font-black text-cyan-100">
              Map truth & safety
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Το raw master network παραμένει private. Ο browser λαμβάνει μόνο
              εξουσιοδοτημένα τμήματα του δικτύου. Νέα map/CAD/GIS αρχεία
              αποθηκεύονται πρώτα αυτούσια και δεν αλλάζουν canonical network
              geometry πριν από verification, georeferencing/CRS validation,
              review και derived-layer promotion.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
