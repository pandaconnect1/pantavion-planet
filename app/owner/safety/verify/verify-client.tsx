"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TotpEnrollment = {
  id: string;
  qrCode: string;
  secret: string;
};

export default function OwnerSafetyVerifyClient() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setError(null);

      const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!active) return;
      if (aalError) {
        setError("Unable to verify the current security level.");
        setLoading(false);
        return;
      }
      if (aal?.currentLevel === "aal2") {
        router.replace("/owner/safety");
        return;
      }

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (!active) return;
      if (factorsError) {
        setError("Unable to load registered security factors.");
        setLoading(false);
        return;
      }

      const verifiedTotp = factors.totp.find((factor) => factor.status === "verified") ?? null;
      if (verifiedTotp) {
        setFactorId(verifiedTotp.id);
        setLoading(false);
        return;
      }

      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Pantavion Owner Control",
      });
      if (!active) return;
      if (enrollError || !enrolled?.totp) {
        setError("No verified second factor is available and a secure authenticator could not be enrolled.");
        setLoading(false);
        return;
      }

      setFactorId(enrolled.id);
      setEnrollment({
        id: enrolled.id,
        qrCode: enrolled.totp.qr_code,
        secret: enrolled.totp.secret,
      });
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || code.trim().length < 6) return;

    setSubmitting(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    if (verifyError) {
      setError("Verification failed. Check the authenticator code and try again.");
      setSubmitting(false);
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      setError("The session was not upgraded to AAL2. Access remains locked.");
      setSubmitting(false);
      return;
    }

    router.replace("/owner/safety");
    router.refresh();
  }

  if (loading) {
    return <p className="mt-6 text-sm text-slate-400">Checking registered security factors…</p>;
  }

  return (
    <div className="mt-6">
      {enrollment ? (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
          <p className="text-sm font-bold text-amber-100">Set up an authenticator before continuing.</p>
          <p className="mt-2 text-xs leading-5 text-amber-100/75">
            Scan this QR code with a trusted authenticator app, then enter the current six-digit code below. Keep the secret private.
          </p>
          <div className="mt-4 flex justify-center rounded-xl bg-white p-4">
            {/* Supabase returns a data URL for the TOTP QR code. */}
            <img src={enrollment.qrCode} alt="Pantavion Owner MFA QR code" className="h-48 w-48" />
          </div>
          <details className="mt-3 text-xs text-amber-100/80">
            <summary className="cursor-pointer font-bold">Manual setup key</summary>
            <code className="mt-2 block break-all rounded-lg bg-black/30 p-3">{enrollment.secret}</code>
          </details>
        </div>
      ) : (
        <p className="mb-4 text-sm text-slate-300">Open your registered authenticator and enter the current verification code.</p>
      )}

      <form onSubmit={verify} className="space-y-4">
        <label className="block text-sm font-bold text-slate-200">
          Authenticator code
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg tracking-[0.3em] text-white outline-none focus:border-cyan-400"
            placeholder="000000"
          />
        </label>

        {error ? <p className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting || !factorId || code.trim().length < 6}
          className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Verifying…" : "Verify & unlock Owner Control"}
        </button>
      </form>
    </div>
  );
}
