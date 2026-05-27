"use client";

import { useEffect, useMemo, useState } from "react";

type WaterAccessRequest = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  organization?: string;
  emailOrPhone: string;
  reason?: string;
  status: string;
  createdAt: string;
  deviceId?: string;
  deviceLabel?: string;
  hasDeviceToken?: boolean;
};

const FOUNDER_CODE_STORAGE_KEY = "pantavion.water.admin.founderCode.v1";
const PANTAVION_WATER_DEVICE_ID_KEY = "pantavion:water:device-id:v1";
const PANTAVION_WATER_DEVICE_TOKEN_KEY = "pantavion:water:device-token:v1";
const PANTAVION_WATER_PENDING_REQUEST_KEY = "pantavion:water:pending-request-id:v1";

function randomWaterDeviceSecret() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const values = window.crypto.getRandomValues(new Uint32Array(4));

    return Array.from(values)
      .map((value) => value.toString(36))
      .join("");
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateWaterAccessDevice() {
  if (typeof window === "undefined") {
    return {
      deviceId: "",
      deviceToken: "",
      deviceLabel: "",
    };
  }

  let deviceId = window.localStorage.getItem(PANTAVION_WATER_DEVICE_ID_KEY) || "";
  let deviceToken = window.localStorage.getItem(PANTAVION_WATER_DEVICE_TOKEN_KEY) || "";

  if (!deviceId) {
    deviceId = `water-device-${Date.now().toString(36)}-${randomWaterDeviceSecret()}`;
    window.localStorage.setItem(PANTAVION_WATER_DEVICE_ID_KEY, deviceId);
  }

  if (!deviceToken) {
    deviceToken = `water-token-${randomWaterDeviceSecret()}-${randomWaterDeviceSecret()}`;
    window.localStorage.setItem(PANTAVION_WATER_DEVICE_TOKEN_KEY, deviceToken);
  }

  return {
    deviceId,
    deviceToken,
    deviceLabel: `${window.navigator.platform || "unknown"} / ${window.navigator.userAgent.slice(0, 90)}`,
  };
}

function getSavedFounderCode() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(FOUNDER_CODE_STORAGE_KEY) || "";
}

function rememberFounderCode(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOUNDER_CODE_STORAGE_KEY, value);
}

function getPendingRequestId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PANTAVION_WATER_PENDING_REQUEST_KEY) || "";
}

function rememberPendingRequestId(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PANTAVION_WATER_PENDING_REQUEST_KEY, value);
}


