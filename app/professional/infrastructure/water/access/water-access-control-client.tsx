"use client";

import { useEffect, useMemo, useState } from "react";

type DeviceIdentity = {
  deviceId: string;
  deviceToken: string;
};

type AccessRecord = {
  id?: string;
  requestId?: string;
  deviceId?: string;
  deviceToken?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleTitle?: string;
  title?: string;
  status?: string;
  createdAt?: string;
  requestedAt?: string;
  approvedAt?: string;
  updatedAt?: string;
  sourcePath?: string;
};

type ApiResult = {
  ok?: boolean;
  error?: string;
  message?: string;
  requestId?: string;
  approved?: boolean;
  requests?: AccessRecord[];
  pendingRequests?: AccessRecord[];
  pending?: AccessRecord[];
  approvedUsers?: AccessRecord[];
  approvedDevices?: AccessRecord[];
  approvedRecords?: AccessRecord[];
  users?: AccessRecord[];
};

const API = {
  authorize: "/api/professional/infrastructure/water/access/authorize",
  request: "/api/professional/infrastructure/water/access/request",
  adminRequests: "/api/professional/infrastructure/water/access/admin/requests",
  adminDecision: "/api/professional/infrastructure/water/access/admin/decision",
  adminApproved: "/api/professional/infrastructure/water/access/admin/approved",
};

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

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readLocalStorageValue(keys: string[]): string {
  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return "";
}

function findDeviceFromStoredJson(): DeviceIdentity | null {
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;

    const raw = window.localStorage.getItem(key);
    if (!raw || !raw.includes("device")) continue;

    try {
      const parsed = JSON.parse(raw) as Partial<DeviceIdentity>;
      if (parsed.deviceId && parsed.deviceToken) {
        return {
          deviceId: parsed.deviceId,
          deviceToken: parsed.deviceToken,
        };
      }
    } catch {
      // Ignore unrelated localStorage values.
    }
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
    JSON.stringify({ deviceId, deviceToken })
  );

  return { deviceId, deviceToken };
}

async function postJson(
  path: string,
  body: Record<string, unknown>,
  founderCode?: string
): Promise<ApiResult> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(founderCode
        ? {
            "x-pantavion-water-founder-code": founderCode,
            "x-pantavion-admin-code": founderCode,
          }
        : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      error:
        "Το API δεν επέστρεψε JSON. Έγινε μπλοκάρισμα για να μη φανεί HTML σφάλμα.",
    };
  }

  let payload: ApiResult = {};

  try {
    payload = text ? (JSON.parse(text) as ApiResult) : {};
  } catch {
    return {
      ok: false,
      error: "Το API επέστρεψε μη έγκυρο JSON.",
    };
  }

  if (!response.ok && !payload.error) {
    return {
      ...payload,
      ok: false,
      error: `API error ${response.status}`,
    };
  }

  return payload;
}

function asArray(value: unknown): AccessRecord[] {
  return Array.isArray(value) ? (value as AccessRecord[]) : [];
}

function pendingFrom(payload: ApiResult): AccessRecord[] {
  const records = [
    ...asArray(payload.pendingRequests),
    ...asArray(payload.pending),
    ...asArray(payload.requests),
  ];

  return records.filter((record) => {
    const status = String(record.status || "").toLowerCase();
    return status !== "approved" && status !== "revoked" && status !== "rejected";
  });
}

function approvedFrom(payload: ApiResult): AccessRecord[] {
  return [
    ...asArray(payload.approvedUsers),
    ...asArray(payload.approvedDevices),
    ...asArray(payload.approvedRecords),
    ...asArray(payload.users).filter((item) =>
      String(item.status || "").toLowerCase().includes("approved")
    ),
  ];
}

function recordKey(record: AccessRecord): string {
  return (
    record.requestId ||
    record.id ||
    record.deviceId ||
    record.sourcePath ||
    `${record.firstName || ""}-${record.lastName || ""}-${record.phone || ""}`
  );
}

function recordName(record: AccessRecord): string {
  const fullName = `${record.firstName || ""} ${record.lastName || ""}`.trim();
  return fullName || record.phone || record.deviceId || "Χρήστης";
}

function adminBaseBody(founderCode: string) {
  return {
    founderCode,
    adminCode: founderCode,
    code: founderCode,
  };
}

function adminDecisionBody(
  founderCode: string,
  decision: "approve" | "reject" | "revoke",
  record: AccessRecord
) {
  return {
    ...adminBaseBody(founderCode),
    decision,
    requestId: record.requestId || record.id,
    id: record.id || record.requestId,
    deviceId: record.deviceId,
    deviceToken: record.deviceToken,
    phone: record.phone,
  };
}

