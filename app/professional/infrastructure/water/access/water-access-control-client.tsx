"use client";

import { useEffect, useMemo, useState } from "react";

type DeviceIdentity = {
  deviceId: string;
  deviceToken: string;
};

type ApiResult = {
  ok?: boolean;
  error?: string;
  requestId?: string;
  approved?: boolean;
};

const API = {
  authorize: "/api/professional/infrastructure/water/access/authorize",
  request: "/api/professional/infrastructure/water/access/request",
} as const;

const DEVICE_ID_KEYS = [
  "pantavion_water_device_id",
  "pantavion_water_access_device_id",
  "pantavionWaterAccessDeviceId",
  "waterAccessDeviceId",
  "water_device_id",
];

const DEVICE_TOKEN_KEYS = [
  "pantavion_water_device_token",
  "pantavion_water_access_device_token",
  "pantavionWaterAccessDeviceToken",
  "waterAccessDeviceToken",
  "water_device_token",
];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readLocalStorageValue(keys: string[]) {
  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return "";
}

function findDeviceFromStoredJson(): DeviceIdentity | null {
  const raw = window.localStorage.getItem("pantavion_water_access_device");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<DeviceIdentity>;

    if (parsed.deviceId && parsed.deviceToken) {
      return {
        deviceId: parsed.deviceId,
        deviceToken: parsed.deviceToken,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function getOrCreateDevice(): DeviceIdentity {
  const jsonDevice = findDeviceFromStoredJson();
  let deviceId = jsonDevice?.deviceId || readLocalStorageValue(DEVICE_ID_KEYS);
  let deviceToken =
    jsonDevice?.deviceToken || readLocalStorageValue(DEVICE_TOKEN_KEYS);

  if (!deviceId) deviceId = createId("water-device");
  if (!deviceToken) deviceToken = createId("water-token");

  window.localStorage.setItem("pantavion_water_device_id", deviceId);
  window.localStorage.setItem("pantavion_water_device_token", deviceToken);
  window.localStorage.setItem(
    "pantavion_water_access_device",
    JSON.stringify({ deviceId, deviceToken }),
  );

  return { deviceId, deviceToken };
}

async function postJson(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      error: "Η υπηρεσία πρόσβασης δεν επέστρεψε έγκυρη απάντηση.",
    } satisfies ApiResult;
  }

  try {
    const payload = text ? (JSON.parse(text) as ApiResult) : {};

    return response.ok
      ? payload
      : {
          ...payload,
          ok: false,
          error: payload.error || `API error ${response.status}`,
        };
  } catch {
    return {
      ok: false,
      error: "Η υπηρεσία πρόσβασης επέστρεψε μη έγκυρα δεδομένα.",
    } satisfies ApiResult;
  }
}

export default function WaterAccessControlClient({ isAdmin = false }: { isAdmin?: boolean }) {
  const [device, setDevice] = useState<DeviceIdentity | null>(null);
  const [accessApproved, setAccessApproved] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [pendingRequestId, setPendingRequestId] = useState("");

  const canSubmit = useMemo(
    () => Boolean(firstName.trim() && lastName.trim() && phone.trim()),
    [firstName, lastName, phone],
  );

  useEffect(() => {
    const currentDevice = getOrCreateDevice();
    const storedRequestId = window.localStorage.getItem(
      "pantavion_water_pending_request_id",
    );

    setDevice(currentDevice);
    if (storedRequestId) setPendingRequestId(storedRequestId);
    void checkApprovedDevice(currentDevice);
  }, []);

  async function checkApprovedDevice(currentDevice: DeviceIdentity) {
    setCheckingAccess(true);

    const payload = await postJson(API.authorize, {
      deviceId: currentDevice.deviceId,
      deviceToken: currentDevice.deviceToken,
    });

    setAccessApproved(Boolean(payload.ok || payload.approved));
    setCheckingAccess(false);
  }

  async function submitAccessRequest() {
    if (!device) return;

    if (!canSubmit) {
      setRequestMessage("Συμπλήρωσε όνομα, επώνυμο και τηλέφωνο.");
      return;
    }

    setRequestMessage("Αποστολή αίτησης...");

    const payload = await postJson(API.request, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      roleTitle: roleTitle.trim(),
      deviceId: device.deviceId,
      deviceToken: device.deviceToken,
      userAgent: navigator.userAgent,
      requestedAt: new Date().toISOString(),
    });

    if (!payload.ok && !payload.requestId) {
      setRequestMessage(payload.error || "Η αίτηση δεν στάλθηκε.");
      return;
    }

    const requestId = payload.requestId || createId("water-access-request");
    setPendingRequestId(requestId);
    window.localStorage.setItem("pantavion_water_pending_request_id", requestId);
    setRequestMessage(
      `Η αίτηση στάλθηκε και περιμένει έγκριση. Request ID: ${requestId}`,
    );
  }

  return (
    <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 shadow-2xl shadow-black/40 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d8b45f]">
          Pantavion Protected Water Access
        </p>

        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
          Users / Access
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
          Εδώ γίνεται μόνο η αίτηση πρόσβασης και ο έλεγχος της εγκεκριμένης
          συσκευής. Τα εργαλεία διαχείρισης δεν εμφανίζονται στη δημόσια σελίδα.
        </p>

        {isAdmin ? (
          <section className="mt-6 rounded-3xl border border-[#f2c766]/70 bg-[#f2c766]/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f2c766]">
              Administrator session ενεργό
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">Administrator / Users Management</h2>
            <p className="mt-2 text-sm leading-7 text-slate-200">
              Εμφανίζεται μόνο σε browser με έγκυρο ασφαλές Administrator session.
            </p>
            <a
              href="/professional/infrastructure/water/admin/approvals"
              className="mt-4 block rounded-2xl bg-[#f2c766] px-5 py-3 text-center font-black text-black"
            >
              Άνοιγμα Administrator
            </a>
          </section>
        ) : null}

        {checkingAccess ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5 text-slate-200">
            Έλεγχος συσκευής...
          </div>
        ) : accessApproved ? (
          <div className="mt-6 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5">
            <h2 className="text-2xl font-black text-emerald-100">
              Η συσκευή είναι approved.
            </h2>
            <p className="mt-2 text-sm leading-7 text-emerald-100">
              Δεν χρειάζεται νέα αίτηση πρόσβασης. Μπορείς να ανοίξεις τον
              χάρτη ύδρευσης ή το Water Control Center.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <a
                href="/professional/infrastructure/water/live"
                className="rounded-2xl bg-[#d8b45f] px-5 py-3 text-center font-black text-[#07101e]"
              >
                Άνοιγμα A Map
              </a>
              <a
                href="/professional/infrastructure/water"
                className="rounded-2xl border border-[#d8b45f]/50 px-5 py-3 text-center font-black text-[#f3db9d]"
              >
                Water Control Center
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-xl font-black text-[#d8b45f]">
              Αίτηση νέου χρήστη
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Όνομα"
                className="rounded-2xl border border-white/15 bg-[#07101e] px-4 py-3 text-white outline-none focus:border-[#d8b45f]"
              />
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Επώνυμο"
                className="rounded-2xl border border-white/15 bg-[#07101e] px-4 py-3 text-white outline-none focus:border-[#d8b45f]"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Τηλέφωνο"
                className="rounded-2xl border border-white/15 bg-[#07101e] px-4 py-3 text-white outline-none focus:border-[#d8b45f]"
              />
              <input
                value={roleTitle}
                onChange={(event) => setRoleTitle(event.target.value)}
                placeholder="Ρόλος / θέση"
                className="rounded-2xl border border-white/15 bg-[#07101e] px-4 py-3 text-white outline-none focus:border-[#d8b45f]"
              />
            </div>

            <button
              type="button"
              onClick={() => void submitAccessRequest()}
              disabled={!canSubmit}
              className="mt-4 w-full rounded-2xl border border-[#d8b45f]/50 bg-[#d8b45f] px-5 py-3 font-black text-[#07101e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Αποστολή αίτησης για έγκριση
            </button>

            {requestMessage || pendingRequestId ? (
              <p className="mt-4 rounded-2xl border border-white/10 bg-[#07101e] p-4 text-sm font-semibold text-slate-200">
                {requestMessage ||
                  `Αναμονή έγκρισης. Request ID: ${pendingRequestId}`}
              </p>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
