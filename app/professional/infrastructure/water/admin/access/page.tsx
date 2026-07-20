"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  redirectTo?: string;
};

const WATER_ADMIN_PATH = "/professional/infrastructure/water/admin";
const WATER_ADMIN_ACCESS_PATH = `${WATER_ADMIN_PATH}/access`;
const WATER_ADMIN_DEFAULT_PATH = `${WATER_ADMIN_PATH}/approvals`;

function safeRequestedAdminPath() {
  const requestedPath = new URLSearchParams(window.location.search).get("next") || "";

  if (
    requestedPath !== WATER_ADMIN_ACCESS_PATH &&
    (requestedPath === WATER_ADMIN_PATH || requestedPath.startsWith(`${WATER_ADMIN_PATH}/`))
  ) {
    return requestedPath;
  }

  return "";
}

export default function WaterAdminAccessPage() {
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Βάλε το founder/admin access code για να ανοίξει ασφαλές session.");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    for (const key of [
      "pantavion.water.admin.founderCode.v1",
      "pantavion_water_founder_code",
      "waterFounderCode",
      "waterFounderCodeClean",
    ]) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  }, []);

  async function submitAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("Έλεγχος access code...");
    setOk(false);

    try {
      const response = await fetch("/api/professional/infrastructure/water/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ accessCode }),
      });

      const json = (await response.json()) as SessionResponse;

      if (!response.ok || !json.ok) {
        throw new Error(json.message || json.error || "Δεν άνοιξε admin session.");
      }

      setOk(true);
      setAccessCode("");
      setMessage(json.message || "Το founder/admin session ενεργοποιήθηκε.");

      window.setTimeout(() => {
        window.location.href = safeRequestedAdminPath() || json.redirectTo || WATER_ADMIN_DEFAULT_PATH;
      }, 600);
    } catch (error) {
      setOk(false);
      setMessage(error instanceof Error ? error.message : "Δεν άνοιξε admin session.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);

    try {
      await fetch("/api/professional/infrastructure/water/admin/session", {
        method: "DELETE",
        credentials: "include",
      });

      setOk(false);
      setAccessCode("");
      setMessage("Το founder/admin session έκλεισε.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-5 text-white">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
        <Link href="/professional/infrastructure/water" className="text-sm font-black text-[#f2c766]">
          ← Πίσω στην Ύδρευση
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
          PANTAVION WATER ADMIN ACCESS
        </p>

        <h1 className="mt-3 text-3xl font-black">Founder/Admin πρόσβαση</h1>

        <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
          Εδώ δεν μπαίνει token στο URL. Το access code ελέγχεται στον server και μετά δημιουργείται
          ασφαλές httpOnly session cookie για να ανοίξει το private κέντρο Users / Approvals.
        </p>

        <form onSubmit={(event) => void submitAccess(event)} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#f2c766]">Founder/Admin access code</span>
            <input
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="Βάλε εδώ το μυστικό που έχεις στο Vercel"
              className="rounded-2xl border border-slate-700 bg-[#07111f] px-4 py-3 text-white outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !accessCode.trim()}
            className="rounded-2xl bg-[#f2c766] px-5 py-4 text-lg font-black text-black disabled:opacity-60"
          >
            {loading ? "Έλεγχος..." : "Άνοιγμα Users / Approvals"}
          </button>
        </form>

        <div
          className={`mt-5 rounded-2xl border p-4 text-sm font-black leading-6 ${
            ok
              ? "border-emerald-400/40 bg-emerald-950/30 text-emerald-100"
              : "border-[#f2c766]/30 bg-[#f2c766]/10 text-[#f2c766]"
          }`}
        >
          {message}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void logout()}
            disabled={loading}
            className="rounded-2xl border border-slate-700 bg-[#07111f] px-5 py-3 font-black text-white disabled:opacity-60"
          >
            Κλείσιμο admin session
          </button>
        </div>
      </section>
    </main>
  );
}
