"use client";

import Link from "next/link";
import { useState } from "react";

const MASTER_API = "/api/professional/infrastructure/water/master-dwg";
const MASTER_FILE_NAME = "PANTAVION_WATER_MASTER_B.dwg";

function readLocalValue(keys: string[]) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value && value.trim()) return value.trim();
  }

  return "";
}

function readAccessHeaders() {
  const headers = new Headers();

  const founderCode = readLocalValue([
    "pantavion.water.admin.founderCode.v1",
    "pantavion_water_founder_access_code",
    "pantavion-water-founder-access-code",
    "waterFounderAccessCode",
  ]);

  const deviceId = readLocalValue([
    "pantavion:water:device-id:v1",
    "pantavion_water_device_id",
    "pantavion-water-device-id",
    "pantavion_water_approved_device_id",
    "pantavion-water-approved-device-id",
    "waterDeviceId",
    "water_device_id",
  ]);

  const deviceToken = readLocalValue([
    "pantavion:water:device-token:v1",
    "pantavion_water_device_token",
    "pantavion-water-device-token",
    "pantavion_water_approved_device_token",
    "pantavion-water-approved-device-token",
    "waterDeviceToken",
    "water_device_token",
  ]);

  if (founderCode) headers.set("x-pantavion-water-founder-code", founderCode);
  if (deviceId && deviceToken) {
    headers.set("x-pantavion-water-device-id", deviceId);
    headers.set("x-pantavion-water-device-token", deviceToken);
  }

  return headers;
}

export default function WaterMasterDwgPage() {
  const [status, setStatus] = useState("ready");
  const [details, setDetails] = useState("");

  async function openOriginalMaster() {
    setStatus("opening");
    setDetails("");

    try {
      const response = await fetch(MASTER_API, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: readAccessHeaders(),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `HTTP_${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = MASTER_FILE_NAME;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 15000);

      setStatus("ok");
      setDetails("ORIGINAL_MASTER_B_OPENED");
    } catch (error) {
      setStatus("error");
      setDetails(error instanceof Error ? error.message : "MASTER_B_ACCESS_FAILED");
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
          Επιλογή ενός χάρτη κάθε φορά. Ο Master Β ανοίγει από το γνήσιο DWG αρχείο.
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
            onClick={() => void openOriginalMaster()}
            disabled={status === "opening"}
            className="rounded-2xl border border-[#f2c766] bg-[#f2c766]/15 p-5 text-left transition hover:bg-[#f2c766]/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f2c766]">
              B
            </p>
            <h2 className="mt-2 text-2xl font-black">Master χάρτης</h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              Γνήσιο DWG Master B. Το αρχείο δεν αλλάζει και δεν αλλοιώνεται.
            </p>
            <p className="mt-4 text-sm font-black text-[#f8e6ad]">
              {status === "opening" ? "OPENING MASTER..." : "OPEN ORIGINAL MASTER B"}
            </p>
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-700 bg-black/25 p-4">
          <p className="text-sm font-black text-[#f2c766]">MASTER FILE</p>
          <p className="mt-2 break-all text-lg font-black">{MASTER_FILE_NAME}</p>
          <p className="mt-2 text-xs font-semibold text-slate-300">
            Πηγή: protected Blob original DWG. Δεν χρησιμοποιείται mobile preview.
          </p>
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
