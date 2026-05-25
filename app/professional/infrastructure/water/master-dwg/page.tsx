"use client";

import Link from "next/link";
import { useState } from "react";

const DOWNLOAD_FILE_NAME = "PANTAVION_WATER_MASTER_B.dwg";

function readApprovedWaterDevice() {
  if (typeof window === "undefined") {
    return { deviceId: "", deviceToken: "" };
  }

  const directIdKeys = [
    "pantavion_water_device_id",
    "pantavion-water-device-id",
    "pantavion_water_approved_device_id",
    "pantavion-water-approved-device-id",
    "waterDeviceId",
    "water_device_id",
  ];

  const directTokenKeys = [
    "pantavion_water_device_token",
    "pantavion-water-device-token",
    "pantavion_water_approved_device_token",
    "pantavion-water-approved-device-token",
    "waterDeviceToken",
    "water_device_token",
  ];

  for (const idKey of directIdKeys) {
    const deviceId = window.localStorage.getItem(idKey) || "";

    if (!deviceId) continue;

    for (const tokenKey of directTokenKeys) {
      const deviceToken = window.localStorage.getItem(tokenKey) || "";

      if (deviceToken) {
        return { deviceId, deviceToken };
      }
    }
  }

  const jsonKeys = [
    "pantavion_water_access_device",
    "pantavion-water-access-device",
    "pantavion_water_approved_device",
    "pantavion-water-approved-device",
    "waterAccessDevice",
    "waterApprovedDevice",
    "waterAdminSession",
    "pantavion_water_admin_session",
  ];

  for (const key of jsonKeys) {
    const raw = window.localStorage.getItem(key);

    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as {
        deviceId?: unknown;
        id?: unknown;
        deviceToken?: unknown;
        token?: unknown;
      };

      const deviceId = String(parsed.deviceId || parsed.id || "");
      const deviceToken = String(parsed.deviceToken || parsed.token || "");

      if (deviceId && deviceToken) {
        return { deviceId, deviceToken };
      }
    } catch {
      // Ignore invalid localStorage JSON.
    }
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index) || "";

    if (!key.toLowerCase().includes("water")) continue;

    const raw = window.localStorage.getItem(key);

    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as {
        deviceId?: unknown;
        id?: unknown;
        deviceToken?: unknown;
        token?: unknown;
      };

      const deviceId = String(parsed.deviceId || parsed.id || "");
      const deviceToken = String(parsed.deviceToken || parsed.token || "");

      if (deviceId && deviceToken) {
        return { deviceId, deviceToken };
      }
    } catch {
      // Ignore non-JSON localStorage values.
    }
  }

  return { deviceId: "", deviceToken: "" };
}

export default function WaterMasterDwgPage() {
  const [status, setStatus] = useState("ready");
  const [details, setDetails] = useState("");

  async function openMasterB() {
    setStatus("opening");
    setDetails("");

    const approvedDevice = readApprovedWaterDevice();
    const headers = new Headers();

    if (approvedDevice.deviceId && approvedDevice.deviceToken) {
      headers.set("x-pantavion-water-device-id", approvedDevice.deviceId);
      headers.set("x-pantavion-water-device-token", approvedDevice.deviceToken);
    }

    try {
      const response = await fetch("/api/professional/infrastructure/water/master-dwg", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `HTTP_${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = DOWNLOAD_FILE_NAME;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 15000);

      setStatus("ok");
      setDetails("MASTER_B_OPENED");
    } catch (error) {
      setStatus("error");
      setDetails(error instanceof Error ? error.message : "ACCESS_DENIED");
    }
  }

  return (
    <main className="min-h-screen bg-[#061120] px-5 py-8 text-white">
      <section className="mx-auto max-w-5xl rounded-3xl border border-[#f2c766]/40 bg-[#0b1728] p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f2c766]">
          PANTAVION WATER
        </p>

        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
          Χάρτες Ύδρευσης
        </h1>

        <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
          Επιλογή χάρτη για εγκεκριμένους χρήστες και διαχειριστές.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/professional/infrastructure/water/live"
            className="rounded-2xl border border-slate-600 bg-black/25 p-5 transition hover:border-[#f2c766]"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f2c766]">
              A
            </p>
            <h2 className="mt-2 text-2xl font-black">Λειτουργικός χάρτης</h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              Υφιστάμενος χάρτης δικτύου.
            </p>
            <p className="mt-4 text-sm font-black text-[#f8e6ad]">
              OPEN MAP A
            </p>
          </Link>

          <button
            type="button"
            onClick={() => void openMasterB()}
            disabled={status === "opening"}
            className="rounded-2xl border border-[#f2c766] bg-[#f2c766]/15 p-5 text-left transition hover:bg-[#f2c766]/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f2c766]">
              B
            </p>
            <h2 className="mt-2 text-2xl font-black">Master χάρτης</h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              Γνήσιος DWG Master για εγκεκριμένη πρόσβαση.
            </p>
            <p className="mt-4 text-sm font-black text-[#f8e6ad]">
              {status === "opening" ? "OPENING..." : "OPEN MASTER B"}
            </p>
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-700 bg-black/25 p-4">
          <p className="text-sm font-black text-[#f2c766]">MASTER FILE</p>
          <p className="mt-2 break-all text-lg font-black">{DOWNLOAD_FILE_NAME}</p>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-[#07111f] p-4">
          <p className="text-sm font-black">
            STATUS: <span className="text-[#f2c766]">{status}</span>
          </p>
          {details ? (
            <p className="mt-2 break-all text-xs font-semibold text-slate-300">
              {details}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