function WaterLiveIntelligenceViewSelector() {
  const views = [
    {
      key: "operational_map",
      label: "Operational",
      title: "Î›ÎµÎ¹Ï„Î¿Ï…ÏÎ³Î¹ÎºÏŒÏ‚ Ï‡Î¬ÏÏ„Î·Ï‚",
      detail: "Î‘ÏƒÏ†Î±Î»Î­Ï‚ layer Î³Î¹Î± ÎºÎ±Î¸Î·Î¼ÎµÏÎ¹Î½Î® Ï‡ÏÎ®ÏƒÎ·, ÎµÏÎ³Î±ÏƒÎ¯ÎµÏ‚, Î²Î»Î¬Î²ÎµÏ‚ ÎºÎ±Î¹ Ï€ÎµÎ´Î¯Î¿.",
    },
    {
      key: "master_map",
      label: "Master",
      title: "Master Ï‡Î¬ÏÏ„Î·Ï‚",
      detail: "Î Î»Î®ÏÎµÏ‚ Ï€ÏÎ¿ÏƒÏ„Î±Ï„ÎµÏ…Î¼Î­Î½Î¿ Î´Î¯ÎºÏ„Ï…Î¿. Î˜Î­Î»ÎµÎ¹ founder/admin Î® ÎµÎ³ÎºÎµÎºÏÎ¹Î¼Î­Î½Î· Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ·.",
    },
    {
      key: "terrain_elevation_map",
      label: "Terrain",
      title: "Î¥ÏˆÏŒÎ¼ÎµÏ„ÏÎ± / Î¼Î¿ÏÏ†Î¿Î»Î¿Î³Î¯Î±",
      detail: "Î’Î¬ÏƒÎ· Î³Î¹Î± Ï…ÏˆÎ¿Î¼ÎµÏ„ÏÎ¹ÎºÎ­Ï‚ Î´Î¹Î±Ï†Î¿ÏÎ­Ï‚, Ï€Î¹Î¸Î±Î½Î­Ï‚ Ï€Î¹Î­ÏƒÎµÎ¹Ï‚ ÎºÎ±Î¹ Ï…Î´ÏÎ±Ï…Î»Î¹ÎºÎ® Î±Î¾Î¹Î¿Î»ÏŒÎ³Î·ÏƒÎ·.",
    },
    {
      key: "pressure_risk_map",
      label: "Pressure Risk",
      title: "Î¡Î¯ÏƒÎºÎ¿ Ï€Î¯ÎµÏƒÎ·Ï‚",
      detail: "Î•Î½Î´ÎµÎ¯Î¾ÎµÎ¹Ï‚ Î³Î¹Î± Ï‡Î±Î¼Î·Î»Î®/Ï…ÏˆÎ·Î»Î® Ï€Î¯ÎµÏƒÎ·, Î±Î´ÏÎ½Î±Ï„Î± ÏƒÎ·Î¼ÎµÎ¯Î± ÎºÎ±Î¹ Î±Î½Î¬Î³ÎºÎ· Î¼ÎµÏ„ÏÎ®ÏƒÎµÏ‰Î½.",
    },
    {
      key: "demand_growth_map",
      label: "Demand Growth",
      title: "Î‘Î½Î¬Ï€Ï„Ï…Î¾Î· / Î¶Î®Ï„Î·ÏƒÎ·",
      detail: "Î Î¿Î»Ï…ÎºÎ±Ï„Î¿Î¹ÎºÎ¯ÎµÏ‚, Ï€Î»Î·Î¸Ï…ÏƒÎ¼Î¹Î±ÎºÎ® Î±Î½Î¬Ï€Ï„Ï…Î¾Î·, Î½Î­Î± Ï†Î¿ÏÏ„Î¯Î± ÏƒÎµ Ï€Î±Î»Î¹ÏŒ Î´Î¯ÎºÏ„Ï…Î¿.",
    },
    {
      key: "prv_candidate_map",
      label: "PRV",
      title: "PRV candidates",
      detail: "Î Î¹Î¸Î±Î½Î­Ï‚ Ï€ÎµÏÎ¹Î¿Ï‡Î­Ï‚ Î³Î¹Î± pressure reducing valve Î® engineering review.",
    },
  ] as const;

  return (
    <section className="mt-6 rounded-3xl border border-[#f2c766]/40 bg-[#07111f]/95 p-5 shadow-2xl">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f2c766]">
            Pantavion Water Intelligence Views
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Î•Ï€Î¹Î»Î¿Î³Î® Ï‡Î¬ÏÏ„Î· / AI hydraulic layers
          </h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-300">
            Î”Î¹Î¬Î»ÎµÎ¾Îµ ÎµÏ€Î¹Ï‡ÎµÎ¹ÏÎ·ÏƒÎ¹Î±ÎºÎ® Ï€ÏÎ¿Î²Î¿Î»Î®, master view, terrain, pressure risk,
            demand growth Î® PRV candidates. Î¤Î¿ AI ÎµÎ¹ÏƒÎ·Î³ÎµÎ¯Ï„Î±Î¹, Î±Î»Î»Î¬ ÎºÎ±Î¼Î¯Î± master
            Î® Ï…Î´ÏÎ±Ï…Î»Î¹ÎºÎ® Î±Î»Î»Î±Î³Î® Î´ÎµÎ½ ÎµÎ³ÎºÏÎ¯Î½ÎµÏ„Î±Î¹ Ï‡Ï‰ÏÎ¯Ï‚ Î¬Î½Î¸ÏÏ‰Ï€Î¿, audit ÎºÎ±Î¹ approval.
          </p>
        </div>
        <div className="rounded-2xl border border-[#f2c766]/30 bg-[#f2c766]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#f2c766]">
          Live foundation
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {views.map((view) => (
          <a
            key={view.key}
            href={`/professional/infrastructure/water?view=${view.key}`}
            className="group rounded-2xl border border-slate-700 bg-[#0d1a2d] p-4 transition hover:border-[#f2c766]/70 hover:bg-[#10213a]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-white">{view.label}</p>
              <span className="rounded-full border border-[#f2c766]/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#f2c766]">
                open
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-[#f2c766]">{view.title}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
              {view.detail}
            </p>
          </a>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-700 bg-black/25 p-4">
        <p className="text-sm font-black text-white">AI / Kernel boundary</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
          Master, pressure, terrain, demand ÎºÎ±Î¹ PRV layers ÎµÎ¯Î½Î±Î¹ protected engineering
          views. Î¤Î¿ Pantavion Î¼Ï€Î¿ÏÎµÎ¯ Î½Î± Î±Î½Î±Î»ÏÎµÎ¹, Î½Î± Ï€ÏÎ¿Ï„ÎµÎ¯Î½ÎµÎ¹, Î½Î± Î¶Î·Ï„Î¬ Î¼ÎµÏ„ÏÎ®ÏƒÎµÎ¹Ï‚
          ÎºÎ±Î¹ Î½Î± Ï†Ï„Î¹Î¬Ï‡Î½ÎµÎ¹ dossier, Î±Î»Î»Î¬ Î´ÎµÎ½ Î±Î»Î»Î¬Î¶ÎµÎ¹ master Ï‡Î¬ÏÏ„Î· Î® Ï…Î´ÏÎ±Ï…Î»Î¹ÎºÏŒ ÏƒÏ‡ÎµÎ´Î¹Î±ÏƒÎ¼ÏŒ
          Ï‡Ï‰ÏÎ¯Ï‚ founder/admin Î® engineer approval.
        </p>
      </div>
    </section>
  );
}
export default function WaterEntryClient() {
  const [founderCode, setFounderCode] = useState("");
  const [showFounderLogin, setShowFounderLogin] = useState(false);
  const [adminTrusted, setAdminTrusted] = useState(false);
  const [accessApproved, setAccessApproved] = useState(false);

  const [requests, setRequests] = useState<WaterAccessRequest[]>([]);
  const [adminMessage, setAdminMessage] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [pendingRequestId, setPendingRequestId] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("");

  const [loading, setLoading] = useState(false);

  async function checkApprovedDevice() {
    const device = getOrCreateWaterAccessDevice();

    if (!device.deviceId || !device.deviceToken) return;

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/authorize", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          deviceId: device.deviceId,
          deviceToken: device.deviceToken,
        }),
      });

      const json = (await response.json()) as { ok?: boolean };

      if (response.ok && json.ok) {
        setAccessApproved(true);
      }
    } catch {
      // Keep user on request screen if the device is not approved yet.
    }
  }

  async function loadAdminRequests(codeOverride?: string) {
    const codeToUse = (codeOverride || founderCode || getSavedFounderCode()).trim();

    if (!codeToUse) {
      setAdminMessage("Î’Î¬Î»Îµ founder/admin ÎºÏ‰Î´Î¹ÎºÏŒ.");
      return;
    }

    setLoading(true);
    setAdminMessage("Î¦ÏŒÏÏ„Ï‰ÏƒÎ· Î±Î¹Ï„Î·Î¼Î¬Ï„Ï‰Î½...");

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/admin/requests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ founderCode: codeToUse }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        requests?: WaterAccessRequest[];
        error?: string;
        blobCount?: number;
        readCount?: number;
        skippedCount?: number;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "requests_failed");
      }

      setFounderCode(codeToUse);
      rememberFounderCode(codeToUse);
      setAdminTrusted(true);
      setShowFounderLogin(false);
      setRequests(json.requests || []);
      setAdminMessage(
        `Î‘Î¹Ï„Î®Î¼Î±Ï„Î±: ${json.requests?.length || 0}. Blob: ${json.blobCount || 0}, Î´Î¹Î±Î²Î¬ÏƒÏ„Î·ÎºÎ±Î½: ${json.readCount || 0}, skipped: ${json.skippedCount || 0}.`,
      );
    } catch {
      setAdminTrusted(false);
      setAdminMessage("Î”ÎµÎ½ Ï†Î¿ÏÏ„ÏŽÎ¸Î·ÎºÎ±Î½ Ï„Î± Î±Î¹Ï„Î®Î¼Î±Ï„Î±. ÎˆÎ»ÎµÎ³Î¾Îµ Ï„Î¿Î½ founder/admin ÎºÏ‰Î´Î¹ÎºÏŒ.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAccessRequest() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !roleTitle.trim()) {
      setRequestMessage("Î£Ï…Î¼Ï€Î»Î®ÏÏ‰ÏƒÎµ ÏŒÎ½Î¿Î¼Î±, ÎµÏ€Î¯Î¸ÎµÏ„Î¿, Ï„Î·Î»Î­Ï†Ï‰Î½Î¿ ÎºÎ±Î¹ ÏÏŒÎ»Î¿.");
      return;
    }

    const device = getOrCreateWaterAccessDevice();

    setLoading(true);
    setRequestMessage("Î‘Î¯Ï„Î·Î¼Î± Ï€ÏÎ¿Ï‚ Î±Ï€Î¿ÏƒÏ„Î¿Î»Î®...");

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          title: roleTitle,
          emailOrPhone: phone,
          reason: "Water infrastructure access request",
          deviceId: device.deviceId,
          deviceToken: device.deviceToken,
          deviceLabel: device.deviceLabel,
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        requestId?: string;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "request_failed");
      }

      if (json.requestId) {
        rememberPendingRequestId(json.requestId);
        setPendingRequestId(json.requestId);
      }

      setRequestMessage(
        `Î‘Î½Î±Î¼Î¿Î½Î® Ï€ÏÎ¿Ï‚ Î­Î³ÎºÏÎ¹ÏƒÎ·. Î¤Î¿ Î±Î¯Ï„Î·Î¼Î¬ ÏƒÎ¿Ï… ÏƒÏ„Î¬Î»Î¸Î·ÎºÎµ. ÎœÎµÎ¯Î½Îµ ÏƒÏ„Î·Î½ Î¯Î´Î¹Î± ÏƒÏ…ÏƒÎºÎµÏ…Î® Î¼Î­Ï‡ÏÎ¹ Î½Î± ÎµÎ³ÎºÏÎ¹Î¸ÎµÎ¯Ï‚.${json.requestId ? ` Request ID: ${json.requestId}` : ""}`,
      );
    } catch {
      setRequestMessage("Î”ÎµÎ½ ÏƒÏ„Î¬Î»Î¸Î·ÎºÎµ Ï„Î¿ Î±Î¯Ï„Î·Î¼Î±. Î”Î¿ÎºÎ¯Î¼Î±ÏƒÎµ Î¾Î±Î½Î¬.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(request: WaterAccessRequest, decision: "approve" | "reject" | "revoke") {
    const codeToUse = (founderCode || getSavedFounderCode()).trim();

    if (!codeToUse) {
      setAdminMessage("Î§ÏÎµÎ¹Î¬Î¶ÎµÏ„Î±Î¹ founder/admin ÎºÏ‰Î´Î¹ÎºÏŒÏ‚.");
      return;
    }

    if (decision === "approve" && !request.hasDeviceToken) {
      setAdminMessage("Î Î±Î»Î¹Î¬ Î±Î¯Ï„Î·ÏƒÎ· Ï‡Ï‰ÏÎ¯Ï‚ Î±ÏƒÏ†Î±Î»Î­Ï‚ device token. Î–Î®Ï„Î·ÏƒÎµ Î½Î­Î± Î±Î¯Ï„Î·ÏƒÎ· Î±Ï€ÏŒ Ï„Î¿ ÎºÎ¹Î½Î·Ï„ÏŒ Ï„Î¿Ï… Ï‡ÏÎ®ÏƒÏ„Î·.");
      return;
    }

    setLoading(true);
    setAdminMessage(
      decision === "approve"
        ? "ÎˆÎ³ÎºÏÎ¹ÏƒÎ· ÏƒÏ…ÏƒÎºÎµÏ…Î®Ï‚..."
        : decision === "revoke"
          ? "Î£Ï„Î±Î¼Î¬Ï„Î·Î¼Î± Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ·Ï‚..."
          : "Î‘Ï€ÏŒÏÏÎ¹ÏˆÎ·...",
    );

    try {
      const response = await fetch("/api/professional/infrastructure/water/access/admin/decision", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          founderCode: codeToUse,
          requestId: request.id,
          decision,
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "decision_failed");
      }

      setAdminMessage(
        decision === "approve"
          ? "Î•Î³ÎºÏÎ¯Î¸Î·ÎºÎµ Î· ÏƒÏ…Î³ÎºÎµÎºÏÎ¹Î¼Î­Î½Î· ÏƒÏ…ÏƒÎºÎµÏ…Î®."
          : decision === "revoke"
            ? "Î— Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ· ÏƒÏ„Î±Î¼Î¬Ï„Î·ÏƒÎµ Î³Î¹Î± Î±Ï…Ï„Î® Ï„Î· ÏƒÏ…ÏƒÎºÎµÏ…Î®."
            : "Î‘Ï€Î¿ÏÏÎ¯Ï†Î¸Î·ÎºÎµ.",
      );

      await loadAdminRequests(codeToUse);
    } catch {
      setAdminMessage("Î— Î±Ï€ÏŒÏ†Î±ÏƒÎ· Î´ÎµÎ½ Î±Ï€Î¿Î¸Î·ÎºÎµÏÏ„Î·ÎºÎµ.");
    } finally {
      setLoading(false);
    }
  }

  function forgetAdminDevice() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(FOUNDER_CODE_STORAGE_KEY);
    }

    setFounderCode("");
    setAdminTrusted(false);
    setRequests([]);
    setAdminMessage("Î— founder/admin ÏƒÏ…ÏƒÎºÎµÏ…Î® ÎºÎ±Î¸Î±ÏÎ¯ÏƒÏ„Î·ÎºÎµ.");
  }

  useEffect(() => {
    const savedFounderCode = getSavedFounderCode();
    const savedPendingRequestId = getPendingRequestId();

    if (savedPendingRequestId) {
      setPendingRequestId(savedPendingRequestId);
      setRequestMessage(`Î‘Î½Î±Î¼Î¿Î½Î® Ï€ÏÎ¿Ï‚ Î­Î³ÎºÏÎ¹ÏƒÎ·. Request ID: ${savedPendingRequestId}`);
    }

    if (savedFounderCode) {
      setFounderCode(savedFounderCode);
      setAdminTrusted(true);
      void loadAdminRequests(savedFounderCode);
      return;
    }

    void checkApprovedDevice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === "pending_founder_review").length,
      approved: requests.filter((item) => item.status === "approved").length,
      rejected: requests.filter((item) => item.status === "rejected").length,
      revoked: requests.filter((item) => item.status === "revoked").length,
      deviceReady: requests.filter((item) => item.hasDeviceToken).length,
    };
  }, [requests]);

  if (adminTrusted) {
    return (
      <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
        <section className="mx-auto w-full max-w-6xl rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-[#f2c766]">
            PANTAVION WATER FOUNDER CONTROL
          </p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-black">Î‘Î¹Ï„Î®Î¼Î±Ï„Î± Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ·Ï‚ ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Î•Î´ÏŽ Î²Î»Î­Ï€ÎµÎ¹Ï‚ Î¼ÏŒÎ½Î¿ founder/admin Î­Î»ÎµÎ³Ï‡Î¿. ÎŸÎ¹ Î±Ï€Î»Î¿Î¯ Ï‡ÏÎ®ÏƒÏ„ÎµÏ‚ Î´ÎµÎ½ Î²Î»Î­Ï€Î¿Ï…Î½ Î±Ï…Ï„Î® Ï„Î·Î½ Î¿Î¸ÏŒÎ½Î·.
              </p>
            </div>

            <a
              href="/professional/infrastructure/water/live"
              className="rounded-2xl border border-[#f2c766]/70 bg-[#f2c766]/15 px-5 py-3 text-center font-black text-[#f8e6ad]"
            >
              Î†Î½Î¿Î¹Î³Î¼Î± Ï‡Î¬ÏÏ„Î·
            </a>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl border border-slate-700 bg-[#07111f] p-4">
              <p className="text-xs text-slate-400">Î£ÏÎ½Î¿Î»Î¿</p>
              <p className="text-2xl font-black text-[#f2c766]">{counts.total}</p>
            </div>
            <div className="rounded-2xl border border-amber-600/50 bg-amber-950/20 p-4">
              <p className="text-xs text-amber-100/70">Î£Îµ Î±Î½Î±Î¼Î¿Î½Î®</p>
              <p className="text-2xl font-black text-amber-100">{counts.pending}</p>
            </div>
            <div className="rounded-2xl border border-emerald-600/50 bg-emerald-950/20 p-4">
              <p className="text-xs text-emerald-100/70">Î•Î³ÎºÎµÎºÏÎ¹Î¼Î­Î½Î±</p>
              <p className="text-2xl font-black text-emerald-100">{counts.approved}</p>
            </div>
            <div className="rounded-2xl border border-red-600/50 bg-red-950/20 p-4">
              <p className="text-xs text-red-100/70">Î‘Ï€Î¿ÏÏÎ¯ÏˆÎµÎ¹Ï‚</p>
              <p className="text-2xl font-black text-red-100">{counts.rejected}</p>
            </div>
            <div className="rounded-2xl border border-zinc-500/50 bg-zinc-950/30 p-4">
              <p className="text-xs text-zinc-100/70">Î£Ï„Î±Î¼Î±Ï„Î·Î¼Î­Î½Î±</p>
              <p className="text-2xl font-black text-zinc-100">{counts.revoked}</p>
            </div>
            <div className="rounded-2xl border border-sky-600/50 bg-sky-950/20 p-4">
              <p className="text-xs text-sky-100/70">ÎœÎµ ÏƒÏ…ÏƒÎºÎµÏ…Î®</p>
              <p className="text-2xl font-black text-sky-100">{counts.deviceReady}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-3xl border border-slate-700 bg-[#07111f] p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={founderCode}
                onChange={(event) => setFounderCode(event.target.value)}
                placeholder="Founder/admin ÎºÏ‰Î´Î¹ÎºÏŒÏ‚"
                type="password"
                className="rounded-2xl border border-[#b89445]/60 bg-[#0d1a2d] px-4 py-3 text-white outline-none sm:col-span-2"
              />

              <button
                type="button"
                onClick={() => void loadAdminRequests()}
                disabled={loading}
                className="rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
              >
                Î¦ÏŒÏÏ„Ï‰ÏƒÎ· Î±Î¹Ï„Î·Î¼Î¬Ï„Ï‰Î½
              </button>
            </div>

            <button
              type="button"
              onClick={forgetAdminDevice}
              disabled={loading}
              className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-5 py-3 font-black text-slate-100 disabled:opacity-60"
            >
              ÎžÎ­Ï‡Î½Î± Î±Ï…Ï„Î® Ï„Î· founder/admin ÏƒÏ…ÏƒÎºÎµÏ…Î®
            </button>

            {adminMessage ? <p className="text-sm font-bold text-[#f2c766]">{adminMessage}</p> : null}
          </div>

          <div className="mt-6 grid gap-4">
            {requests.map((item) => {
              const pending = item.status === "pending_founder_review";
              const approved = item.status === "approved";
              const canApprove = pending && item.hasDeviceToken === true;

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-700 bg-[#07111f] p-4"
                >
                  <div className="grid gap-2">
                    <p className="text-xl font-black">
                      {item.firstName} {item.lastName}
                    </p>
                    <p className="text-sm text-slate-300">Î¡ÏŒÎ»Î¿Ï‚: {item.title}</p>
                    <p className="text-sm text-slate-300">Î¤Î·Î»Î­Ï†Ï‰Î½Î¿: {item.emailOrPhone}</p>
                    <p className="text-sm text-slate-300">ÎšÎ±Ï„Î¬ÏƒÏ„Î±ÏƒÎ·: {item.status}</p>
                    <p className="text-sm text-slate-300">
                      Î£Ï…ÏƒÎºÎµÏ…Î®: {item.hasDeviceToken ? item.deviceLabel || item.deviceId || "Î´ÎµÎ¼Î­Î½Î· ÏƒÏ…ÏƒÎºÎµÏ…Î®" : "Ï€Î±Î»Î¹ÏŒ Î±Î¯Ï„Î·Î¼Î± Ï‡Ï‰ÏÎ¯Ï‚ Î±ÏƒÏ†Î±Î»Î® ÏƒÏ…ÏƒÎºÎµÏ…Î®"}
                    </p>
                    <p className="text-xs text-slate-500">{item.createdAt}</p>

                    {!item.hasDeviceToken ? (
                      <p className="rounded-2xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm font-bold text-amber-100">
                        Î Î±Î»Î¹Î¬ Î±Î¯Ï„Î·ÏƒÎ· Ï‡Ï‰ÏÎ¯Ï‚ Î±ÏƒÏ†Î±Î»Î­Ï‚ device token. Î–Î®Ï„Î·ÏƒÎµ Î½Î­Î± Î±Î¯Ï„Î·ÏƒÎ· Î±Ï€ÏŒ Ï„Î¿ ÎºÎ¹Î½Î·Ï„ÏŒ Ï„Î¿Ï… Ï‡ÏÎ®ÏƒÏ„Î·.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => void decide(item, "approve")}
                      disabled={loading || !canApprove}
                      className="rounded-2xl border border-emerald-500 bg-emerald-950/40 px-5 py-3 font-black text-emerald-100 disabled:opacity-50"
                    >
                      Î•Î³ÎºÏÎ¯Î½Ï‰ Ï„Î· ÏƒÏ…ÏƒÎºÎµÏ…Î®
                    </button>

                    <button
                      type="button"
                      onClick={() => void decide(item, "reject")}
                      disabled={loading || item.status === "rejected" || item.status === "revoked"}
                      className="rounded-2xl border border-red-500 bg-red-950/40 px-5 py-3 font-black text-red-100 disabled:opacity-50"
                    >
                      Î‘Ï€ÏŒÏÏÎ¹ÏˆÎ·
                    </button>

                    <button
                      type="button"
                      onClick={() => void decide(item, "revoke")}
                      disabled={loading || !approved}
                      className="rounded-2xl border border-zinc-400 bg-zinc-950/40 px-5 py-3 font-black text-zinc-100 disabled:opacity-50"
                    >
                      Î£Ï„Î±Î¼Î¬Ï„Î·Î¼Î± Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ·Ï‚
                    </button>
                  </div>
                </article>
              );
            })}

            {requests.length === 0 ? (
              <p className="rounded-3xl border border-slate-700 bg-[#07111f] p-4 text-slate-300">
                Î”ÎµÎ½ ÎµÎ¼Ï†Î±Î½Î¯Î¶Î¿Î½Ï„Î±Î¹ Î±Î¹Ï„Î®Î¼Î±Ï„Î± Î±ÎºÏŒÎ¼Î·.
              </p>
            ) : null}
          </div>
        </section>
      
      {/* pantavion_abc_mobile_entry_v1 */}
      <section
        data-pantavion-abc-mobile-entry-v1="true"
        className="mt-6 rounded-3xl border border-[#d8b45f]/40 bg-[#d8b45f]/10 p-4"
      >
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d8b45f]">
          Pantavion Water Maps
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">
          A / B / C Water Maps
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          A Map live, B Master DWG private vault και C Intelligent Map foundation.
        </p>
        <a
          href="/professional/infrastructure/water/maps"
          className="mt-4 block rounded-2xl bg-[#d8b45f] px-4 py-3 text-center text-sm font-black text-[#07101e]"
        >
          Άνοιγμα A / B / C Maps
        </a>
      </section>
    </main>
    );
  }

  if (accessApproved) {
    return (
      <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
        <section className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center">
          <div className="w-full rounded-3xl border border-emerald-600/50 bg-[#0d1a2d] p-5 shadow-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-emerald-200">
              PANTAVION WATER ACCESS
            </p>
            <h1 className="text-3xl font-black">Î— Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ® ÏƒÎ¿Ï… Î­Ï‡ÎµÎ¹ ÎµÎ³ÎºÏÎ¹Î¸ÎµÎ¯</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Î— ÏƒÏ…Î³ÎºÎµÎºÏÎ¹Î¼Î­Î½Î· ÏƒÏ…ÏƒÎºÎµÏ…Î® Î­Ï‡ÎµÎ¹ ÎµÎ³ÎºÏÎ¹Î¸ÎµÎ¯ Î³Î¹Î± Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ· ÏƒÏ„Î¿ Î´Î¯ÎºÏ„Ï…Î¿ ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚.
            </p>
            <a
              href="/professional/infrastructure/water/live"
              className="mt-6 block rounded-2xl bg-[#f2c766] px-5 py-4 text-center font-black text-black"
            >
              Î†Î½Î¿Î¹Î³Î¼Î± Ï‡Î¬ÏÏ„Î· ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white">
      <section className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center">
        <div className="w-full rounded-3xl border border-[#b89445]/50 bg-[#0d1a2d] p-5 shadow-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-[#f2c766]">
            PANTAVION PROTECTED WATER ACCESS
          </p>

          <h1 className="text-3xl font-black">Î‘Î¯Ï„Î·ÏƒÎ· Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ·Ï‚ ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚</h1>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Î“Î¹Î± Ï€ÏÏŽÏ„Î· Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ· ÏƒÏ…Î¼Ï€Î»Î®ÏÏ‰ÏƒÎµ Ï„Î± ÏƒÏ„Î¿Î¹Ï‡ÎµÎ¯Î± ÏƒÎ¿Ï…. Î— Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ· Î¸Î± ÎµÎ½ÎµÏÎ³Î¿Ï€Î¿Î¹Î·Î¸ÎµÎ¯ Î¼ÏŒÎ½Î¿ Î±Ï†Î¿Ï ÎµÎ³ÎºÏÎ¹Î¸ÎµÎ¯ Î±Ï€ÏŒ Ï…Ï€ÎµÏÎ¸Ï…Î½Î¿ Pantavion.
          </p>

          <div className="mt-6 grid gap-3 rounded-3xl border border-slate-700 bg-[#07111f] p-4">
            <p className="text-sm font-black text-[#f2c766]">Î‘Î¯Ï„Î·Î¼Î± Ï€ÏÎ¿Ï‚ Î±Ï€Î¿ÏƒÏ„Î¿Î»Î®</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="ÎŒÎ½Î¿Î¼Î±"
                className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
              />
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Î•Ï€Î¯Î¸ÎµÏ„Î¿"
                className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Î¤Î·Î»Î­Ï†Ï‰Î½Î¿"
                className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
              />
              <input
                value={roleTitle}
                onChange={(event) => setRoleTitle(event.target.value)}
                placeholder="Î¡ÏŒÎ»Î¿Ï‚ / Î¤Î¯Ï„Î»Î¿Ï‚"
                className="rounded-2xl border border-slate-600 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => void submitAccessRequest()}
              disabled={loading}
              className="rounded-2xl border border-[#f2c766]/70 bg-[#f2c766]/15 px-5 py-4 text-base font-black text-[#f8e6ad] disabled:opacity-60"
            >
              Î‘Ï€Î¿ÏƒÏ„Î¿Î»Î® Î±Î¯Ï„Î·ÏƒÎ·Ï‚ Î³Î¹Î± Î­Î³ÎºÏÎ¹ÏƒÎ·
            </button>

            <div className="rounded-2xl border border-slate-700 bg-[#0d1a2d] px-4 py-3 text-sm text-slate-200">
              {requestMessage || (pendingRequestId ? `Î‘Î½Î±Î¼Î¿Î½Î® Ï€ÏÎ¿Ï‚ Î­Î³ÎºÏÎ¹ÏƒÎ·. Request ID: ${pendingRequestId}` : "Î‘Î½Î±Î¼Î¿Î½Î® Ï€ÏÎ¿Ï‚ Î­Î³ÎºÏÎ¹ÏƒÎ· Î¼ÎµÏ„Î¬ Ï„Î·Î½ Î±Ï€Î¿ÏƒÏ„Î¿Î»Î®.")}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-700 pt-4">
            <button
              type="button"
              onClick={() => setShowFounderLogin((value) => !value)}
              className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
            >
              Î•Î¯ÏƒÎ¿Î´Î¿Ï‚ Ï…Ï€ÎµÏÎ¸Ï…Î½Î¿Ï… Pantavion
            </button>

            {showFounderLogin ? (
              <div className="mt-3 grid gap-3 rounded-2xl border border-slate-700 bg-[#07111f] p-4">
                <input
                  value={founderCode}
                  onChange={(event) => setFounderCode(event.target.value)}
                  placeholder="Founder/admin ÎºÏ‰Î´Î¹ÎºÏŒÏ‚"
                  type="password"
                  className="rounded-2xl border border-[#b89445]/60 bg-[#0d1a2d] px-4 py-3 text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => void loadAdminRequests()}
                  disabled={loading}
                  className="rounded-2xl bg-[#f2c766] px-5 py-3 font-black text-black disabled:opacity-60"
                >
                  Î†Î½Î¿Î¹Î³Î¼Î± founder/admin ÎµÎ»Î­Î³Ï‡Î¿Ï…
                </button>
                {adminMessage ? <p className="text-sm font-bold text-[#f2c766]">{adminMessage}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    
      <WaterLiveIntelligenceViewSelector /></main>
  );
}