export default function WaterAccessControlClient() {
  const [device, setDevice] = useState<DeviceIdentity | null>(null);
  const [accessApproved, setAccessApproved] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [pendingRequestId, setPendingRequestId] = useState("");

  const [founderCode, setFounderCode] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [pendingRequests, setPendingRequests] = useState<AccessRecord[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<AccessRecord[]>([]);

  const canSubmit = useMemo(() => {
    return Boolean(firstName.trim() && lastName.trim() && phone.trim());
  }, [firstName, lastName, phone]);

  useEffect(() => {
    const currentDevice = getOrCreateDevice();
    setDevice(currentDevice);

    const storedRequestId = window.localStorage.getItem(
      "pantavion_water_pending_request_id"
    );
    if (storedRequestId) setPendingRequestId(storedRequestId);

    void checkApprovedDevice(currentDevice);
  }, []);

  async function checkApprovedDevice(currentDevice: DeviceIdentity) {
    setCheckingAccess(true);

    const payload = await postJson(API.authorize, {
      deviceId: currentDevice.deviceId,
      deviceToken: currentDevice.deviceToken,
    });

    const approved = Boolean(payload.ok || payload.approved);

    setAccessApproved(approved);
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
      `Η αίτηση στάλθηκε και περιμένει έγκριση. Request ID: ${requestId}`
    );
  }

  async function loadAdminRequests() {
    const code = founderCode.trim();

    if (!code) {
      setAdminMessage("Βάλε τον founder/admin κωδικό.");
      return;
    }

    setAdminLoading(true);
    setAdminMessage("Φόρτωση pending requests και approved users...");

    const requestsPayload = await postJson(
      API.adminRequests,
      adminBaseBody(code),
      code
    );

    const approvedPayload = await postJson(
      API.adminApproved,
      adminBaseBody(code),
      code
    );

    if (!requestsPayload.ok) {
      setAdminMessage(requestsPayload.error || "Δεν φορτώθηκαν οι αιτήσεις.");
      setAdminLoading(false);
      return;
    }

    if (!approvedPayload.ok) {
      setAdminMessage(
        approvedPayload.error || "Δεν φορτώθηκαν οι approved users."
      );
      setAdminLoading(false);
      return;
    }

    setPendingRequests(pendingFrom(requestsPayload));
    setApprovedUsers(approvedFrom(approvedPayload));
    setAdminMessage("Φορτώθηκαν τα στοιχεία πρόσβασης.");
    setAdminLoading(false);
  }

  async function runAdminAction(
    decision: "approve" | "reject" | "revoke",
    record: AccessRecord
  ) {
    const code = founderCode.trim();

    if (!code) {
      setAdminMessage("Βάλε τον founder/admin κωδικό.");
      return;
    }

    setAdminLoading(true);
    setAdminMessage("Εκτέλεση ενέργειας...");

    const payload = await postJson(
      API.adminDecision,
      adminDecisionBody(code, decision, record),
      code
    );

    if (!payload.ok) {
      setAdminMessage(payload.error || "Η ενέργεια δεν ολοκληρώθηκε.");
      setAdminLoading(false);
      return;
    }

    setAdminMessage("Η ενέργεια ολοκληρώθηκε.");
    await loadAdminRequests();
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
          Εδώ γίνεται η αίτηση πρόσβασης νέου χρήστη και ο founder/admin
          έλεγχος για pending requests και approved users. Οι approved χρήστες
          δεν ξαναβλέπουν αίτηση και οδηγούνται στον χάρτη.
        </p>

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
              onClick={submitAccessRequest}
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

        <div className="mt-8 rounded-3xl border border-[#d8b45f]/25 bg-[#07101e] p-5">
          <button
            type="button"
            onClick={() => setAdminOpen((value) => !value)}
            className="w-full rounded-2xl border border-[#d8b45f]/50 px-5 py-3 text-left font-black text-[#f3db9d]"
          >
            Founder/Admin: pending requests και approved users
          </button>

          {adminOpen ? (
            <div className="mt-5">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  type="password"
                  value={founderCode}
                  onChange={(event) => setFounderCode(event.target.value)}
                  placeholder="Founder/admin κωδικός"
                  className="rounded-2xl border border-white/15 bg-[#06101f] px-4 py-3 text-white outline-none focus:border-[#d8b45f]"
                />
                <button
                  type="button"
                  onClick={loadAdminRequests}
                  disabled={adminLoading}
                  className="rounded-2xl bg-[#d8b45f] px-5 py-3 font-black text-[#07101e] disabled:opacity-60"
                >
                  Φόρτωση
                </button>
              </div>

              {adminMessage ? (
                <p className="mt-3 text-sm font-bold text-[#f3db9d]">
                  {adminMessage}
                </p>
              ) : null}

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <section className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-xl font-black text-[#d8b45f]">
                    Pending requests ({pendingRequests.length})
                  </h3>

                  <div className="mt-4 space-y-3">
                    {pendingRequests.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        Δεν υπάρχουν pending requests.
                      </p>
                    ) : (
                      pendingRequests.map((record) => (
                        <div
                          key={recordKey(record)}
                          className="rounded-2xl border border-white/10 bg-[#07101e] p-4"
                        >
                          <p className="font-black">{recordName(record)}</p>
                          <p className="mt-1 text-sm text-slate-300">
                            {record.phone || "χωρίς τηλέφωνο"} ·{" "}
                            {record.roleTitle || record.title || "χωρίς ρόλο"}
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {record.requestId || record.id || record.deviceId}
                          </p>

                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            <button
                              type="button"
                              onClick={() =>
                                void runAdminAction("approve", record)
                              }
                              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-black text-[#07101e]"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => void runAdminAction("reject", record)}
                              className="rounded-xl bg-red-400 px-4 py-2 text-sm font-black text-[#07101e]"
                            >
                              Delete / Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-xl font-black text-[#d8b45f]">
                    Approved users ({approvedUsers.length})
                  </h3>

                  <div className="mt-4 space-y-3">
                    {approvedUsers.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        Δεν υπάρχουν approved users ή δεν φορτώθηκαν ακόμα.
                      </p>
                    ) : (
                      approvedUsers.map((record) => (
                        <div
                          key={recordKey(record)}
                          className="rounded-2xl border border-white/10 bg-[#07101e] p-4"
                        >
                          <p className="font-black">{recordName(record)}</p>
                          <p className="mt-1 text-sm text-slate-300">
                            {record.phone || "χωρίς τηλέφωνο"} ·{" "}
                            {record.roleTitle || record.title || "approved"}
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {record.deviceId || record.id || record.requestId}
                          </p>

                          <button
                            type="button"
                            onClick={() => void runAdminAction("revoke", record)}
                            className="mt-3 rounded-xl border border-red-400/50 px-4 py-2 text-sm font-black text-red-200"
                          >
                            Revoke access
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}