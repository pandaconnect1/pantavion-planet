import Link from "next/link";
import { updateRecoveredPassword } from "../password-actions";

type SearchParams = Promise<{
  next?: string | string[];
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

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const nextPath = safeNextPath(firstParam(params.next));
  const error = firstParam(params.error);

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex min-h-[72vh] max-w-md items-center">
        <section className="w-full rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl sm:p-7">
          <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
            Νέος κωδικός
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">Όρισε νέο κωδικό πρόσβασης</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Χρησιμοποίησε τουλάχιστον 12 χαρακτήρες. Μετά την αλλαγή θα συνδεθείς ξανά και θα συνεχίσεις προς το Founder Recovery Control Room.
          </p>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100">
              {error === "invalid_password"
                ? "Οι κωδικοί πρέπει να είναι ίδιοι και να έχουν τουλάχιστον 12 χαρακτήρες."
                : "Η αλλαγή κωδικού απέτυχε. Το reset link μπορεί να έχει λήξει — ζήτησε νέο link."}
            </div>
          ) : null}

          <form action={updateRecoveredPassword} className="mt-6 space-y-5">
            <input type="hidden" name="next" value={nextPath} />
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="password">
                Νέος κωδικός
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                className="min-h-12 w-full rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="confirmPassword">
                Επιβεβαίωση νέου κωδικού
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                className="min-h-12 w-full rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>
            <button
              type="submit"
              className="min-h-12 w-full rounded-2xl bg-amber-300 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-amber-200"
            >
              Αποθήκευση νέου κωδικού
            </button>
          </form>

          <Link
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/15 px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
            href={`/auth/forgot-password?next=${encodeURIComponent(nextPath)}`}
          >
            Ζήτησε νέο reset link
          </Link>
        </section>
      </div>
    </main>
  );
}
