import Link from "next/link";

export default function WaterAdminHelpInboxPage() {
  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <Link href="/professional/infrastructure/water/admin/approvals" className="text-sm font-black text-[#f2c766]">
          ← Πίσω στο κέντρο διοίκησης
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          PANTAVION WATER ADMIN HELP INBOX
        </p>

        <h1 className="mt-3 text-3xl font-black">Αιτήματα προς διαχειριστή</h1>

        <div className="mt-6 rounded-3xl border border-amber-400/40 bg-amber-950/20 p-5">
          <h2 className="text-xl font-black text-amber-100">Χρειάζεται πραγματική ταυτότητα admin</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-amber-50/90">
            Αυτή η σελίδα δεν εμφανίζει ιδιωτικά αιτήματα δημόσια και δεν ζητά token από τον χρήστη.
            Για να ανοίξει πραγματικό founder/admin inbox πρέπει πρώτα να συνδεθεί το Pantavion identity/session
            με ρόλο founder, admin, αρχιεπιστάτη ή άλλο εγκεκριμένο ρόλο.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card
            title="Τι θα βλέπει ο διαχειριστής"
            body="Όλα τα αιτήματα, σε ποιον πήγαν, ποιος τα είδε, τι εκκρεμεί και τι χρειάζεται χειροκίνητη προώθηση."
          />
          <Card
            title="Τι δεν κάνουμε εδώ"
            body="Δεν δείχνουμε private δεδομένα σε δημόσιο URL και δεν βάζουμε ορατό token στον άνθρωπο."
          />
          <Card
            title="Επόμενο πραγματικό βήμα"
            body="Σύνδεση με Pantavion user directory, ρόλους, session και δικαιώματα προβολής."
          />
          <Card
            title="Μετά"
            body="Πραγματική προώθηση σε επιστάτη, αρχιεπιστάτη, τεχνίτη, αποθήκη ή διοίκηση με ιστορικό."
          />
        </div>
      </section>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-3xl border border-slate-700 bg-[#07111f] p-4">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-300">{body}</p>
    </article>
  );
}
