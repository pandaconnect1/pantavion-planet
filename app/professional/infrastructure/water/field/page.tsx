import Link from "next/link";

const FIELD_ACTIONS = [
  {
    href: "/professional/infrastructure/water/field/arrival",
    label: "Άφιξη",
    description: "Καταγραφή άφιξης στο σημείο εργασίας.",
  },
  {
    href: "/professional/infrastructure/water/field/departure",
    label: "Αναχώρηση",
    description: "Καταγραφή αναχώρησης από το σημείο εργασίας.",
  },
  {
    href: "/professional/infrastructure/water/field/fault",
    label: "Νέα βλάβη",
    description: "Αναφορά βλάβης ή ζημιάς στο δίκτυο.",
  },
  {
    href: "/professional/infrastructure/water/field/valve",
    label: "Πιθανή βάνα",
    description: "Καταγραφή πιθανής βάνας ή σημείου απομόνωσης.",
  },
  {
    href: "/professional/infrastructure/water/field/photo",
    label: "Φωτογραφία",
    description: "Καταγραφή φωτογραφικού τεκμηρίου.",
  },
  {
    href: "/professional/infrastructure/water/field/audio",
    label: "Ηχητική σημείωση",
    description: "Καταγραφή ηχητικής περιγραφής ή σημείωσης.",
  },
  {
    href: "/professional/infrastructure/water/field/material",
    label: "Υλικά",
    description: "Καταγραφή υλικών που χρησιμοποιήθηκαν ή χρειάζονται.",
  },
  {
    href: "/professional/infrastructure/water/field/note",
    label: "Παρατήρηση",
    description: "Απλή σημείωση πεδίου.",
  },
] as const;

export default function WaterFieldMenuPage() {
  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          PANTAVION ΥΔΡΕΥΣΗ
        </p>

        <h1 className="mt-3 text-3xl font-black">Εργασία πεδίου</h1>

        <p className="mt-3 text-sm font-bold text-slate-300">
          Διάλεξε εργασία. Κάθε επιλογή ανοίγει πραγματική σελίδα καταχώρησης.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {FIELD_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-5 py-4 transition hover:border-[#f2c766]/70 hover:bg-[#101f35]"
            >
              <span className="block text-xl font-black text-white">{action.label}</span>
              <span className="mt-2 block text-sm leading-5 text-slate-300">{action.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}