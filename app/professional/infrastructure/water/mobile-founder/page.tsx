"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StoredFounderDevice = {
  deviceId: string;
  deviceToken: string;
  role: "founder_admin_pending";
  createdAt: string;
};

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

  return `pantavion-water-mobile-${Date.now()}-${makeToken().slice(0, 16)}`;
}

function readDevice(): StoredFounderDevice | null {
  try {
    const raw =
      window.localStorage.getItem("pantavion_water_access_device") ||
      window.localStorage.getItem("waterAccessDevice") ||
      "";

    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredFounderDevice>;

    if (!parsed.deviceId || !parsed.deviceToken) return null;

    return {
      deviceId: String(parsed.deviceId),
      deviceToken: String(parsed.deviceToken),
      role: "founder_admin_pending",
      createdAt: String(parsed.createdAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

function ensureDevice(): StoredFounderDevice {
  const existing = readDevice();

  if (existing) return existing;

  const created: StoredFounderDevice = {
    deviceId: makeDeviceId(),
    deviceToken: makeToken(),
    role: "founder_admin_pending",
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem("waterDeviceId", created.deviceId);
  window.localStorage.setItem("waterDeviceToken", created.deviceToken);
  window.localStorage.setItem("pantavion_water_device_id", created.deviceId);
  window.localStorage.setItem("pantavion_water_device_token", created.deviceToken);
  window.localStorage.setItem("waterAccessDevice", JSON.stringify(created));
  window.localStorage.setItem("pantavion_water_access_device", JSON.stringify(created));

  return created;
}

function saveFounderCode(code: string) {
  const clean = code.trim();

  if (!clean) return;

  window.localStorage.setItem("waterFounderCode", clean);
  window.localStorage.setItem("pantavion_water_founder_code", clean);
  window.localStorage.setItem("pantavion_water_founder_admin_last_unlock", new Date().toISOString());
}

export default function WaterMobileFounderPage() {
  const [code, setCode] = useState("");
  const [device, setDevice] = useState<StoredFounderDevice | null>(null);
  const [status, setStatus] = useState("waiting");

  useEffect(() => {
    const current = ensureDevice();
    setDevice(current);

    const saved =
      window.localStorage.getItem("pantavion_water_founder_code") ||
      window.localStorage.getItem("waterFounderCode") ||
      "";

    setCode(saved);
  }, []);

  function unlock() {
    const current = ensureDevice();
    saveFounderCode(code);

    setDevice(current);
    setStatus("founder_mobile_device_saved");
  }

  return (
    <main className="min-h-screen bg-[#061120] px-4 py-5 text-white">
      <section className="mx-auto max-w-3xl rounded-3xl border border-[#f2c766]/50 bg-[#0b1728] p-5 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f2c766]">
          PANTAVION WATER
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Mobile Founder Unlock
        </h1>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
          Emergency mobile access helper. It does not delete users, approved devices,
          requests, map data, or production records.
        </p>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-black/25 p-4">
          <label className="text-xs font-black uppercase tracking-[0.16em] text-[#f2c766]">
            Founder access code
          </label>

          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Founder access code"
            className="mt-3 w-full rounded-xl border border-slate-600 bg-[#07111f] px-4 py-3 text-sm font-bold text-white outline-none"
          />

          <button
            type="button"
            onClick={unlock}
            className="mt-4 w-full rounded-xl border border-[#f2c766] bg-[#f2c766]/15 px-4 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#f8e6ad]"
          >
            Save founder mobile access
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-black/25 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f2c766]">
            Status
          </p>

          <p className="mt-2 text-sm font-black">{status}</p>

          <p className="mt-2 break-all text-xs font-semibold text-slate-300">
            Device ID: {device?.deviceId || "not ready"}
          </p>

          <p className="mt-2 text-xs font-semibold text-slate-400">
            Device token is stored locally on this browser. It is not shown here.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <Link
            href="/professional/infrastructure/water/admin"
            className="rounded-2xl border border-[#f2c766] bg-[#f2c766]/15 p-4 text-sm font-black uppercase tracking-[0.14em] text-[#f8e6ad]"
          >
            Open Water Admin
          </Link>

          <Link
            href="/professional/infrastructure/water/help"
            className="rounded-2xl border border-slate-700 bg-black/25 p-4 text-sm font-black uppercase tracking-[0.14em] text-slate-200"
          >
            Open Access / Help
          </Link>

          <Link
            href="/professional/infrastructure/water/live"
            className="rounded-2xl border border-slate-700 bg-black/25 p-4 text-sm font-black uppercase tracking-[0.14em] text-slate-200"
          >
            Open Working Map A
          </Link>
        </div>

        <p className="mt-5 text-xs font-semibold leading-5 text-slate-400">
          Safety rule: this page only saves founder mobile identity keys in this browser.
          Existing approved users and requests are not modified.
        </p>
      </section>
    </main>
  );
}
