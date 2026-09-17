import Link from "next/link";
import { requestPasswordReset } from "../password-actions";

type SearchParams = Promise<{
  next?: string | string[];
  sent?: string | string[];
  error?: string | string[];
}>;

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin/pantavion/recovery";
  }
  return value;
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const nextPath = safeNextPath(firstParam(params.next));
  const sent = firstParam(params.sent) === "1";
  const error = firstParam(params.error);

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex min-h-[72vh] max-w-md items-center">
        <section className="w-full rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl sm:p-7">
          <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
            Ανάκτηση πρόσβασης
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">Ξέχασες τον κωδικό;</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Βάλε το email του Pantavion λογαριασμού σου. Θα σταλεί ασφαλές link για να ορίσεις νέο κωδικό.
          </p>

          {sent ? (
            <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">
              Αν το email αντιστοιχεί σε λογαριασμό, στάλθηκε link επαναφοράς. Έλεγξε και τον φάκελο ανεπιθύμητης αλληλογραφίας.
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100">
              {error === "session_expired"
                ? "Το link επαναφοράς έληξε ή δεν είναι πλέον έγκυρο. Ζήτησε νέο link."
                : "Δεν ήταν δυνατή η αποστολή reset αυτή τη στιγμή. Δοκίμασε ξανά σε λίγο."}
            </div>
          ) : null}

          <form action={requestPasswordReset} className="mt-6 space-y-5">
            <input type="hidden" name="next" value={nextPath} />
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                className="min-h-12 w-full rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>
            <button
              type="submit"
              className="min-h-12 w-full rounded-2xl bg-amber-300 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-amber-200"
            >
              Στείλε link επαναφοράς
            </button>
          </form>

          <Link
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/15 px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
            href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
          >
            Πίσω στη σύνδεση
          </Link>
        </section>
      </div>
    </main>
  );
}
