import { cookies } from "next/headers";

import {
  isWaterAdminSessionValue,
  WATER_ADMIN_SESSION_COOKIE,
} from "@/core/security/water-admin-session";

import WaterMapNavigation from "./water-map-navigation";

export const metadata = {
  title: "Pantavion Water Control Center",
  description:
    "Protected Pantavion Water entry for approved users, access management and the live water network map.",
};

const cards = [
  {
    title: "Administrator / Users Management",
    label: "ADMINISTRATOR",
    description:
      "Προστατευμένη διαχείριση Users με πραγματικά Approve, Reject και Delete / Block controls.",
    href: "/professional/infrastructure/water/admin/approvals",
    action: "Άνοιγμα Administrator",
    adminOnly: true,
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
    title: "A Live Water Map",
    label: "LIVE MAP",
    description:
      "Ο ενεργός προστατευμένος χάρτης ύδρευσης για approved users, με ασφαλή τμηματική φόρτωση σωληνώσεων.",
    href: "/professional/infrastructure/water/live",
    action: "Άνοιγμα A Live Map",
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
            Pantavion Protected Water
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
            Water Control Center
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
            Εδώ εμφανίζονται μόνο οι λειτουργίες του Water που είναι πραγματικά ενεργές σήμερα. Foundations και μελλοντικοί χάρτες παραμένουν κρυμμένοι από το production μέχρι να ολοκληρωθούν.
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
        </section>
      </main>
    </>
  );
}
