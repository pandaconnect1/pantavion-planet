import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  PANTAVION_FOUNDER_SESSION_COOKIE,
  validatePantavionFounderSessionValue,
} from "@/core/security/pantavion-founder-session";
import {
  isWaterAdminSessionValue,
  WATER_ADMIN_SESSION_COOKIE,
} from "@/core/security/water-admin-session";
import { hasSupabaseAdminCredential } from "@/lib/supabase/admin";

import { inviteFounderIdentity } from "./actions";

type SearchParams = Promise<{
  sent?: string | string[];
  error?: string | string[];
}>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FounderAccountSetupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const cookieStore = await cookies();
  const founderSession = cookieStore.get(PANTAVION_FOUNDER_SESSION_COOKIE)?.value || "";
  const waterAdminSession = cookieStore.get(WATER_ADMIN_SESSION_COOKIE)?.value || "";

  const authorized =
    validatePantavionFounderSessionValue(founderSession) ||
    isWaterAdminSessionValue(waterAdminSession);

  if (!authorized) {
    const next = encodeURIComponent("/founder/account-setup");
    redirect(`/professional/infrastructure/water/admin/access?next=${next}`);
  }

  const params = await searchParams;
  const sent = firstParam(params.sent) === "1";
  const error = firstParam(params.error);
  const adminCredentialReady = hasSupabaseAdminCredential();

  const errorText: Record<string, string> = {
    invalid_email: "Το email δεν είναι έγκυρο.",
    admin_credential_missing:
      "Το production runtime δεν έχει διαθέσιμο Supabase admin credential.",
    invite_failed:
      "Δεν δημιουργήθηκε Founder identity ούτε βρέθηκε υπάρχων λογαριασμός.",
    email_delivery_failed:
      "Ο λογαριασμός υπάρχει αλλά δεν στάλθηκε email ενεργοποίησης/reset.",
    role_assignment_failed:
      "Δημιουργήθηκε Auth identity αλλά δεν ολοκληρώθηκε η απόδοση Founder role.",
  };

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-8 text-white">
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-[#f2c766]/40 bg-[#0d1a2d] p-5 shadow-2xl sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f2c766]">
          Pantavion Founder Identity
        </p>
        <h1 className="mt-3 text-3xl font-black">
          Ενεργοποίηση email + κωδικού
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
          Αυτή είναι one-time διαδικασία. Βάζεις το email που θα χρησιμοποιείς ως
          Founder. Το Pantavion στέλνει ασφαλές email ενεργοποίησης. Από το link
          ορίζεις τον κωδικό σου και μετά συνδέεσαι πάντα με email + κωδικό.
        </p>

        <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-950/20 p-4 text-sm font-bold text-cyan-100">
          Supabase admin runtime: {adminCredentialReady ? "Configured" : "Not configured"}
        </div>

        {sent ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-950/30 p-4 text-sm font-bold leading-6 text-emerald-100">
            Το Founder identity καταχωρίστηκε. Έλεγξε το email σου, άνοιξε το
            ασφαλές link και όρισε νέο κωδικό. Μετά μπες από τη σελίδα Σύνδεσης
            με email + κωδικό.
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-950/30 p-4 text-sm font-bold leading-6 text-red-100">
            {errorText[error] || "Η ενεργοποίηση δεν ολοκληρώθηκε."}
          </div>
        ) : null}

        <form action={inviteFounderIdentity} className="mt-6 space-y-4">
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Founder email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="email@example.com"
              className="min-h-12 rounded-2xl border border-slate-600 bg-[#07111f] px-4 py-3 text-base text-white outline-none focus:border-[#f2c766]"
            />
          </label>

          <button
            type="submit"
            disabled={!adminCredentialReady}
            className="min-h-12 w-full rounded-2xl bg-[#f2c766] px-5 py-3 text-base font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Στείλε ασφαλές email ενεργοποίησης
          </button>
        </form>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/auth/login"
            className="rounded-2xl border border-cyan-400/40 px-4 py-3 text-center font-black text-cyan-100"
          >
            Σελίδα σύνδεσης
          </Link>
          <Link
            href="/professional/infrastructure/water/admin/control"
            className="rounded-2xl border border-white/20 px-4 py-3 text-center font-black text-white"
          >
            Founder Control Center
          </Link>
        </div>
      </section>
    </main>
  );
}
