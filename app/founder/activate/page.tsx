import Link from "next/link";

import { sendFounderActivationEmail } from "./actions";

const FOUNDER_EMAIL = "info.pandaconnect@gmail.com";

type SearchParams = Promise<{
  sent?: string | string[];
  error?: string | string[];
}>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FounderActivatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sent = firstParam(params.sent) === "1";
  const error = firstParam(params.error);

  const errorText: Record<string, string> = {
    founder_email_mismatch:
      "Για Founder ενεργοποίηση επιτρέπεται μόνο το επίσημο Pantavion email.",
    email_delivery_failed:
      "Δεν στάλθηκε email ενεργοποίησης. Έλεγξε τη ρύθμιση αποστολής email και δοκίμασε ξανά.",
    claim_failed:
      "Η επιβεβαίωση email ολοκληρώθηκε αλλά δεν αποδόθηκε Founder role.",
    founder_already_bound:
      "Υπάρχει ήδη διαφορετικό ενεργό Founder identity. Δεν έγινε καμία αλλαγή.",
    founder_session_not_configured:
      "Το production runtime δεν έχει ακόμη τα Founder/Admin session secrets.",
  };

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-10 text-white">
      <section className="mx-auto w-full max-w-lg rounded-3xl border border-[#f2c766]/40 bg-[#0d1a2d] p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          Pantavion Founder
        </p>
        <h1 className="mt-3 text-3xl font-black">Ενεργοποίηση email + κωδικού</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
          Μία φορά επιβεβαιώνεις το επίσημο Founder email. Μετά το ασφαλές link
          θα ορίσεις κωδικό και από εκεί και πέρα θα μπαίνεις από οποιαδήποτε
          συσκευή με email + κωδικό.
        </p>

        {sent ? (
          <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-950/30 p-4 text-sm font-bold leading-6 text-emerald-100">
            Στάλθηκε ασφαλές email ενεργοποίησης στο {FOUNDER_EMAIL}. Άνοιξε το
            link από το email. Θα μεταφερθείς για να ορίσεις νέο κωδικό.
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-400/40 bg-red-950/30 p-4 text-sm font-bold leading-6 text-red-100">
            {errorText[error] || "Η Founder ενεργοποίηση δεν ολοκληρώθηκε."}
          </div>
        ) : null}

        <form action={sendFounderActivationEmail} className="mt-6 space-y-4">
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Founder email</span>
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              defaultValue={FOUNDER_EMAIL}
              className="min-h-12 rounded-2xl border border-slate-600 bg-[#07111f] px-4 py-3 text-base text-white outline-none focus:border-[#f2c766]"
            />
          </label>

          <button
            type="submit"
            className="min-h-12 w-full rounded-2xl bg-[#f2c766] px-5 py-3 text-base font-black text-black"
          >
            Στείλε ασφαλές email ενεργοποίησης
          </button>
        </form>

        <Link
          href="/auth/login"
          className="mt-4 flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-4 py-3 text-center font-black text-white"
        >
          Πίσω στη σύνδεση
        </Link>
      </section>
    </main>
  );
}
