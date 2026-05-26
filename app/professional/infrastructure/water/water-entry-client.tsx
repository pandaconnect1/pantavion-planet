"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AccessState = "checking" | "approved" | "not-approved" | "error";

type DeviceClaim = {
  deviceId: string;
  deviceToken: string;
};

const WATER_LIVE_PATH = "/professional/infrastructure/water/live";
const WATER_HELP_PATH = "/professional/infrastructure/water/help";
const WATER_ADMIN_PATH = "/professional/infrastructure/water/admin";

const DEVICE_ID_KEYS = [
  "pantavion_water_device_id",
  "pantavion_water_access_device_id",
  "pantavion_water_help_device_id",
  "pantavion_water_user_device_id",
  "pantavionWaterDeviceId",
  "waterDeviceId",
  "water_device_id",
  "water-device-id",
];

const DEVICE_TOKEN_KEYS = [
  "pantavion_water_device_token",
  "pantavion_water_access_device_token",
  "pantavion_water_help_device_token",
  "pantavion_water_user_device_token",
  "pantavionWaterDeviceToken",
  "waterDeviceToken",
  "water_device_token",
  "water-device-token",
];

const FOUNDER_CODE_KEYS = [
  "pantavion_water_founder_code",
  "waterFounderCode",
];

function readFirstLocalStorage(keys: string[]) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function writeAllMissing(keys: string[], value: string) {
  if (typeof window === "undefined" || !value) return;

  for (const key of keys) {
    if (!window.localStorage.getItem(key)) {
      window.localStorage.setItem(key, value);
    }
  }
}

function createSafeToken(prefix: string) {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateDeviceClaim(): DeviceClaim {
  const existingDeviceId = readFirstLocalStorage(DEVICE_ID_KEYS);
  const existingDeviceToken = readFirstLocalStorage(DEVICE_TOKEN_KEYS);

  const deviceId = existingDeviceId || createSafeToken("water-device");
  const deviceToken = existingDeviceToken || createSafeToken("water-token");

  writeAllMissing(DEVICE_ID_KEYS, deviceId);
  writeAllMissing(DEVICE_TOKEN_KEYS, deviceToken);

  return {
    deviceId,
    deviceToken,
  };
}

export default function WaterEntryClient() {
  const [state, setState] = useState<AccessState>("checking");
  const [message, setMessage] = useState("Checking approved water access...");
  const [deviceId, setDeviceId] = useState("");
  const [holderName, setHolderName] = useState("");

  const canOpenMap = useMemo(() => state === "approved", [state]);

  async function checkAccess() {
    setState("checking");
    setMessage("Checking approved water access...");

    try {
      const claim = getOrCreateDeviceClaim();
      const founderCode = readFirstLocalStorage(FOUNDER_CODE_KEYS);

      setDeviceId(claim.deviceId);

      const response = await fetch("/api/professional/infrastructure/water/access/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: claim.deviceId,
          deviceToken: claim.deviceToken,
          founderCode: founderCode || undefined,
        }),
      });

      const json = await response.json();

      if (response.ok && json?.ok && json?.approved) {
        const firstName = String(json?.holder?.firstName || "").trim();
        const lastName = String(json?.holder?.lastName || "").trim();
        const displayName = `${firstName} ${lastName}`.trim();

        setHolderName(displayName);
        setState("approved");
        setMessage("Approved access confirmed. Opening water map...");

        window.setTimeout(() => {
          window.location.assign(WATER_LIVE_PATH);
        }, 700);

        return;
      }

      setState("not-approved");
      setMessage("This device is not approved yet. Use Request Access if this is a new device.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Access check failed.");
    }
  }

  useEffect(() => {
    void checkAccess();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-amber-400/40 bg-black/30 p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            Pantavion Water Access
          </p>
          <h1 className="mt-2 text-3xl font-black">Protected Water Infrastructure</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
            Approved devices enter the live water map automatically. Existing approved users do not need a new approval.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
            Access status
          </p>

          <p className="mt-3 text-lg font-black text-white">
            {state === "checking" && "Checking access..."}
            {state === "approved" && "Approved"}
            {state === "not-approved" && "Not approved on this device"}
            {state === "error" && "Access check error"}
          </p>

          <p className="mt-2 text-sm font-bold text-emerald-200">{message}</p>

          {holderName ? (
            <p className="mt-2 text-sm text-slate-300">Holder: {holderName}</p>
          ) : null}

          <p className="mt-2 break-all text-xs text-slate-500">
            Device ID: {deviceId || "not ready"}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={WATER_LIVE_PATH}
              className={`rounded-xl px-5 py-3 text-sm font-black ${
                canOpenMap
                  ? "bg-emerald-400 text-black"
                  : "border border-slate-600 text-slate-400"
              }`}
            >
              Open Water Map
            </Link>

            <button
              onClick={checkAccess}
              className="rounded-xl border border-emerald-400/60 px-5 py-3 text-sm font-black text-emerald-200"
            >
              Check again
            </button>

            <Link
              href={WATER_HELP_PATH}
              className="rounded-xl border border-amber-400/60 px-5 py-3 text-sm font-black text-amber-200"
            >
              Request access
            </Link>

            <Link
              href={WATER_ADMIN_PATH}
              className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-black text-slate-300"
            >
              Founder admin
            </Link>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-black/25 p-4">
          <p className="text-sm font-bold text-slate-300">
            Protection rule: this access gate does not delete users, requests, devices, map data, Blob files, or environment variables.
          </p>
        </div>
      </section>
    </main>
  );
}
