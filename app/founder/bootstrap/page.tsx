"use client";

import { useEffect, useState } from "react";

export default function FounderBootstrapPage() {
  const [message, setMessage] = useState("Ενεργοποίηση ασφαλούς Founder session…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = window.location.hash.replace(/^#/, "").trim();
      history.replaceState(null, "", window.location.pathname);

      if (!token) {
        if (!cancelled) {
          setFailed(true);
          setMessage("Το Founder bootstrap link δεν είναι έγκυρο.");
        }
        return;
      }

      try {
        const response = await fetch("/api/pantavion/founder/bootstrap", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const json = (await response.json()) as {
          ok?: boolean;
          error?: string;
          redirectTo?: string;
        };

        if (!response.ok || !json.ok) {
          throw new Error(json.error || "bootstrap_failed");
        }

        if (cancelled) return;
        setMessage("Founder session ενεργοποιήθηκε. Άνοιγμα Control Center…");
        window.location.replace(
          json.redirectTo || "/professional/infrastructure/water/admin/control",
        );
      } catch {
        if (!cancelled) {
          setFailed(true);
          setMessage("Το Founder bootstrap απέτυχε ή το link έχει ήδη χρησιμοποιηθεί.");
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-10 text-white">
      <section className="mx-auto max-w-lg rounded-3xl border border-[#f2c766]/40 bg-[#0d1a2d] p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f2c766]">
          Pantavion Founder
        </p>
        <h1 className="mt-3 text-3xl font-black">Secure bootstrap</h1>
        <p
          className={`mt-5 rounded-2xl border p-4 text-sm font-bold leading-6 ${
            failed
              ? "border-red-500/40 bg-red-950/30 text-red-100"
              : "border-emerald-500/40 bg-emerald-950/20 text-emerald-100"
          }`}
        >
          {message}
        </p>
      </section>
    </main>
  );
}
