"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { signIn } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="min-h-12 w-full rounded-2xl bg-amber-300 px-4 py-3 text-base font-black text-slate-950 shadow-lg shadow-amber-300/10 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
      type="submit"
      disabled={pending}
    >
      {pending ? "Σύνδεση…" : "Σύνδεση"}
    </button>
  );
}

export default function LoginClient({ nextPath }: { nextPath: string }) {
  const forgotHref = `/auth/forgot-password?next=${encodeURIComponent(nextPath)}`;

  return (
    <form
      className="w-full rounded-3xl border border-white/10 bg-slate-950/75 p-5 shadow-2xl backdrop-blur-xl sm:p-7"
      action={signIn}
    >
      <input type="hidden" name="next" value={nextPath} />

      <div className="mb-6">
        <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
          Ασφαλής σύνδεση
        </span>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Σύνδεση στο Pantavion
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Συνδέσου με τον λογαριασμό σου για να συνεχίσεις στην προστατευμένη περιοχή διαχείρισης.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="email">
            Email
          </label>
          <input
            className="min-h-12 w-full rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/20"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-bold text-slate-200" htmlFor="password">
              Κωδικός πρόσβασης
            </label>
            <Link className="text-xs font-bold text-cyan-200 hover:text-cyan-100" href={forgotHref}>
              Ξέχασα τον κωδικό
            </Link>
          </div>
          <input
            className="min-h-12 w-full rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/20"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      <div className="mt-7 space-y-3">
        <SubmitButton />
        <Link
          className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/15 px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
          href="/auth/register"
        >
          Δημιουργία λογαριασμού
        </Link>
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-slate-500">
        Η σύνδεση προστατεύεται από Supabase authentication και το founder control απαιτεί επιπλέον επαλήθευση ασφαλείας.
      </p>
    </form>
  );
}
