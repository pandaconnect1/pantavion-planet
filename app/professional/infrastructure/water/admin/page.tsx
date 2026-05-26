"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WaterRequest = {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  organization?: string;
  createdAt?: string;
  deviceId?: string;
  deviceLabel?: string;
  hasDeviceToken?: boolean;
};

function makeToken() {
  return `water-founder-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readStoredFounderCode() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("pantavion_water_founder_code") || "";
}

function readOrCreateFounderDevice() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem("pantavion_water_founder_device_id");
  if (existing) return existing;
  const next = makeToken();
  window.localStorage.setItem("pantavion_water_founder_device_id", next);
  return next;
}

export default function WaterAdminPage() {
  const [founderCode, setFounderCode] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [requests, setRequests] = useState<WaterRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [message, setMessage] = useState("Founder/admin mobile access required.");

  const unlocked = useMemo(() => Boolean(founderCode && deviceId), [founderCode, deviceId]);

  useEffect(() => {
    const savedCode = readStoredFounderCode();
    const device = readOrCreateFounderDevice();
    setFounderCode(savedCode);
    setDeviceId(device);
  }, []);

  async function unlockFounder() {
    const code = founderCode.trim();
    if (!code) {
      setMessage("Enter founder/admin code first.");
      return;
    }

    window.localStorage.setItem("pantavion_water_founder_code", code);
    const device = readOrCreateFounderDevice();
    setDeviceId(device);
    setMessage("FOUNDER STATUS: UNLOCKED. Founder/admin mobile access saved.");
    await loadRequests();
  }

  async function loadRequests() {
    setLoading(true);
    setMessage("Loading water access requests...");

    try {
      const res = await fetch("/api/professional/infrastructure/water/access/admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "founder-admin-inbox", founderCode: founderCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "requests_failed");
      }

      setRequests(Array.isArray(data.requests) ? data.requests : []);
      setMessage(`Loaded ${Array.isArray(data.requests) ? data.requests.length : 0} request(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load requests.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(request: WaterRequest, decision: "approve" | "reject") {
    if (!request.id) return;

    setWorkingId(request.id);
    setMessage(`${decision === "approve" ? "Approving" : "Rejecting"} request...`);

    try {
      const res = await fetch("/api/professional/infrastructure/water/access/admin/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pantavion-founder-device": deviceId,
        },
        body: JSON.stringify({
          founderCode: founderCode.trim(),
          requestId: request.id,
          decision,
          phone: request.phone || "",
          deviceId: request.deviceId || "",
          firstName: request.firstName || "",
          lastName: request.lastName || "",
          title: request.title || "",
          organization: request.organization || "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "decision_failed");
      }

      setMessage(`Request ${decision === "approve" ? "approved" : "rejected"} successfully.`);
      await loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Decision failed.");
    } finally {
      setWorkingId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="mb-5">
          <Link href="/professional/infrastructure/water" className="text-sm text-emerald-300">
            ← Back to Water Infrastructure
          </Link>
        </div>

        <div className="rounded-2xl border border-amber-400/40 bg-black/30 p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            Pantavion Water Admin
          </p>
          <h1 className="mt-2 text-3xl font-black">Founder Mobile Approval Inbox</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
            This page reads real water access requests and allows founder/admin approval without touching the live map,
            approved users, devices, Blob files, or environment variables.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-black/25 p-4">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Founder/admin code
          </label>
          <input
            value={founderCode}
            onChange={(event) => setFounderCode(event.target.value)}
            placeholder="Enter founder/admin code"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={unlockFounder}
              className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-black"
            >
              Unlock founder access
            </button>

            <button
              onClick={loadRequests}
              disabled={!unlocked || loading}
              className="rounded-xl border border-emerald-400/50 px-5 py-3 text-sm font-black text-emerald-200 disabled:opacity-40"
            >
              {loading ? "Loading..." : "Refresh requests"}
            </button>
          </div>

          <p className="mt-3 text-xs font-bold text-slate-400">Device ID: {deviceId || "not set"}</p>
          <p className="mt-2 text-sm font-bold text-emerald-300">{message}</p>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
            Real requests inbox
          </p>

          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No visible access requests returned by the API.</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {requests.map((request) => (
                <article key={request.id} className="rounded-2xl border border-slate-700 bg-black/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-black">
                        {(request.firstName || "").trim()} {(request.lastName || "").trim()}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">Phone: {request.phone || "missing"}</p>
                      <p className="text-sm text-slate-300">Organization: {request.organization || "missing"}</p>
                      <p className="text-sm text-slate-300">Title: {request.title || "missing"}</p>
                      <p className="text-xs text-slate-500">Request ID: {request.id}</p>
                      <p className="text-xs text-slate-500">Device: {request.deviceId || "none"}</p>
                      <p className="text-xs text-slate-500">Created: {request.createdAt || "unknown"}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => decide(request, "approve")}
                        disabled={workingId === request.id}
                        className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-black text-black disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decide(request, "reject")}
                        disabled={workingId === request.id}
                        className="rounded-xl border border-red-400 px-4 py-2 text-sm font-black text-red-200 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
          <p className="text-sm font-bold text-emerald-200">
            Protected: this page does not modify the live map. It only reads requests and sends explicit approve/reject decisions.
          </p>
        </div>
      </section>
    </main>
  );
}




