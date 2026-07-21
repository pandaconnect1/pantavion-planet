import { cookies } from "next/headers";

import {
  isWaterAdminSessionValue,
  WATER_ADMIN_SESSION_COOKIE,
} from "@/core/security/water-admin-session";

import WaterMapNavigation from "./water-map-navigation";

export const metadata = {
  title: "Pantavion Water Control Center",
  description:
    "Protected Pantavion Water entry for access requests, approved users, A Map, B Master and C Intelligent Map.",
};

const cards = [
  {
    title: "Administrator / Users Management",
    label: "ADMINISTRATOR",
    description:
      "Προστατευμένη διαχείριση Users με Approve, Reject και προσωρινό Delete / Block.",
    href: "/professional/infrastructure/water/admin/approvals",
    action: "Άνοιγμα Administrator",
    adminOnly: true,
  },
  {
    title: "Users / Access",
    label: "APPROVALS",
    description:
      "Αιτήσεις πρόσβασης και αυτόματος έλεγχος εγκεκριμένης συσκευής.",
    href: "/professional/infrastructure/water/access",
    action: "Άνοιγμα Users / Access",
  },
  {
    title: "A / B / C Maps",
    label: "MAP CENTER",
    description:
      "Καθαρό κέντρο για A live map, B Master DWG status και C Intelligent foundation.",
    href: "/professional/infrastructure/water/maps",
    action: "Άνοιγμα A / B / C",
  },
  {
    title: "A Map",
    label: "LIVE",
    description:
      "Ο σημερινός live χάρτης ύδρευσης για approved users. Δεν αλλάζει.",
    href: "/professional/infrastructure/water/live",
    action: "Άνοιγμα A Map",
  },
  {
    title: "B Master",
    label: "DWG STATUS",
    description:
      "Έλεγχος ότι το αυθεντικό DWG υπάρχει private, με manifest/chunks και raw download blocked.",
    href: "/professional/infrastructure/water/master",
    action: "Έλεγχος B Master",
    adminOnly: true,
  },
  {
    title: "B Map PDF Foundation",
    label: "PDF VIEW",
    description:
      "Protected read-only PDF derivative view from authentic B Master DWG vault. No raw DWG browser load or public file exposure.",
    href: "/professional/infrastructure/water/b-map",
    action: "Open B Map foundation",
  },
  {
    title: "C Intelligent",
    label: "FOUNDATION",
    description:
      "Το επόμενο επίπεδο για αλλαγές, βάνες, βλάβες, φωτογραφίες, οδούς, πίεση, PRV και τηλεμετρία.",
    href: "/professional/infrastructure/water/c",
    action: "Προβολή C",
  },
];

export default async function WaterControlCenterPage() {
  const cookieStore = await cookies();
  const isAdmin = isWaterAdminSessionValue(
    cookieStore.get(WATER_ADMIN_SESSION_COOKIE)?.value || "",
  );
  const visibleCards = cards.filter(
    (card) => !("adminOnly" in card && card.adminOnly) || isAdmin,
  );

  return (
    <>
      <WaterMapNavigation title="Water Control Center" />

      <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
        <section className="mx-auto max-w-6xl rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 shadow-2xl shadow-black/40 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d8b45f]">
            Pantavion Protected Water Access
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
            Water Control Center
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
            Καθαρή αρχική σελίδα για τη διαχείριση ύδρευσης. Από εδώ μπαίνεις
            σε users/access approvals, A Map, B Master DWG status και C
            Intelligent foundation. Τα δεδομένα χρηστών και οι εγκρίσεις δεν
            αλλάζουν από αυτή τη σελίδα.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleCards.map((card) => (
              <article
                key={card.href}
                className="rounded-3xl border border-white/10 bg-black/20 p-5"
              >
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d8b45f]">
                  {card.label}
                </p>

                <h2 className="mt-3 text-2xl font-black">{card.title}</h2>

                <p className="mt-4 min-h-[96px] text-sm leading-7 text-slate-300">
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

          <div className="mt-7 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
            Σημείωση: B και C δεν είναι ακόμα πλήρεις χάρτες γραμμών στο κινητό.
            B είναι private DWG master status. C είναι foundation. Το επόμενο
            πραγματικό βήμα είναι B derived protected view.
          </div>
        </section>
      </main>
    </>
  );
}
