"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function WaterAdminLoginPage() {
  const [accessCode, setAccessCode] = useState("");
  const [message, setMessage] = useState("Έλεγχος administrator session…");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/professional/infrastructure/water/admin/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json = (await response.json()) as { authenticated?: boolean };
        if (cancelled) return;

        if (response.ok && json.authenticated) {
          window.location.replace("/professional/infrastructure/water/admin/approvals");
          return;
        }

        setMessage("Βάλε τον founder/admin access code για να ενεργοποιηθεί η προστατευμένη συνεδρία.");
      } catch {
        if (!cancelled) setMessage("Δεν μπόρεσε να ελεγχθεί η administrator session.");
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessCode.trim() || loading) return;

    setLoading(true);
    setMessage("Ενεργοποίηση administrator session…");

    try {
      const response = await fetch("/api/professional/infrastructure/water/admin/session", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok || !json.ok) {
        setMessage(json.message || json.error || "Η administrator πρόσβαση απέτυχε.");
        return;
      }

      setAccessCode("");
      window.location.replace(
        json.redirectTo || "/professional/infrastructure/water/admin/approvals",
      );
    } catch {
      setMessage("Η administrator πρόσβαση απέτυχε.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06101f] px-4 py-8 text-white">
      <section className="mx-auto max-w-lg rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-6 shadow-2xl">
        <Link
          href="/professional/infrastructure/water"
          className="text-sm font-black text-[#d8b45f]"
        >
          ← Water Control Center
        </Link>

        <p className="mt-7 text-xs font-black uppercase tracking-[0.3em] text-[#d8b45f]">
          Pantavion Protected Water
        </p>
        <h1 className="mt-3 text-3xl font-black">Administrator</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-black" htmlFor="water-admin-code">
            Founder / Admin access code
          </label>
          <input
            id="water-admin-code"
            type="password"
            autoComplete="current-password"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#d8b45f]"
          />
          <button
            type="submit"
            disabled={loading || !accessCode.trim()}
            className="w-full rounded-2xl bg-[#d8b45f] px-5 py-3 font-black text-[#07101e] disabled:opacity-50"
          >
            {loading ? "Έλεγχος…" : "Σύνδεση ως Administrator"}
          </button>
        </form>
      </section>
    </main>
  );
}
