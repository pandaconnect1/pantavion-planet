"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AccessStatus = "locked" | "unlocked";

function makeToken() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function makeDeviceId() {
  if (typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `pantavion-water-founder-${Date.now()}-${makeToken().slice(0, 12)}`;
}

function readOrCreateFounderDevice() {
  const existingId =
    window.localStorage.getItem("pantavion_water_device_id") ||
    window.localStorage.getItem("waterDeviceId") ||
    "";

  const existingToken =
    window.localStorage.getItem("pantavion_water_device_token") ||
    window.localStorage.getItem("waterDeviceToken") ||
    "";

  const deviceId = existingId || makeDeviceId();
  const deviceToken = existingToken || makeToken();

  window.localStorage.setItem("pantavion_water_device_id", deviceId);
  window.localStorage.setItem("waterDeviceId", deviceId);
  window.localStorage.setItem("pantavion_water_device_token", deviceToken);
  window.localStorage.setItem("waterDeviceToken", deviceToken);

  window.localStorage.setItem(
    "pantavion_water_access_device",
    JSON.stringify({
      deviceId,
      deviceToken,
      role: "founder_admin",
      createdAt: new Date().toISOString(),
    }),
  );

  return { deviceId, deviceToken };
}

function readStoredFounderCode() {
  return (
    window.localStorage.getItem("pantavion_water_founder_code") ||
    window.localStorage.getItem("waterFounderCode") ||
    ""
  );
}

function saveFounderCode(code: string) {
  const clean = code.trim();

  if (!clean) return;

  window.localStorage.setItem("pantavion_water_founder_code", clean);
  window.localStorage.setItem("waterFounderCode", clean);
  window.localStorage.setItem("pantavion_water_founder_admin_unlocked_at", new Date().toISOString());
}

export default function WaterAdminPage() {
  const [status, setStatus] = useState<AccessStatus>("locked");
  const [founderCode, setFounderCode] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [message, setMessage] = useState("Founder/admin mobile access required.");

  useEffect(() => {
    const savedCode = readStoredFounderCode();
    const device = readOrCreateFounderDevice();

    setFounderCode(savedCode);
    setDeviceId(device.deviceId);

    if (savedCode) {
      setStatus("unlocked");
      setMessage("Founder/admin device recognized on this browser.");
    }
  }, []);

  function unlockFounderAdmin() {
    const clean = founderCode.trim();

    if (!clean) {
      setMessage("Founder code required.");
      setStatus("locked");
      return;
    }

    const device = readOrCreateFounderDevice();
    saveFounderCode(clean);

    setDeviceId(device.deviceId);
    setStatus("unlocked");
    setMessage("Founder/admin mobile access saved. You can now manage access from this phone.");
  }

  const safeLinks = useMemo(
    () => [
      {
        label: "Open Working Map A",
        href: "/professional/infrastructure/water/live",
        note: "Operational map. Unchanged.",
      },
      {
        label: "Open Access Help",
        href: "/professional/infrastructure/water/help",
        note: "Access/help area.",
      },
      {
        label: "Open Intelligence Command",
        href: "/professional/infrastructure/water/intelligence",
        note: "Water intelligence area.",
      },
      {
        label: "Open Mobile Founder Unlock",
        href: "/professional/infrastructure/water/mobile-founder",
        note: "Founder device helper.",
      },
    ],
    [],
  );

  return (
    <main className="min-h-screen bg-[#061120] px-4 py-5 text-white">
      <section className="mx-auto max-w-4xl rounded-3xl border border-[#f2c766]/50 bg-[#0b1728] p-5 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f2c766]">
          PANTAVION WATER
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Founder Water Admin
        </h1>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
          Emergency mobile-safe admin access. This page does not delete users,
          approved devices, requests, map records, Blob files, or environment variables.
        </p>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-black/25 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f2c766]">
            Founder status
          </p>

          <p className="mt-2 text-lg font-black">
            {status === "unlocked" ? "UNLOCKED" : "LOCKED"}
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-300">{message}</p>

          <p className="mt-2 break-all text-xs font-semibold text-slate-400">
            Device ID: {deviceId || "not ready"}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-black/25 p-4">
          <label className="text-xs font-black uppercase tracking-[0.16em] text-[#f2c766]">
            Founder access code
          </label>

          <input
            value={founderCode}
            onChange={(event) => setFounderCode(event.target.value)}
            placeholder="Founder access code"
            className="mt-3 w-full rounded-xl border border-slate-600 bg-[#07111f] px-4 py-4 text-base font-bold text-white outline-none"
          />

          <button
            type="button"
            onClick={unlockFounderAdmin}
            className="mt-4 w-full rounded-xl border border-[#f2c766] bg-[#f2c766]/15 px-4 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#f8e6ad]"
          >
            Unlock founder/admin on this phone
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {safeLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-700 bg-black/25 p-4 transition hover:border-[#f2c766]/60"
            >
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#f8e6ad]">
                {item.label}
              </p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
                {item.note}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
          <p className="text-sm font-black text-emerald-200">
            Protected: approved users and devices are not modified by this page.
          </p>
        </div>
      </section>
    </main>
  );
}

